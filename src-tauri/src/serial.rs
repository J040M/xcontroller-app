//! USB serial transport for the native app.
//!
//! A single worker thread owns the `SerialConnection` and drains an ordered
//! `mpsc` channel. This ordered queue is the whole point: every `invoke`
//! from the webview is an independent IPC call with no ordering guarantee of
//! its own, so without a queue two rapid `sendCommand`s could race onto the
//! port — bad for a printer. The queue also serializes uploads naturally, so
//! no separate single-flight flag is needed.
//!
//! The command/upload handling mirrors the xcontroller WebSocket backend's
//! `wscom.rs` arms so the webview sees byte-identical `MessageSender`
//! payloads regardless of which transport is active.

use std::fs::File;
use std::io::BufReader;
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use marlin_binary_transfer::adapters::blocking::{upload as binary_upload, UploadOptions};

use crate::printer_core::commands::g_command;
use crate::printer_core::parser::{m105, m114, m115, m119, m20, m27, m31, m33};
use crate::printer_core::serialcom::SerialConnection;
use crate::printer_core::structs::{MessageSender, UploadProgress, UploadResult};
use crate::printer_core::upload::{compression_label, resolve_compression, valid_dest_filename};

/// One unit of work for the serial worker thread. Jobs are processed strictly
/// in enqueue order.
enum SerialJob {
    /// A G/M/T command — `incoming_type` is the webview's message type
    /// (`GCommand` / `Terminal` / `Unsafe`), `message` is the command string.
    Command {
        incoming_type: String,
        message: String,
    },
    /// A binary SD-card upload streamed from a local file.
    Upload {
        path: String,
        dest_filename: String,
        compression: Option<String>,
        dummy: bool,
    },
}

/// Managed Tauri state: the channel to the serial worker thread, or `None`
/// when no port is open. The port itself lives on the worker thread.
#[derive(Default)]
pub struct SerialState {
    tx: Mutex<Option<Sender<SerialJob>>>,
}

/// A serial port as reported to the webview's profile editor.
#[derive(Serialize)]
pub struct PortInfo {
    name: String,
    kind: String,
}

fn now_ts() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// Build an error-shaped `MessageSender`, matching `wscom.rs::error_message`.
fn error_message(kind: &str, detail: &str) -> MessageSender {
    MessageSender {
        message_type: kind.to_string(),
        message: detail.to_string(),
        raw_message: detail.to_string(),
        timestamp: now_ts(),
    }
}

/// Emit a `MessageSender` to the webview. `UsbTransport` wraps every
/// `serial-message` as a `MessageEvent`-shaped `'message'` so `client.ts`'s
/// dispatcher handles it identically to a WebSocket frame.
fn emit_message(app: &AppHandle, payload: MessageSender) {
    let _ = app.emit("serial-message", payload);
}

/// Route a raw serial response through the matching M-code parser, mirroring
/// the WebSocket backend's GCommand arm so the webview gets identical bodies.
fn parse_response(cmd: &str, response: String) -> String {
    match cmd.trim() {
        "M20" => serde_json::to_string(&m20(response)).unwrap_or_default(),
        "M27" => serde_json::to_string(&m27(response)).unwrap_or_default(),
        "M27 C" => serde_json::to_string(&m27(response)).unwrap_or_default(),
        "M31" => serde_json::to_string(&m31(response)).unwrap_or_default(),
        "M33" => serde_json::to_string(&m33(response)).unwrap_or_default(),
        "M105" => serde_json::to_string(&m105(response)).unwrap_or_default(),
        "M114" => serde_json::to_string(&m114(response)).unwrap_or_default(),
        "M115" => serde_json::to_string(&m115(response)).unwrap_or_default(),
        "M119" => serde_json::to_string(&m119(response)).unwrap_or_default(),
        _ => response,
    }
}

