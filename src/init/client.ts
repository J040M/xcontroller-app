/**
 * Client initialization and WebSocket dispatcher.
 *
 * This module owns the single subscription to `wsClient.on('message', …)` —
 * incoming WebSocket payloads are parsed once here and re-emitted on the
 * shared `eventBus` as typed application events. Components subscribe to
 * those bus events (via `useListener`) instead of registering their own raw
 * WebSocket message handlers, which would otherwise stack up on remount.
 */

import WebSocketConnector from "../utils/wsconnector";
import Printer from "../utils/printer";
import PrinterStorage from "../utils/storage";
import { eventBus } from "../utils/eventbus";

import { reactive } from 'vue'
import type { MessageResponse } from "../types/messages";

export const storage = new PrinterStorage()
export const wsClient = new WebSocketConnector()

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
        progress: 0,
    },
    axisPositions: { X: 0, Y: 0, Z: 0, e0: 0, e1: 0 },
    dimensions: { X: 200, Y: 200, Z: 200 },
    temperatures: { e0: 0, e0_set: 0, e1: 0, e1_set: 0, bed: 0, bed_set: 0 },
    homed: false,
})
export const printer = reactive(newPrinter)

wsClient.on('message', (incomingMessage: MessageEvent) => {
    let message: MessageResponse
    try {
        message = JSON.parse(incomingMessage.data)
    } catch (e) {
        console.error('Invalid WS payload', e)
        return
    }

    switch (message.message_type) {
        case 'M114':
            try {
                const pos = JSON.parse(message.message)
                printer.axisPositions.X = pos.x
                printer.axisPositions.Y = pos.y
                printer.axisPositions.Z = pos.z
            } catch (e) {
                console.error('M114 parse failed', e)
            }
            break
        case 'M105':
            try {
                // Merge the firmware's temperature payload over current state.
                const temps = JSON.parse(message.message)
                printer.temperatures = { ...printer.temperatures, ...temps }
            } catch (e) {
                console.error('M105 parse failed', e)
            }
            break
        case 'M20':
            eventBus.emit('printer:m20', message.message)
            break
        case 'M27':
            eventBus.emit('printer:m27', message.message)
            break
        case 'M27 C':
            eventBus.emit('printer:m27c', message.message)
            break
        case 'M31':
            eventBus.emit('printer:m31', message.message)
            break
        case 'terminal':
            eventBus.emit('terminal:line', message.raw_message.replace(/\r/g, ' '))
            break
        // Binary upload protocol replies — re-emitted for the upload manager
        // (utils/upload.ts), which owns the UploadBegin/Ack/payload state.
        case 'UploadAck':
            eventBus.emit('upload:ack', message.message)
            break
        case 'UploadProgress':
            eventBus.emit('upload:progress', message.message)
            break
        case 'UploadDone':
            eventBus.emit('upload:done', message.message)
            break
        case 'UploadError':
            eventBus.emit('upload:error', message.message)
            break
        case 'MessageSenderError':
            console.error('Error received from server')
            break
        default:
            break
    }
})

wsClient.on('connected', () => {
    printer.printerInfo.status = true
    eventBus.emit('connection:open')
})

wsClient.on('disconnected', () => {
    printer.printerInfo.status = false
    eventBus.emit('connection:close')
})

wsClient.on('error', (error: Event) => {
    console.error(error)
    eventBus.emit('connection:error', error)
})
