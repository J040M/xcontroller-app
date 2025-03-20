/**
 * @file Client initialization and WebSocket setup
 * @description Initializes the WebSocket client and printer instance,
 * handling connections and message processing for 3D printer control.
 */

import WebSocketConnector from "../utils/wsconnector";
import Printer from "../utils/printer";
import PrinterStorage from "../utils/storage";

import { reactive } from 'vue'
import type { MessageResponse } from "../types/messages";

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
    printStatus: {
        state: 'unknown',
        file_name: undefined,
        elapsed_time: '',
        estimated_time: 0,
        progress: 0
    },
    axisPositions: {
        X: 0,
        Y: 0,
        Z: 0,
        e0: 0,
        e1: 0
    },
    //Default dimensions
    dimensions: {
        X: 200,
        Y: 200,
        Z: 200
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
    const message: MessageResponse = JSON.parse(incomingMessage.data)
    // TODO: Maybe this should be a method in the printer class
    // console.log('Received message:', message)

    switch (message.message_type) {
        case 'M114':
            const resp_axis = JSON.parse(message.message)
            console.log('POSITIONS FROM PRINTER')
            console.log(resp_axis)
            printer.axisPositions.X = resp_axis.x
            printer.axisPositions.Y = resp_axis.y
            printer.axisPositions.Z = resp_axis.z
            break
        case 'M105':
            const resp_temps = JSON.parse(message.message)
            printer.temperatures = resp_temps
            break
        case 'MessageSenderError':
            console.error('Error received from server')
            break
        default:
            break
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