/// List the serial ports available for connection.
#[tauri::command]
pub fn list_serial_ports() -> Vec<PortInfo> {
    let ports = match serialport::available_ports() {
        Ok(p) => p,
        Err(_) => return Vec::new(),
    };
    ports
        .into_iter()
        // On macOS the dial-in `tty.*` nodes block on open until carrier
        // detect — the `cu.*` callout nodes are the ones to use. Note Linux
        // `ttyUSB*`/`ttyACM*` have no dot, so they are kept.
        .filter(|p| !p.port_name.starts_with("/dev/tty."))
        .map(|p| PortInfo {
            name: p.port_name,
            kind: match p.port_type {
                serialport::SerialPortType::UsbPort(_) => "usb".to_string(),
                serialport::SerialPortType::BluetoothPort => "bluetooth".to_string(),
                serialport::SerialPortType::PciPort => "pci".to_string(),
                serialport::SerialPortType::Unknown => "unknown".to_string(),
            },
        })
        .collect()
}

/// Open a serial port and spawn the worker thread that owns it.
#[tauri::command]
pub fn serial_connect(
    port: String,
    baud: u32,
    state: State<'_, SerialState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut guard = state.tx.lock().map_err(|e| e.to_string())?;
    if guard.is_some() {
        return Err("A serial port is already connected".to_string());
    }
    // Open on the calling thread so the failure (bad port, permission
    // denied) returns synchronously to the webview.
    let connection = SerialConnection::open(&port, baud).map_err(|e| e.to_string())?;

    let (tx, rx) = channel::<SerialJob>();
    let worker_app = app.clone();
    thread::spawn(move || serial_worker(connection, rx, worker_app));
    *guard = Some(tx);
    Ok(())
}

