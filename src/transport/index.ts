import type { ITransport } from './ITransport'
import type { PrinterProfile } from '../types/printer'
import WebSocketTransport from './WebSocketTransport'
import UsbTransport from './UsbTransport'

/**
 * True when running inside the Tauri runtime (the native app), false in a
 * plain browser. Used to gate USB-only features out of the pure web build.
 */
export function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Build the transport for a printer profile. Profiles created before the USB
 * feature have no `transportType` — they are treated as WebSocket links.
 * A `'usb'` profile only ever reaches here in the native app: the profile
 * editor hides the USB option when `!isTauri()`.
 */
export function createTransport(profile: PrinterProfile): ITransport {
    const transport: ITransport =
        profile.transportType === 'usb' ? new UsbTransport() : new WebSocketTransport()
    transport.configure(profile)
    return transport
}
