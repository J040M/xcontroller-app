import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ITransport } from '../ITransport'
import type { PrinterProfile } from '../../types/printer'

// `@tauri-apps/api` is mocked: these tests run under happy-dom with no Tauri
// runtime. `vi.hoisted` lets the mock factories reference these spies.
const { invokeMock, listenMock, listeners } = vi.hoisted(() => {
    const listeners = new Map<string, (event: { payload: unknown }) => void>()
    return {
        invokeMock: vi.fn(),
        listeners,
        listenMock: vi.fn((event: string, cb: (e: { payload: unknown }) => void) => {
            listeners.set(event, cb)
            return Promise.resolve(() => listeners.delete(event))
        }),
    }
})

vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }))
vi.mock('@tauri-apps/api/event', () => ({ listen: listenMock }))

import UsbTransport from '../UsbTransport'

function makeProfile(overrides: Partial<PrinterProfile> = {}): PrinterProfile {
    return {
        uuid: 'test',
        status: false,
        name: 'Test',
        url: '',
        transportType: 'usb',
        serialPort: '/dev/cu.usbserial-1',
        baudRate: 115200,
        printStatus: { state: 'unknown', file_name: undefined, elapsed_time: '', estimated_time: 0, progress: 0 },
        axisPositions: { X: 0, Y: 0, Z: 0, e0: 0, e1: 0 },
        dimensions: { X: 200, Y: 200, Z: 200 },
        temperatures: { e0: 0, e0_set: 0, e1: 0, e1_set: 0, bed: 0, bed_set: 0 },
        homed: false,
        ...overrides,
    }
}

describe('UsbTransport', () => {
    let transport: UsbTransport

    beforeEach(() => {
        invokeMock.mockReset()
        invokeMock.mockResolvedValue(undefined)
        listenMock.mockClear()
        listeners.clear()
        transport = new UsbTransport()
    })

    it('satisfies the ITransport contract', () => {
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
        expect(invokeMock).not.toHaveBeenCalled()
    })

    it('connect() opens the port and emits connected once configured', async () => {
        const connected = vi.fn()
        transport.on('connected', connected)
        transport.configure(makeProfile({ serialPort: '/dev/cu.usbserial-9', baudRate: 250000 }))
        transport.connect()
        expect(transport.hasAttemptedConnection).toBe(true)

        await vi.waitFor(() => expect(connected).toHaveBeenCalled())
        expect(invokeMock).toHaveBeenCalledWith('serial_connect', {
            port: '/dev/cu.usbserial-9',
            baud: 250000,
        })
        expect(transport.connectionStatus).toBe(true)
    })

    it('bridges serial-message events as MessageEvent-shaped "message" events', async () => {
        const messages: unknown[] = []
        transport.on('message', (e: unknown) => messages.push(e))
        transport.configure(makeProfile())
        transport.connect()
        await vi.waitFor(() => expect(listeners.has('serial-message')).toBe(true))

        // The Rust worker emits MessageSender-shaped payloads; the bridge must
        // wrap them as `{ data: <json string> }` so client.ts can JSON.parse it.
        const payload = { message_type: 'M114', message: '{"x":1}', raw_message: 'X:1', timestamp: 1 }
        listeners.get('serial-message')!({ payload })

        expect(messages).toEqual([{ data: JSON.stringify(payload) }])
    })

    it('emits disconnected when the worker exits', async () => {
        const disconnected = vi.fn()
        transport.on('disconnected', disconnected)
        transport.configure(makeProfile())
        transport.connect()
        await vi.waitFor(() => expect(listeners.has('serial-disconnected')).toBe(true))

        listeners.get('serial-disconnected')!({ payload: null })
        expect(disconnected).toHaveBeenCalled()
        expect(transport.connectionStatus).toBe(false)
    })

    it('sendCommand invokes serial_send_command with camelCase keys', async () => {
        transport.configure(makeProfile())
        transport.connect()
        await vi.waitFor(() => expect(transport.connectionStatus).toBe(true))
        invokeMock.mockClear()

        transport.sendCommand({ message_type: 'GCommand', message: 'G28' })
        expect(invokeMock).toHaveBeenCalledWith('serial_send_command', {
            messageType: 'GCommand',
            message: 'G28',
        })
    })
})
