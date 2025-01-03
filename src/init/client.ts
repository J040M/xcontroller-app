/**
 * @file Client initialization and WebSocket setup
 * @description Initializes the WebSocket client and printer instance,
 * handling connections and message processing for 3D printer control.
 */

import WebSocketConnector from "../utils/wsconnector";
import { Printer } from "../utils/printer";

import type { Message } from "../types/messages";

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

/**
 * Initialize printer instance with default values
 * Values will be updated through WebSocket messages
 */
export const printer = new Printer({
    name: '',
    url: '',
    firmware: '',
    axisPositions: {
        x: 0,
        y: 0,
        z: 0,
        e: 0
    },
    dimensions: {
        x: 0,
        y: 0,
        z: 0
    },
    homed: false
})

/**
 * Message Handler for Printer Updates
 * Processes incoming WebSocket messages and updates printer state
 * 
 * @TODO: Refactor into proper message handling system
 * @messageType M114 - Position report message
 */
wsClient.on('message', (message: Message) => {
    if (message.message_type === 'M114') {
        const resp_axis = JSON.parse(message.message)
        printer.axisPositions = resp_axis
    }
})