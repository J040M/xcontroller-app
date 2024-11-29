import WebSocketConnector from "../utils/wsconnector";
import { useToast } from "primevue/usetoast";

const toast = useToast();
// 
// WS CLIENT INITIALIZATION
export const wsClient = new WebSocketConnector()

// IF wsURL is saved, read and set wsClient url
const wsURL = localStorage.getItem('wsURL')
if (wsURL) wsClient.wsURL = wsURL

// Set listeners for connected and error events
// TODO: Add translation for toast messages
wsClient.on('connected', (message: MessageEvent<string>)=> {
    console.log(message)
    // $toast.add({severity:'success', summary: 'Success', detail: 'Connected to printer'})
})

wsClient.on('error', (error: Event) => {
    console.error(error)
    // $toast.add({severity:'error', summary: 'Error', detail: 'Connection to printer failed'})
})