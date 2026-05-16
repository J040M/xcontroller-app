/**
 * @file upload.ts
 * Binary SD-card upload manager.
 *
 * Owns the client side of xcontroller's binary upload protocol. Two entry
 * points, one per transport:
 *  - `uploadFile` (WebSocket): sends `UploadBegin`, waits for `UploadAck`,
 *    streams the file body as chunked binary frames with backpressure.
 *  - `uploadFileFromPath` (USB): hands a filesystem path to the Rust side,
 *    which owns the Marlin binary transfer.
 * Both settle on the same `upload:*` `eventBus` events — the Rust USB worker
 * and the WebSocket backend emit the identical `Upload*` message types, which
 * `init/client.ts`'s dispatcher bridges onto the bus.
 */

import { getTransport } from '../init/client'
import WebSocketTransport from '../transport/WebSocketTransport'
import UsbTransport from '../transport/UsbTransport'
import { eventBus } from './eventbus'
import type {
    UploadRequest,
    UploadProgress,
    UploadResult,
    UploadCompression,
} from '../types/upload'

/**
 * Bytes per WebSocket binary frame. Small enough that progress feels live
 * and the socket send buffer stays bounded, large enough that framing
 * overhead is negligible.
 */
const CHUNK_SIZE = 16 * 1024

/**
 * Pause streaming when the socket's send buffer climbs past this, so a slow
 * link can't make us buffer the whole file in memory ahead of the network.
 */
const BACKPRESSURE_LIMIT = 256 * 1024

/**
 * Mirrors the server's `XCONTROLLER_MAX_UPLOAD_BYTES` default (64 MiB). The
 * server is the source of truth and rejects anything larger — this is just
 * fast local feedback before we read the whole file.
 */
const MAX_UPLOAD_BYTES = 64 * 1024 * 1024

/**
 * Process-wide single-flight guard. The server runs one upload at a time, so
 * starting a second client-side only guarantees an `UploadError`.
 */
let inFlight = false

export interface UploadHandlers {
    /** Called for every `UploadProgress` frame the server streams. */
    onProgress?: (progress: UploadProgress) => void
}

export interface UploadOptions {
    /** Compression mode. `heatshrink`/`auto` need a server built with the
     *  `heatshrink` feature; defaults to `none`. */
    compression?: UploadCompression
    /** Marlin M28 B1 dummy mode — the device pretends to receive the file
     *  without writing it. Useful for protocol smoke tests. */
    dummy?: boolean
}

/**
 * Client-side mirror of the server's `valid_dest_filename`. Catching a bad
 * name here avoids a round-trip just to be told the name is invalid.
 */
export function isValidDestFilename(name: string): boolean {
    if (!name || name.length > 63) return false
    if (name.includes('/') || name.includes('\0')) return false
    const lower = name.toLowerCase()
    return lower.endsWith('.gco') || lower.endsWith('.gcode') || lower.endsWith('.g')
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Streams a file to the printer's SD card over the WebSocket binary upload
 * protocol. Resolves with the server's `UploadResult`; rejects with an Error
 * carrying the failure reason. Only one upload may run at a time.
 *
 * @param file - The file to upload. `file.name` becomes the SD-card filename.
 * @param handlers - Optional progress callback.
 * @param options - Optional compression / dummy-mode settings.
 */
export async function uploadFile(
    file: File,
    handlers: UploadHandlers = {},
    options: UploadOptions = {},
): Promise<UploadResult> {
    if (inFlight) {
        throw new Error('An upload is already in progress')
    }
    const transport = getTransport()
    if (!(transport instanceof WebSocketTransport)) {
        // The chunked binary-frame protocol below is WebSocket-specific. USB
        // profiles upload via `uploadFileFromPath`, which hands the work to
        // the Rust side instead of streaming frames from the browser.
        throw new Error('File upload is not supported on this transport')
    }
    if (!transport.connectionStatus) {
        throw new Error('Not connected to a printer')
    }
    if (!isValidDestFilename(file.name)) {
        throw new Error(
            'Invalid filename: must be 63 characters or fewer, contain no "/", and end in .gco, .gcode or .g',
        )
    }

    const buffer = await file.arrayBuffer()
    const size = buffer.byteLength
    if (size === 0) {
        throw new Error('File is empty')
    }
    if (size > MAX_UPLOAD_BYTES) {
        throw new Error(
            `File too large: ${size} bytes exceeds the ${MAX_UPLOAD_BYTES} byte limit`,
        )
    }

    inFlight = true
    try {
        return await runUpload(transport, buffer, file.name, size, handlers, options)
    } finally {
        inFlight = false
    }
}

/**
 * Drives a single upload exchange once the payload has been read into memory.
 * Wires up the `eventBus` / `transport` listeners, sends `UploadBegin`, and
 * resolves or rejects as the protocol plays out.
 */
function runUpload(
    transport: WebSocketTransport,
    buffer: ArrayBuffer,
    destFilename: string,
    size: number,
    handlers: UploadHandlers,
    options: UploadOptions,
): Promise<UploadResult> {
    return new Promise<UploadResult>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
            eventBus.off('upload:ack', onAck)
            eventBus.off('upload:progress', onProgress)
            eventBus.off('upload:done', onDone)
            eventBus.off('upload:error', onError)
            transport.off('disconnected', onDisconnected)
        }
        const succeed = (result: UploadResult) => {
            if (settled) return
            settled = true
            cleanup()
            resolve(result)
        }
        const fail = (reason: string) => {
            if (settled) return
            settled = true
            cleanup()
            reject(new Error(reason))
        }

        // Stream the payload as chunked binary frames, yielding whenever the
        // socket's send buffer is backed up so memory use stays bounded.
        async function streamPayload(): Promise<void> {
            let offset = 0
            while (offset < size) {
                if (settled) return // a server error arrived mid-stream
                const end = Math.min(offset + CHUNK_SIZE, size)
                if (!transport.sendBinary(buffer.slice(offset, end))) {
                    throw new Error('Socket closed before the upload finished')
                }
                offset = end
                while (transport.bufferedAmount > BACKPRESSURE_LIMIT) {
                    await delay(20)
                    if (settled) return
                }
            }
        }

        const onAck = () => {
            // Server is ready — start streaming. Failures inside streamPayload
            // reject through `fail`; a server-side `UploadError` is handled by
            // `onError` and flips `settled`, which streamPayload checks.
            streamPayload().catch((e) =>
                fail(e instanceof Error ? e.message : String(e)),
            )
        }
        const onProgress = (raw: string) => {
            try {
                handlers.onProgress?.(JSON.parse(raw) as UploadProgress)
            } catch {
                /* ignore malformed progress frames — they're advisory only */
            }
        }
        const onDone = (raw: string) => {
            try {
                succeed(JSON.parse(raw) as UploadResult)
            } catch {
                fail('Upload finished but the result payload was malformed')
            }
        }
        const onError = (raw: string) => fail(raw || 'Upload failed')
        const onDisconnected = () => fail('Connection lost during upload')

        eventBus.on('upload:ack', onAck)
        eventBus.on('upload:progress', onProgress)
        eventBus.on('upload:done', onDone)
        eventBus.on('upload:error', onError)
        transport.on('disconnected', onDisconnected)

        const request: UploadRequest = {
            dest_filename: destFilename,
            size,
            compression: options.compression ?? 'none',
        }
        if (options.dummy) request.dummy = true

        transport.sendCommand({
            message_type: 'UploadBegin',
            message: JSON.stringify(request),
        })
    })
}

