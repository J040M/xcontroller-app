import type { Message } from '../types/messages'
import type { PrinterProfile } from '../types/printer'

/**
 * Transport-agnostic connection contract.
 *
 * Both `WebSocketTransport` and `UsbTransport` implement this so the rest of
 * the app (the `init/client.ts` dispatcher, `Printer`, `utils/upload.ts`) is
 * written against one surface and never needs to know which link is in use.
 *
 * Implementations are `EventEmitter`s and MUST emit this shared event set:
 *  - `'connected'`     — link is up (post-handshake for the WebSocket auth case)
 *  - `'disconnected'`  — link is down
 *  - `'error'`         — link error (carries the underlying `Event` where available)
 *  - `'authfailed'`    — auth handshake rejected (distinct from a generic error)
 *  - `'message'`       — an incoming payload. The payload MUST be shaped like a
 *                        DOM `MessageEvent` (i.e. have a `.data` string holding
 *                        the JSON), so `client.ts` can `JSON.parse(e.data)`
 *                        identically regardless of transport.
 *
 * Binary file upload is intentionally NOT part of this interface — it is
 * transport-specific and handled in `utils/upload.ts`.
 */
export interface ITransport {
    /** Open the link using whatever `configure()` last supplied. */
    connect(): void
    /** Close the link. */
    disconnect(): void
    /** Send a JSON command frame. No-op when the link isn't open. */
    sendCommand(command: Message): void
    /** True while the link is up. */
    readonly connectionStatus: boolean
    /** True once `connect()` has been called at least once this session. */
    readonly hasAttemptedConnection: boolean
    /** Apply a printer profile's connection settings before `connect()`. */
    configure(profile: PrinterProfile): void

    on(event: string, listener: Function): void
    off(event: string, listener: Function): void
    emit(event: string, ...args: any[]): void
}
