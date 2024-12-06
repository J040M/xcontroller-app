import WebSocketConnector from "../utils/wsconnector";
import { Printer } from "../utils/printer";
import { Message } from "../types/messages";


/*********************/
/***** WS CLIENT *****/
/*********************/

export const wsClient = new WebSocketConnector()

// IF wsURL is saved, read and set wsClient url
const wsURL = localStorage.getItem('wsURL')
if (wsURL) wsClient.wsURL = wsURL

// Set listeners for connected and error events
wsClient.on('connected', (message: MessageEvent<string>) => {
    console.log(message)
})

wsClient.on('error', (error: Event) => {
    console.error(error)
})

/**********************/
/***** PRINTER ********/
/**********************/

export const printer = new Printer({
    firmware: '',
    axisPositions: {
        x: 0,
        y: 0,
        z: 0,
        e: 0
    },
    homed: false
})

//TODO: THis is just a test, it should be improved
wsClient.on('message', (message: Message) => {

    //TODO: Maybe this should be a method in the printer class
    // or Switch case...
    if (message.message_type === 'M114') {
        const resp_axis = JSON.parse(message.message)
        printer.axisPositions = resp_axis
    }
})