/**
 * Streams a local file (by filesystem path) to the printer's SD card over the
 * USB transport. Unlike `uploadFile`, the Rust side owns the Marlin binary
 * transfer — here we just kick it off via `UsbTransport.startUpload` and
 * settle on the same `upload:*` `eventBus` events the WebSocket path uses.
 * Resolves with the `UploadResult`; rejects with an Error. Only one upload
 * may run at a time.
 *
 * @param path - Absolute filesystem path to the g-code file.
 * @param destFilename - Filename to write on the printer's SD card.
 * @param handlers - Optional progress callback.
 * @param options - Optional compression / dummy-mode settings.
 */
export async function uploadFileFromPath(
    path: string,
    destFilename: string,
    handlers: UploadHandlers = {},
    options: UploadOptions = {},
): Promise<UploadResult> {
    if (inFlight) {
        throw new Error('An upload is already in progress')
    }
    const transport = getTransport()
    if (!(transport instanceof UsbTransport)) {
        throw new Error('Path-based upload is only available on the USB transport')
    }
    if (!transport.connectionStatus) {
        throw new Error('Not connected to a printer')
    }
    if (!isValidDestFilename(destFilename)) {
        throw new Error(
            'Invalid filename: must be 63 characters or fewer, contain no "/", and end in .gco, .gcode or .g',
        )
    }

    inFlight = true
    try {
        return await new Promise<UploadResult>((resolve, reject) => {
            let settled = false

            const cleanup = () => {
                eventBus.off('upload:progress', onProgress)
                eventBus.off('upload:done', onDone)
                eventBus.off('upload:error', onError)
                transport.off('disconnected', onDisconnected)
            }
            const succeed = (result: UploadResult) => {
                if (settled) return
                settled = true
                cleanup()
                resolve(result)
            }
            const fail = (reason: string) => {
                if (settled) return
                settled = true
                cleanup()
                reject(new Error(reason))
            }
            const onProgress = (raw: string) => {
                try {
                    handlers.onProgress?.(JSON.parse(raw) as UploadProgress)
                } catch {
                    /* ignore malformed progress frames — they're advisory only */
                }
            }
            const onDone = (raw: string) => {
                try {
                    succeed(JSON.parse(raw) as UploadResult)
                } catch {
                    fail('Upload finished but the result payload was malformed')
                }
            }
            const onError = (raw: string) => fail(raw || 'Upload failed')
            const onDisconnected = () => fail('Connection lost during upload')

            eventBus.on('upload:progress', onProgress)
            eventBus.on('upload:done', onDone)
            eventBus.on('upload:error', onError)
            transport.on('disconnected', onDisconnected)

            // The Rust worker emits UploadAck/Progress/Done/Error as it runs
            // the transfer — there's no `upload:ack` action to take here,
            // unlike the WebSocket path which streams the body on ack.
            transport
                .startUpload(path, destFilename, {
                    compression: options.compression,
                    dummy: options.dummy,
                })
                .catch((e) => fail(e instanceof Error ? e.message : String(e)))
        })
    } finally {
        inFlight = false
    }
}
