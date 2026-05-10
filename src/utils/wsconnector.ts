import { EventEmitter } from '../utils/eventemitter';
import type { Message } from "../types/messages"

/**
 * WebSocket connection manager that extends EventEmitter
 * Handles connection lifecycle and message sending.
 * Emits: 'connected', 'disconnected', 'error', 'message'
 */
export default class WebSocketConnector extends EventEmitter {
    private wsClient: WebSocket | null = null
    private _wsURL: string = ''
    private _connectionStatus: boolean = false
    private _hasAttemptedConnection: boolean = false

    set wsURL(value: string | undefined) {
        if (value) this._wsURL = value
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
        this.wsClient = new WebSocket(this._wsURL, protocols)
        this.attachEventListeners()
    }

    disconnect(): void {
        this.wsClient?.close()
    }

    sendCommand(command: Message): void {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) return
        this.wsClient.send(JSON.stringify(command))
    }

    private attachEventListeners(): void {
        if (!this.wsClient) return
        this.wsClient.onopen = () => {
            this._connectionStatus = true
            this.emit('connected', 'connected')
        }
        this.wsClient.onclose = () => {
            this._connectionStatus = false
            this.emit('disconnected', 'disconnected')
        }
        this.wsClient.onerror = (error) => this.emit('error', error)
        this.wsClient.onmessage = (message) => this.emit('message', message)
    }
}
