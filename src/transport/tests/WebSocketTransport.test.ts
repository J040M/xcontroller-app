import { describe, it, expect, vi, beforeEach } from 'vitest'
import WebSocketTransport from '../WebSocketTransport'
import type { ITransport } from '../ITransport'
import type { PrinterProfile } from '../../types/printer'

function makeProfile(overrides: Partial<PrinterProfile> = {}): PrinterProfile {
    return {
        uuid: 'test',
        status: false,
        name: 'Test',
        url: 'ws://localhost:9002',
        printStatus: { state: 'unknown', file_name: undefined, elapsed_time: '', estimated_time: 0, progress: 0 },
        axisPositions: { X: 0, Y: 0, Z: 0, e0: 0, e1: 0 },
        dimensions: { X: 200, Y: 200, Z: 200 },
        temperatures: { e0: 0, e0_set: 0, e1: 0, e1_set: 0, bed: 0, bed_set: 0 },
        homed: false,
        ...overrides,
    }
}

describe('WebSocketTransport', () => {
    let transport: WebSocketTransport

    beforeEach(() => {
        transport = new WebSocketTransport()
    })

    it('satisfies the ITransport contract', () => {
        // Compile-time check that the shared surface is implemented.
        const asInterface: ITransport = transport
        expect(typeof asInterface.connect).toBe('function')
        expect(typeof asInterface.disconnect).toBe('function')
        expect(typeof asInterface.sendCommand).toBe('function')
        expect(typeof asInterface.configure).toBe('function')
    })

    it('starts disconnected and not yet attempted', () => {
        expect(transport.connectionStatus).toBe(false)
        expect(transport.hasAttemptedConnection).toBe(false)
    })

    it('connect() is a no-op until a profile is configured', () => {
        transport.connect()
        expect(transport.hasAttemptedConnection).toBe(false)
    })

    it('connect() opens a socket once configured', () => {
        const WebSocketMock = vi.fn(function (this: any) {
            this.close = vi.fn()
        })
        vi.stubGlobal('WebSocket', WebSocketMock)

        transport.configure(makeProfile())
        transport.connect()

        expect(transport.hasAttemptedConnection).toBe(true)
        expect(WebSocketMock).toHaveBeenCalledWith('ws://localhost:9002', undefined)

        vi.unstubAllGlobals()
    })

    it('sendCommand is a no-op when the socket is not open', () => {
        expect(() =>
            transport.sendCommand({ message_type: 'GCommand', message: 'G28' }),
        ).not.toThrow()
    })

    it('relays events through the EventEmitter base', () => {
        const handler = vi.fn()
        transport.on('connected', handler)
        transport.emit('connected', 'connected')
        expect(handler).toHaveBeenCalledWith('connected')

        transport.off('connected', handler)
        transport.emit('connected', 'connected')
        expect(handler).toHaveBeenCalledTimes(1)
    })
})
