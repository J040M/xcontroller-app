import { EventEmitter } from '../utils/eventemitter';
import type { Message } from "../types/messages"
import type { PrinterProfile } from "../types/printer"
import type { ITransport } from "./ITransport"

/**
 * WebSocket transport — talks to the xcontroller backend over a WebSocket.
 * Handles connection lifecycle, the optional auth handshake, and message
 * sending (both JSON text commands and raw binary upload frames).
 * Emits: 'connected', 'disconnected', 'error', 'authfailed', 'message'
 */
export default class WebSocketTransport extends EventEmitter implements ITransport {
    private wsClient: WebSocket | null = null
    private _wsURL: string = ''
    private _connectionStatus: boolean = false
    private _hasAttemptedConnection: boolean = false
    private _authToken: string = ''
    private _authPending: boolean = false

    set wsURL(value: string | undefined) {
        if (value) this._wsURL = value
    }

    /**
     * Shared secret for the WebSocket auth handshake. Set from the selected
     * printer profile before `connect()`. An empty/whitespace value means
     * "no auth" — the handshake is skipped and the server is expected to be
     * running without XCONTROLLER_AUTH_TOKEN.
     */
    set authToken(value: string | undefined) {
        this._authToken = value?.trim() ?? ''
    }

    /**
     * Apply a printer profile's connection settings. Called by the connector
     * before `connect()`. The profile's `url`/`authToken` are the WebSocket
     * link parameters; USB-only fields are ignored here.
     */
    configure(profile: PrinterProfile): void {
        this.wsURL = profile.url
        this.authToken = profile.authToken
    }

    get connectionStatus(): boolean {
        return this._connectionStatus
    }

    /**
     * True once `connect()` has been called at least once. Used by the
     * Printer decorator to avoid surfacing the "not connected" error dialog
     * before the user has even attempted to connect.
     */
    get hasAttemptedConnection(): boolean {
        return this._hasAttemptedConnection
    }

    /**
     * Bytes still buffered by the socket and not yet handed to the network.
     * Used by the upload manager to apply backpressure while streaming
     * binary frames so we don't grow an unbounded send buffer.
     */
    get bufferedAmount(): number {
        return this.wsClient?.bufferedAmount ?? 0
    }

    /**
     * Establishes a WebSocket connection. If a prior socket is still open,
     * its handlers are detached and it is closed first to prevent stale
     * events from a previous session leaking through.
     */
    connect(protocols?: string | string[]): void {
        if (!this._wsURL) return

        if (this.wsClient && this.wsClient.readyState !== WebSocket.CLOSED) {
            this.wsClient.onopen = null
            this.wsClient.onclose = null
            this.wsClient.onerror = null
            this.wsClient.onmessage = null
            this.wsClient.close()
        }

        this._hasAttemptedConnection = true
        this._authPending = false
        this.wsClient = new WebSocket(this._wsURL, protocols)
        this.wsClient.binaryType = 'arraybuffer'
        this.attachEventListeners()
    }

    disconnect(): void {
        this.wsClient?.close()
    }

    sendCommand(command: Message): void {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) return
        this.wsClient.send(JSON.stringify(command))
    }

    /**
     * Sends a raw binary frame. Used by the upload manager to stream the
     * file body after an `UploadBegin`/`UploadAck` exchange. Returns false
     * when the socket isn't open so the caller can abort the transfer.
     */
    sendBinary(data: ArrayBuffer | ArrayBufferView): boolean {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) return false
        this.wsClient.send(data)
        return true
    }

    private attachEventListeners(): void {
        if (!this.wsClient) return
        this.wsClient.onopen = () => {
            // With a token configured the socket isn't "connected" in the
            // application sense until the server accepts the handshake. Send
            // the Auth message as the very first frame and withhold the
            // 'connected' event until the reply lands.
            if (this._authToken) {
                this._authPending = true
                this.wsClient!.send(JSON.stringify({
                    message_type: 'Auth',
                    message: this._authToken,
                }))
                return
            }
            this._connectionStatus = true
            this.emit('connected', 'connected')
        }
        this.wsClient.onclose = () => {
            this._connectionStatus = false
            this._authPending = false
            this.emit('disconnected', 'disconnected')
        }
        this.wsClient.onerror = (error) => this.emit('error', error)
        this.wsClient.onmessage = (message) => {
            // While the handshake is outstanding the only frame we expect is
            // the server's Auth reply. Intercept it here so the rest of the
            // app (the client.ts dispatcher) never sees it.
            if (this._authPending) {
                this._authPending = false
                let ok = false
                try {
                    const parsed = JSON.parse(message.data)
                    ok = parsed?.message_type === 'Auth' && parsed?.message === 'ok'
                } catch {
                    ok = false
                }
                if (ok) {
                    this._connectionStatus = true
                    this.emit('connected', 'connected')
                } else {
                    // The server drops the socket on a failed handshake;
                    // close proactively too so we never leak a half-open
                    // connection, and surface a distinct event so the UI can
                    // tell "wrong token" apart from a generic link failure.
                    this.emit('authfailed', 'authfailed')
                    this.wsClient?.close()
                }
                return
            }
            this.emit('message', message)
        }
    }
}
