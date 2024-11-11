// import { watch } from 'vue'
import wsConnector from "../utils/wsconnector";

// WS CLIENT INITIALIZATION
export const wsClient = new wsConnector()

//
const wsURL = localStorage.getItem('wsURL')
if (wsURL) wsClient.wsURL = wsURL

wsClient.on('connected', (message: MessageEvent<string>)=> {
    console.log(message)
})

wsClient.on('error', (error: Event) => {
    console.error(error)
})