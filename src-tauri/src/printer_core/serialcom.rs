use log::{debug, info};
use serialport::{ClearBuffer, SerialPort};
use std::io::{self, Read, Write};
use std::time::{Duration, Instant};

static TIMEOUT: u64 = 1;

/// Once a reply has started arriving, treat it as complete after this much
/// silence (used only as a fallback for firmware that doesn't terminate with
/// `ok`). Normal replies return as soon as the `ok`/`error` line is seen.
const IDLE_TIMEOUT: Duration = Duration::from_millis(100);

/// Hard ceiling on how long to wait for a reply before giving up with
/// "NO RESPONSE". Generous because long-running commands (`G28`, `M109`,
/// `G29`) legitimately take many seconds during which the port may be silent.
const OVERALL_TIMEOUT: Duration = Duration::from_secs(30);

pub struct SerialConnection {
    port: Box<dyn SerialPort>,
}

impl SerialConnection {
    pub fn open(serial_port: &str, baud_rate: u32) -> io::Result<Self> {
        let port = serialport::new(serial_port, baud_rate)
            .timeout(Duration::from_secs(TIMEOUT))
            .open()
            .map_err(|e| io::Error::other(e.to_string()))?;
        Ok(Self { port })
    }

    pub fn send_command(&mut self, cmd: &str) -> io::Result<String> {
        // Drain unsolicited bytes (auto-report temp/pos, SD status, busy
        // pings) so they don't get read as the reply to *this* command.
        let _ = self.port.clear(ClearBuffer::Input);

        let response = round_trip(&mut self.port, cmd)?;
        info!("{}", response);
        Ok(response)
    }

    /// Run `f` with the port's read timeout temporarily set to `dur`,
    /// restoring the original timeout on exit. The binary-transfer
    /// adapter expects short-timeout `TimedOut` to drive its retransmit
    /// `tick()`; the default 1 s timeout would starve that loop.
    ///
    /// Generic over the closure's return type so callers can pass back a
    /// domain-specific `Result` (e.g. `Result<UploadStats, UploadError>`)
    /// without an extra layer of nesting. Failures to flip the timeout
    /// are logged but not surfaced — degrading to the existing timeout
    /// is preferable to aborting the upload.
    pub fn with_short_read_timeout<F, R>(&mut self, dur: Duration, f: F) -> R
    where
        F: FnOnce(&mut dyn SerialPort) -> R,
    {
        let previous = self.port.timeout();
        if let Err(e) = self.port.set_timeout(dur) {
            debug!("set_timeout({:?}) failed: {}", dur, e);
        }
        // Drain unsolicited bytes before switching modes — leftover ASCII
        // auto-reports would corrupt the binary handshake.
        let _ = self.port.clear(ClearBuffer::Input);
        let result = f(&mut *self.port);
        if let Err(e) = self.port.set_timeout(previous) {
            debug!("restore set_timeout({:?}) failed: {}", previous, e);
        }
        result
    }
}

fn round_trip<P: Read + Write>(port: &mut P, cmd: &str) -> io::Result<String> {
    let framed = format!("{}\r\n", cmd);
    write_to_port(port, framed.as_bytes())?;
    read_from_port(port)
}

fn read_from_port<T: Read>(port: &mut T) -> io::Result<String> {
    read_from_port_with(port, IDLE_TIMEOUT, OVERALL_TIMEOUT)
}

/// Marlin acknowledges every command with a final `ok` line (or an `Error:`
/// line on failure). Detecting that is what lets a multi-second command like
/// `G28` return correctly instead of being cut off by a fixed timer — the
/// firmware stays silent (or emits `echo:busy:` keepalives) until it's ready,
/// then sends `ok`.
fn response_is_complete(buffer: &str) -> bool {
    match buffer.lines().rev().find(|line| !line.trim().is_empty()) {
        Some(last) => {
            let t = last.trim();
            t == "ok"
                || t.starts_with("ok ")
                || t.starts_with("ok\t")
                || t.starts_with("Error")
                || t.starts_with("error")
        }
        None => false,
    }
}

fn read_from_port_with<T: Read>(
    port: &mut T,
    idle_timeout: Duration,
    overall_timeout: Duration,
) -> io::Result<String> {
    let mut serial_buffer = [0u8; 1024];
    let mut response_buffer = String::new();
    let start_time = Instant::now();
    let mut last_char_time = Instant::now();

    loop {
        // `true` means this iteration produced no new data (empty read or a
        // read timeout) — a quiet gap mid-command is normal, so we only fall
        // back on the idle/overall deadlines below rather than bailing early.
        let no_data = match port.read(serial_buffer.as_mut_slice()) {
            Ok(bytes_read) if bytes_read > 0 => {
                match std::str::from_utf8(&serial_buffer[0..bytes_read]) {
                    Ok(res) => {
                        response_buffer.push_str(res);
                        last_char_time = Instant::now();
                        // Return the instant Marlin says it's done — don't wait
                        // out the idle gap for the common case.
                        if response_is_complete(&response_buffer) {
                            return Ok(response_buffer);
                        }
                    }
                    Err(err) => {
                        debug!("Invalid UTF-8 sequence: {}", err);
                    }
                }
                false
            }
            Ok(_) => true,
            Err(ref e) if e.kind() == io::ErrorKind::TimedOut => true,
            Err(e) => return Err(e),
        };

        if no_data {
            if !response_buffer.is_empty() && last_char_time.elapsed() > idle_timeout {
                return Ok(response_buffer);
            }
            if start_time.elapsed() > overall_timeout {
                return if response_buffer.is_empty() {
                    Ok("NO RESPONSE".to_string())
                } else {
                    Ok(response_buffer)
                };
            }
        }
    }
}

