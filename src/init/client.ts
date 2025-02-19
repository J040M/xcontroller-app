/**
 * @file Client initialization and WebSocket setup
 * @description Initializes the WebSocket client and printer instance,
 * handling connections and message processing for 3D printer control.
 */

import WebSocketConnector from "../utils/wsconnector";
import Printer from "../utils/printer";
import PrinterStorage from "../utils/storage";

import { reactive } from 'vue'
import type { Message } from "../types/messages";

export const storage = new PrinterStorage()
export const wsClient = new WebSocketConnector()

/**
 * Printer instance
 * @TODO Not the way I like to have this, but it's a start
 */
const newPrinter = new Printer({
    uuid: '',
    status: false,
    name: '',
    url: '',
    firmware: '',
    axisPositions: {
        x: 0,
        y: 0,
        z: 0,
        e0: 0,
        e1: 0
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
        e1: 0,
        e1_set: 0,
        bed: 0,
        bed_set: 0
    },
    homed: false
})
export const printer = reactive(newPrinter)

/**
 * WebSocket Event Handlers
 * Manages messages, connection state and error handling
 * @TODO This is just a test, it should be improved and moved away from here
 */
wsClient.on('message', (incomingMessage: MessageEvent) => {
    const message: Message = JSON.parse(incomingMessage.data)
    // TODO: Maybe this should be a method in the printer class
    // or Switch case...
    if (message.message_type === 'M114') {
        const resp_axis = JSON.parse(message.message)
        printer.axisPositions = resp_axis
    } else if (message.message_type === 'M105') {
        const resp_temps = JSON.parse(message.message)
        printer.temperatures = resp_temps
    }
})
wsClient.on('connected', () => {
    console.log('Connected to WebSocket server')
    printer.printerInfo.status = true
})
wsClient.on('disconnected', () => printer.printerInfo.status = false)
wsClient.on('error', (error: Event) => {
    console.error(error)
})
