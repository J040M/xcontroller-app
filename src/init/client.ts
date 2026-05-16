/**
 * Client initialization and transport dispatcher.
 *
 * This module owns the single subscription to the active transport's events.
 * Incoming payloads are parsed once here and re-emitted on the shared
 * `eventBus` as typed application events; connection lifecycle events are
 * likewise bridged to `connection:*` bus events. Components subscribe to the
 * bus (via `useListener`) rather than to a transport instance, so they don't
 * care which transport (WebSocket / USB) is currently active, and listeners
 * don't stack up on remount.
 */

import WebSocketTransport from "../transport/WebSocketTransport";
import type { ITransport } from "../transport/ITransport";
import Printer from "../utils/printer";
import PrinterStorage from "../utils/storage";
import { eventBus } from "../utils/eventbus";

import { reactive } from 'vue'
import type { MessageResponse } from "../types/messages";

export const storage = new PrinterStorage()

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

// --- transport dispatch -----------------------------------------------------

function onMessage(incomingMessage: MessageEvent) {
    let message: MessageResponse
    try {
        message = JSON.parse(incomingMessage.data)
    } catch (e) {
        console.error('Invalid transport payload', e)
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
}

function onConnected() {
    printer.printerInfo.status = true
    eventBus.emit('connection:open')
}

function onDisconnected() {
    printer.printerInfo.status = false
    eventBus.emit('connection:close')
}

function onError(error: Event) {
    console.error(error)
    eventBus.emit('connection:error', error)
}

function onAuthFailed() {
    eventBus.emit('connection:authfailed')
}

function attachDispatcher(t: ITransport): void {
    t.on('message', onMessage)
    t.on('connected', onConnected)
    t.on('disconnected', onDisconnected)
    t.on('error', onError)
    t.on('authfailed', onAuthFailed)
}

function detachDispatcher(t: ITransport): void {
    t.off('message', onMessage)
    t.off('connected', onConnected)
    t.off('disconnected', onDisconnected)
    t.off('error', onError)
    t.off('authfailed', onAuthFailed)
}

// The active transport starts as a WebSocket link — the default, and the only
// option in a plain browser. The connector swaps it via `setActiveTransport`
// when the user picks a profile (e.g. a USB profile in the native app).
let activeTransport: ITransport = new WebSocketTransport()
attachDispatcher(activeTransport)

/** The transport currently wired to the dispatcher. */
export function getTransport(): ITransport {
    return activeTransport
}

/**
 * Swap the active transport: disconnect and unsubscribe the previous one,
 * then wire the dispatcher to the new instance. The JSON dispatch and
 * `connection:*` bridging stay identical regardless of transport.
 */
export function setActiveTransport(transport: ITransport): void {
    if (transport === activeTransport) return
    if (activeTransport.connectionStatus) activeTransport.disconnect()
    detachDispatcher(activeTransport)
    activeTransport = transport
    attachDispatcher(activeTransport)
}
