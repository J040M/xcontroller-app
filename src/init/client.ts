import WebSocketConnector from "../utils/wsconnector";
import { Printer } from "../utils/printer";

import { reactive } from 'vue'

/*********************/
/***** WS CLIENT *****/
/*********************/

export const wsClient = new WebSocketConnector()

// IF wsURL is saved, read and set wsClient url
// TODO: Modify this to use the storage profiles
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

const newPrinter = new Printer({
    name: '',
    url: '',
    firmware: '',
    axisPositions: {
        x: 0,
        y: 0,
        z: 0,
        e: 0
    },
    //Default dimensions
    dimensions: {
        x: 200,
        y: 200,
        z: 200
    },
    homed: false
})

// TODO: Not the way I like to have this, but it's a start
export const printer = reactive(newPrinter)

//TODO: THis is just a test, it should be improved
wsClient.on('message', (message: any) => {

    message = JSON.parse(message.data)
    //TODO: Maybe this should be a method in the printer class
    // or Switch case...
    if (message.message_type === 'M114') {
        const resp_axis = JSON.parse(message.message)
        printer.axisPositions = resp_axis
    }
})