import WebSocketConnector from "../utils/wsconnector";

// WS CLIENT INITIALIZATION
export const wsClient = new WebSocketConnector()

// IF wsURL is saved, read and set wsClient url
const wsURL = localStorage.getItem('wsURL')
if (wsURL) wsClient.wsURL = wsURL

// Set listeners for connected and error events
// TODO: Use this alert user on Errors or other messages
wsClient.on('connected', (message: MessageEvent<string>)=> {
    console.log(message)
})

wsClient.on('error', (error: Event) => {
    console.error(error)
})