/// Disconnect: drop the channel sender so the worker's `recv` ends and the
/// thread exits, emitting `serial-disconnected` on its way out.
#[tauri::command]
pub fn serial_disconnect(state: State<'_, SerialState>) -> Result<(), String> {
    let mut guard = state.tx.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

/// Enqueue a G/M/T command. Fire-and-forget — the reply arrives later as a
/// `serial-message` event.
#[tauri::command]
pub fn serial_send_command(
    message_type: String,
    message: String,
    state: State<'_, SerialState>,
) -> Result<(), String> {
    let guard = state.tx.lock().map_err(|e| e.to_string())?;
    match guard.as_ref() {
        Some(tx) => tx
            .send(SerialJob::Command {
                incoming_type: message_type,
                message,
            })
            .map_err(|_| "Serial worker is not running".to_string()),
        None => Err("Not connected to a serial port".to_string()),
    }
}

/// Enqueue a binary SD-card upload from a local file path. Progress and the
/// final result arrive as `serial-message` events (`UploadProgress` /
/// `UploadDone` / `UploadError`), exactly as over WebSocket.
#[tauri::command]
pub fn usb_upload(
    path: String,
    dest_filename: String,
    compression: Option<String>,
    dummy: Option<bool>,
    state: State<'_, SerialState>,
) -> Result<(), String> {
    let guard = state.tx.lock().map_err(|e| e.to_string())?;
    match guard.as_ref() {
        Some(tx) => tx
            .send(SerialJob::Upload {
                path,
                dest_filename,
                compression,
                dummy: dummy.unwrap_or(false),
            })
            .map_err(|_| "Serial worker is not running".to_string()),
        None => Err("Not connected to a serial port".to_string()),
    }
}

/// Drain jobs in FIFO order until the channel closes (explicit disconnect) or
/// a serial I/O error makes the port unusable.
fn serial_worker(mut connection: SerialConnection, rx: Receiver<SerialJob>, app: AppHandle) {
    for job in rx.iter() {
        let fatal = match job {
            SerialJob::Command {
                incoming_type,
                message,
            } => handle_command(&mut connection, &incoming_type, &message, &app),
            SerialJob::Upload {
                path,
                dest_filename,
                compression,
                dummy,
            } => handle_upload(
                &mut connection,
                &path,
                &dest_filename,
                compression.as_deref(),
                dummy,
                &app,
            ),
        };
        if fatal {
            break;
        }
    }
    // Either the sender was dropped (disconnect) or the port died — let the
    // webview know so it can flip back to the disconnected state.
    let _ = app.emit("serial-disconnected", ());
}

/// Run one command and emit its reply. Returns `true` when the serial link is
/// dead and the worker should stop.
fn handle_command(
    connection: &mut SerialConnection,
    incoming_type: &str,
    message: &str,
    app: &AppHandle,
) -> bool {
    // Validate against the same allow-list as the WebSocket backend's
    // GCommand/Terminal/Unsafe arms — never send arbitrary text to Marlin.
    let cmd = match g_command(message) {
        Ok(c) => c.to_string(),
        Err(e) => {
            emit_message(
                app,
                error_message("MessageSenderError", &e.to_string()),
            );
            return false;
        }
    };

    let response = match connection.send_command(&cmd) {
        Ok(r) => r,
        Err(io_err) => {
            // The port is gone (cable yanked, device reset). Surface it and
            // stop the worker so the user can reconnect.
            emit_message(
                app,
                error_message("MessageSenderError", &format!("Serial error: {}", io_err)),
            );
            return true;
        }
    };

    let payload = match incoming_type {
        "Terminal" => MessageSender {
            message_type: "terminal".to_string(),
            message: response.clone(),
            raw_message: response,
            timestamp: now_ts(),
        },
        "Unsafe" => MessageSender {
            message_type: "Unsafe".to_string(),
            message: response.clone(),
            raw_message: response,
            timestamp: now_ts(),
        },
        // GCommand (the default): the reply's `message_type` is the command
        // itself and the body is the parsed payload for recognised M-codes.
        _ => {
            let mut sender = MessageSender {
                message_type: cmd.clone(),
                message: String::new(),
                raw_message: response.clone(),
                timestamp: now_ts(),
            };
            if response != "ok" {
                sender.message = parse_response(&cmd, response);
            }
            sender
        }
    };
    emit_message(app, payload);
    false
}

/// Stream a local file to the printer's SD card over the Marlin binary
/// transfer protocol, mirroring `wscom.rs`'s `UploadBegin` arm. Returns
/// `false` (non-fatal) — an upload failure leaves the port usable.
fn handle_upload(
    connection: &mut SerialConnection,
    path: &str,
    dest_filename: &str,
    compression: Option<&str>,
    dummy: bool,
    app: &AppHandle,
) -> bool {
    if !valid_dest_filename(dest_filename) {
        emit_message(
            app,
            error_message(
                "UploadError",
                "invalid dest_filename: must have no /, no NUL, <=63 chars, end in .gco/.gcode/.g",
            ),
        );
        return false;
    }
    let compression = match resolve_compression(compression) {
        Ok(c) => c,
        Err(reason) => {
            emit_message(app, error_message("UploadError", &reason));
            return false;
        }
    };
    let file = match File::open(path) {
        Ok(f) => f,
        Err(e) => {
            emit_message(
                app,
                error_message("UploadError", &format!("cannot open file: {}", e)),
            );
            return false;
        }
    };

    emit_message(
        app,
        MessageSender {
            message_type: "UploadAck".to_string(),
            message: "ready".to_string(),
            raw_message: String::new(),
            timestamp: now_ts(),
        },
    );

    // The worker owns the port for the whole transfer, so the progress
    // callback emits `UploadProgress` events inline — no cross-thread bridge.
    let progress_app = app.clone();
    let opts = UploadOptions {
        dest_filename: dest_filename.to_string(),
        compression,
        dummy,
        chunk_size: 0,
        progress: Some(Box::new(move |p| {
            let body = serde_json::to_string(&UploadProgress {
                bytes_sent: p.bytes_sent,
                chunks_sent: p.chunks_sent,
                source_bytes: p.source_bytes,
            })
            .unwrap_or_default();
            emit_message(
                &progress_app,
                MessageSender {
                    message_type: "UploadProgress".to_string(),
                    message: body,
                    raw_message: String::new(),
                    timestamp: now_ts(),
                },
            );
        })),
    };

    let result = connection.with_short_read_timeout(Duration::from_millis(100), |port| {
        binary_upload(port, BufReader::new(file), opts)
    });

    match result {
        Ok(stats) => {
            let body = serde_json::to_string(&UploadResult {
                source_bytes: stats.source_bytes,
                bytes_sent: stats.bytes_sent,
                chunks_sent: stats.chunks_sent,
                compression: compression_label(&stats.compression).to_string(),
            })
            .unwrap_or_default();
            emit_message(
                app,
                MessageSender {
                    message_type: "UploadDone".to_string(),
                    message: body,
                    raw_message: String::new(),
                    timestamp: now_ts(),
                },
            );
        }
        Err(upload_err) => {
            emit_message(app, error_message("UploadError", &upload_err.to_string()));
        }
    }
    false
}