fn write_to_port<T: Write>(port: &mut T, command: &[u8]) -> io::Result<()> {
    match port.write_all(command) {
        Ok(_) => {
            info!("{}", std::str::from_utf8(command).unwrap());
            Ok(())
        }
        Err(e) => Err(e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn test_read_from_port_ok() {
        let data = b"ok\n";
        let mut cursor = Cursor::new(data);
        let result = read_from_port(&mut cursor).unwrap();
        assert_eq!(result, "ok\n");
    }

    // TODO: For this to work a end of message delimiter is needed
    #[test]
    fn test_read_from_port_partial_ok() {
        let data = b"data and more data";
        let mut cursor = Cursor::new(data);
        let result = read_from_port(&mut cursor).unwrap();
        assert_eq!(result, "data and more data");
    }

    #[test]
    fn test_read_from_port_timeout() {
        struct TimeoutReader;
        impl Read for TimeoutReader {
            fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
                Err(io::Error::new(io::ErrorKind::TimedOut, "timeout"))
            }
        }

        let mut reader = TimeoutReader;
        // Short overall timeout so the test doesn't wait out the production
        // ceiling; a port that only ever times out yields "NO RESPONSE".
        let result =
            read_from_port_with(&mut reader, IDLE_TIMEOUT, Duration::from_millis(50)).unwrap();
        assert_eq!(result, "NO RESPONSE");
    }

    #[test]
    fn returns_as_soon_as_ok_line_arrives() {
        // A multi-line reply terminated by `ok` returns immediately instead of
        // waiting out any idle/overall timeout.
        let reply = "echo:busy: processing\nX:0.00 Y:0.00 Z:0.00\nok\n";
        let mut cursor = Cursor::new(reply.as_bytes().to_vec());
        let result =
            read_from_port_with(&mut cursor, IDLE_TIMEOUT, Duration::from_secs(30)).unwrap();
        assert_eq!(result, reply);
    }

    #[test]
    fn test_write_to_port_success() {
        let mut buffer = Vec::new();
        let command = b"test command";
        let _result = write_to_port(&mut buffer, command).unwrap();
        assert_eq!(buffer, command);
    }

    #[test]
    fn test_write_to_port_error() {
        struct ErrorWriter;
        impl Write for ErrorWriter {
            fn write(&mut self, _: &[u8]) -> io::Result<usize> {
                Err(io::Error::new(io::ErrorKind::Other, "write error"))
            }

            fn flush(&mut self) -> io::Result<()> {
                Ok(())
            }
        }

        let mut writer = ErrorWriter;
        let command = b"test command";
        let result = write_to_port(&mut writer, command);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().kind(), io::ErrorKind::Other);
    }

    /// Mock with separate read and write buffers — Cursor alone can't model a
    /// duplex port because writes and reads share its position cursor.
    struct MockPort {
        write_buf: Vec<u8>,
        read_buf: Cursor<Vec<u8>>,
    }

    impl Read for MockPort {
        fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
            self.read_buf.read(buf)
        }
    }

    impl Write for MockPort {
        fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
            self.write_buf.extend_from_slice(buf);
            Ok(buf.len())
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }

    #[test]
    fn round_trip_frames_command_with_crlf() {
        let mut mock = MockPort {
            write_buf: Vec::new(),
            read_buf: Cursor::new(b"ok\n".to_vec()),
        };
        let response = round_trip(&mut mock, "M105").unwrap();
        assert_eq!(mock.write_buf, b"M105\r\n");
        assert_eq!(response, "ok\n");
    }

    #[test]
    fn round_trip_returns_multiline_reply_verbatim() {
        let reply = "Begin file list\nfile1.GCO\nEnd file list\nok\n";
        let mut mock = MockPort {
            write_buf: Vec::new(),
            read_buf: Cursor::new(reply.as_bytes().to_vec()),
        };
        let response = round_trip(&mut mock, "M20").unwrap();
        assert_eq!(mock.write_buf, b"M20\r\n");
        assert_eq!(response, reply);
    }

    #[test]
    fn round_trip_propagates_write_error() {
        struct ErrorPort;
        impl Read for ErrorPort {
            fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
                Ok(0)
            }
        }
        impl Write for ErrorPort {
            fn write(&mut self, _: &[u8]) -> io::Result<usize> {
                Err(io::Error::new(io::ErrorKind::BrokenPipe, "unplugged"))
            }
            fn flush(&mut self) -> io::Result<()> {
                Ok(())
            }
        }

        let mut port = ErrorPort;
        let err = round_trip(&mut port, "M105").unwrap_err();
        assert_eq!(err.kind(), io::ErrorKind::BrokenPipe);
    }
}
