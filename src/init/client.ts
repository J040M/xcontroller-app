/**
 * @file Client initialization and WebSocket setup
 * @description Initializes the WebSocket client and printer instance,
 * handling connections and message processing for 3D printer control.
 */

import WebSocketConnector from "../utils/wsconnector";
import { Printer } from "../utils/printer";

import { reactive } from 'vue'

/*********************/
/***** WS CLIENT *****/
/*********************/

export const wsClient = new WebSocketConnector()

/**
 * Initialize WebSocket URL from localStorage if available
 * @TODO: Refactor to implement profile-based storage system
 */
const wsURL = localStorage.getItem('wsURL')
if (wsURL) wsClient.wsURL = wsURL

/**
 * WebSocket Event Handlers
 * Manages connection state and error handling
 */
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
    temperatures: {
        e0: 0,
        e0_set: 0,
        bed: 0,
        bed_set: 0
    },
    homed: false
})

// TODO: Not the way I like to have this, but it's a start
export const printer = reactive(newPrinter)

// TODO: This is just a test, it should be improved and moved away from here
wsClient.on('message', (message: any) => {

    message = JSON.parse(message.data)
    // TODO: Maybe this should be a method in the printer class
    // or Switch case...
    if (message.message_type === 'M114') {
        const resp_axis = JSON.parse(message.message)
        printer.axisPositions = resp_axis
    } else if (message.message_type === 'M105') {
        console.log('Temperatures:', message.message)
        const resp_temps = JSON.parse(message.message)
        printer.temperatures = resp_temps
        console.log(printer.temperatures)
    }
})