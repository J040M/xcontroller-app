import { EventEmitter } from '../utils/eventemitter';
import type { Message } from "../types/messages"

/**
 * WebSocket connection manager that extends EventEmitter
 * Handles connection lifecycle, message sending, and event handling
 */
export default class WebSocketConnector extends EventEmitter {
    /** Active WebSocket client instance */
    private wsClient: WebSocket | null = null
    /** WebSocket server URL */
    private _wsURL: string = ''
    /** Current connection state */
    private _connectionStatus: boolean = false

    /** Store of received messages */
    private _messageHistory: MessageEvent<string>[] = []
    /** Store of sent commands */
    private _commandHistory: Message[] = []

    /**
     * Sets the WebSocket server URL
     * @param {string | undefined} value - WebSocket server URL
     * @returns {void}
     */
    set wsURL(value: string | undefined) {
        if (value) this._wsURL = value
    }

    /**
     * Gets the current connection status
     * @returns {boolean} Boolean indicating if socket is connected
     */
    get connectionStatus(): boolean {
        return this._connectionStatus
    }

    /**
     * Gets the history of received messages
     * @returns {MessageEvent<string>[]} Array of received WebSocket messages
     */
    get messageHistory(): MessageEvent<string>[] {
        return this._messageHistory
    }

    /**
     * Gets the history of sent commands
     * @returns {Message[]} Array of sent command messages
     */
    get commandHistory(): Message[] {
        return this._commandHistory
    }

    /**
     * Establishes WebSocket connection
     * @param {string | string[]} [protocols] - Optional WebSocket protocols
     * @returns {void}
     */
    connect(protocols?: string | string[]): void {
        // Initialize wsClient with the WebSocket instance
        this.wsClient = new WebSocket(this._wsURL, protocols)

        // Attach events
        this.attachEventListeners()
    }

    /**
     * Closes the WebSocket connection
     * @returns {void}
     */
    disconnect(): void {
        this.wsClient?.close()
    }

    /**
     * Sends a command message through WebSocket
     * @param {Message} command - Message object to send
     * @returns {void}
     */
    sendCommand(command: Message): void {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) return

        this.wsClient.send(JSON.stringify(command))
    }

    /**
     * Sets up WebSocket event listeners for connection lifecycle events
     * Emits events: connected, disconnected, error, message
     * @private
     * @returns {void}
     */
    private attachEventListeners(): void {
        if (!this.wsClient) return;

        this.wsClient.onopen = () => this.emit('connected', 'connected');
        this.wsClient.onclose = () => this.emit('disconnected', 'disconnected');
        this.wsClient.onerror = (error) => this.emit('error', error);
        this.wsClient.onmessage = (message) => this.emit('message', message);
    }
}
