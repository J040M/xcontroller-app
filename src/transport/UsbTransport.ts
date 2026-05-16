import { EventEmitter } from '../utils/eventemitter'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { Message } from '../types/messages'
import type { PrinterProfile } from '../types/printer'
import type { ITransport } from './ITransport'

/**
 * USB serial transport — Tauri-only. Talks to the printer directly over a
 * serial port via the Rust commands in `src-tauri/src/serial.rs`.
 *
 * The Rust worker emits every reply — command responses *and* upload
 * protocol replies — as a `serial-message` event carrying a
 * `MessageSender`-shaped payload, the same shape the WebSocket protocol
 * uses. This class just wraps that payload as a `MessageEvent`-like
 * `{ data }` and re-emits it as `'message'`, so `init/client.ts`'s
 * dispatcher handles USB and WebSocket identically with no transport-specific
 * code. Emits: 'connected', 'disconnected', 'error', 'message'.
 *
 * There is no auth handshake over USB, so `'authfailed'` is never emitted.
 *
 * The factory in `transport/index.ts` only constructs this in the native
 * app, so the `@tauri-apps/api` imports are never exercised in a plain
 * browser build (they only throw when *called* without the Tauri runtime).
 */
export default class UsbTransport extends EventEmitter implements ITransport {
    private _serialPort: string = ''
    private _baudRate: number = 115200
    private _connectionStatus: boolean = false
    private _hasAttemptedConnection: boolean = false
    private _unlisteners: UnlistenFn[] = []

    /**
     * Apply a printer profile's connection settings. Called by the connector
     * before `connect()`. The profile's `serialPort`/`baudRate` are the USB
     * link parameters; WebSocket-only fields are ignored here.
     */
    configure(profile: PrinterProfile): void {
        this._serialPort = profile.serialPort ?? ''
        this._baudRate = profile.baudRate ?? 115200
    }

    get connectionStatus(): boolean {
        return this._connectionStatus
    }

    get hasAttemptedConnection(): boolean {
        return this._hasAttemptedConnection
    }

    connect(): void {
        if (!this._serialPort) return
        this._hasAttemptedConnection = true
        void this.openConnection()
    }

    disconnect(): void {
        // The Rust worker emits `serial-disconnected` as it exits, which the
        // bridge below turns into a `'disconnected'` event and tears down the
        // listeners — so there's nothing else to clean up here.
        invoke('serial_disconnect').catch(() => {
            /* already gone — nothing to do */
        })
    }

    sendCommand(command: Message): void {
        if (!this._connectionStatus) return
        // Fire-and-forget: the reply comes back as a `serial-message` event.
        invoke('serial_send_command', {
            messageType: command.message_type,
            message: command.message,
        }).catch((error) => this.emit('error', error))
    }

    /**
     * Begin a binary SD-card upload from a local file path. The Rust worker
     * streams `UploadAck` / `UploadProgress` / `UploadDone` / `UploadError`
     * back as `serial-message` events; `utils/upload.ts`'s `uploadFileFromPath`
     * settles on the matching `eventBus` events, exactly like the WebSocket
     * path. Not part of `ITransport` — upload is transport-specific.
     */
    startUpload(
        path: string,
        destFilename: string,
        options: { compression?: string; dummy?: boolean } = {},
    ): Promise<void> {
        return invoke('usb_upload', {
            path,
            destFilename,
            compression: options.compression ?? null,
            dummy: options.dummy ?? false,
        })
    }

    private async openConnection(): Promise<void> {
        try {
            // Wire the event bridge before connecting so no reply is missed.
            await this.attachEventListeners()
            await invoke('serial_connect', {
                port: this._serialPort,
                baud: this._baudRate,
            })
            this._connectionStatus = true
            this.emit('connected', 'connected')
        } catch (error) {
            await this.detachEventListeners()
            this.emit('error', error)
        }
    }

    private async attachEventListeners(): Promise<void> {
        if (this._unlisteners.length) return
        const onMessage = await listen<unknown>('serial-message', (event) => {
            // Wrap as a MessageEvent-like object so `client.ts`'s dispatcher,
            // which does `JSON.parse(e.data)`, works unchanged.
            this.emit('message', { data: JSON.stringify(event.payload) })
        })
        const onDisconnected = await listen('serial-disconnected', () => {
            this._connectionStatus = false
            this.emit('disconnected', 'disconnected')
            void this.detachEventListeners()
        })
        this._unlisteners = [onMessage, onDisconnected]
    }

    private async detachEventListeners(): Promise<void> {
        const unlisteners = this._unlisteners
        this._unlisteners = []
        for (const off of unlisteners) off()
    }
}
