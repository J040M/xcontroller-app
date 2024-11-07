import { Message } from "../types/messages"

export default class wsConnector {

    private wsClient: WebSocket | null = null
    private _wsURL: string = 'ws://127.0.0.1:9002'

    _connectionStatus: boolean = false

    messageHistory: MessageEvent<any>[] = []
    commandHistory: Message[] = []

    set wsURL(value: string | undefined) {
        if (value) this._wsURL = value
        else this._wsURL = 'ws://127.0.0.1:9002'
    }

    get connectionStatus() {
        return this._connectionStatus
    }

    openConnection(protocols?: string | string[]) {
        // Initialize wsClient with the WebSocket instance
        this.wsClient = new WebSocket(this._wsURL, protocols);

        // Handle WebSocket events
        this.wsClient.onopen = () => {
            console.log('WebSocket connection established');
            this._connectionStatus = true
        };

        this.wsClient.onerror = (error) => {
            console.error('WebSocket error:', error);
            this._connectionStatus = false
        };

        this.wsClient.onclose = () => {
            console.log('WebSocket connection closed');
            this.wsClient = null;
            this._connectionStatus = false
        };

        this.wsClient.onmessage = (message) => {
            console.log('OnMessage: ', message)
            this.messageHistory.push(message)
        }
    }

    closeConnection() {
        this.wsClient?.close()
    }

    sendCommand(command: Message) {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return;
        }

        this.commandHistory.push(command)
        this.wsClient.send(JSON.stringify(command))
    }
}
