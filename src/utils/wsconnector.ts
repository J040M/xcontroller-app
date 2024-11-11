import { EventEmitter } from '../utils/eventemitter';
import { Message } from "../types/messages"

export default class wsConnector extends EventEmitter {

    private wsClient: WebSocket | null = null
    private _wsURL: string = ''
    private _connectionStatus: boolean = false

    private _messageHistory: MessageEvent<string>[] = []
    private _commandHistory: Message[] = []

    set wsURL(value: string | undefined) {
        if (value) this._wsURL = value
    }

    get connectionStatus(): boolean {
        return this._connectionStatus
    }

    get messageHistory(): MessageEvent<string>[]  {
        return this._messageHistory
    }

    get commandHistory(): Message[] {
        return this._commandHistory
    }

    connect(protocols?: string | string[]): void {
        // Initialize wsClient with the WebSocket instance
        this.wsClient = new WebSocket(this._wsURL, protocols);

        // Attach events
        this.attachEventListeners()
    }

    disconnect(): void {
        this.wsClient?.close()
    }

    sendCommand(command: Message): void {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return
        }

        this.wsClient.send(JSON.stringify(command))
    }

    private attachEventListeners(): void {
        if (!this.wsClient) return;

        this.wsClient.onopen = () => this.emit('connected', 'WS connected');
        this.wsClient.onclose = () => this.emit('disconnected', 'WS disconnected');
        this.wsClient.onerror = (error) => this.emit('error', error);
        this.wsClient.onmessage = (message) => this.emit('message', message);
    }
}
