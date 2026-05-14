/**
 * Binary SD-card upload protocol types. These mirror the server-side
 * structs in xcontroller's `structs.rs`. The flow:
 *
 *   client → UploadBegin  (text MessageWS, `message` = JSON UploadRequest)
 *   server → UploadAck    (`message: "ready"`)  | UploadError
 *   client → raw binary frames totalling UploadRequest.size bytes
 *   server → UploadProgress (streamed) → UploadDone | UploadError
 *
 * See xcontroller `docs/upload.md` for the full protocol description.
 */

/**
 * Compression modes the server accepts. `heatshrink` and `auto` require the
 * server binary to be built with the `heatshrink` Cargo feature; `none` is
 * always available and is the default.
 */
type UploadCompression = 'none' | 'heatshrink' | 'auto'

/**
 * Client → server payload, JSON-encoded into the `message` field of an
 * `UploadBegin` message.
 */
interface UploadRequest {
    /** SD-card filename: no `/`, no NUL, <= 63 chars, ends in .gco/.gcode/.g. */
    dest_filename: string,
    /** Total bytes the client will stream as binary frames after UploadAck. */
    size: number,
    /** Compression mode. Defaults to "none" server-side when omitted. */
    compression?: UploadCompression,
    /** Marlin M28 B1 dummy mode — device pretends to receive without writing. */
    dummy?: boolean,
    /** Bytes per WRITE packet. Omit or 0 to use the device-advertised maximum. */
    chunk_size?: number,
}

/** Streamed per chunk while the transfer runs (`UploadProgress` message). */
interface UploadProgress {
    bytes_sent: number,
    chunks_sent: number,
    source_bytes: number,
}

/** Final summary sent on a successful upload (`UploadDone` message). */
interface UploadResult {
    source_bytes: number,
    bytes_sent: number,
    chunks_sent: number,
    compression: string,
}

export type { UploadCompression, UploadRequest, UploadProgress, UploadResult }
