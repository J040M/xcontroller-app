interface PrinterCommands {
    printerInfo: PrinterProfile
    autoHome(): void
    bedLeveling(): void
    moveAxis(axis: Axis, direction: string, distance: number): void
    listFiles(): void
    selectFile(file: string): void
    deleteFile(file: string): void
    startPrint(): void
    pausePrint(): void
    stopPrint(): void
    setHotendTemperature(temp: number): void
    setBedTemperature(temp: number): void
    disableMotors(axe?: string): void
    setFanSpeed(speed: number): void
}

type Axis = 'X' | 'Y' | 'Z' | 'e0' | 'e1'
type State = 'idle' | 'printing' | 'paused' | 'stopped' | 'error' | 'unknown'

/**
 * Which link a printer profile uses. `'usb'` is only selectable in the
 * native (Tauri) app. Profiles created before USB support have no
 * `transportType` — those are treated as `'websocket'` everywhere it's read.
 */
type TransportType = 'websocket' | 'usb'

interface PrintStatus {
    state: State,
    file_name: string | undefined,
    elapsed_time: string,
    /** Estimated total time in seconds. 0 when unknown. */
    estimated_time: number,
    /** 0–100 progress. */
    progress: number,
}

interface PrinterFile {
    file_name: string,
    /** Size in bytes, null when not reported. */
    file_size: number | null,
    /** ISO timestamp string, null when not reported. */
    file_modified_date: string | null,
}

/** @deprecated Use PrinterFile instead. */
type File = PrinterFile

interface AxisPositions {
    X: number
    Y: number
    Z: number
    e0: number
    e1: number
}

interface Temperatures {
    e0: number,
    e0_set: number,
    e1: number,
    e1_set: number,
    bed: number,
    bed_set: number,
}

interface PrinterProfile {
    uuid: string,
    status: boolean,
    printStatus: PrintStatus,
    name: string,
    url: string,
    /**
     * Shared secret for the WebSocket auth handshake. Optional — only set
     * when the xcontroller server is started with XCONTROLLER_AUTH_TOKEN.
     * When present, the connector sends it as the first message on connect.
     */
    authToken?: string,
    /** Link type. Absent ⇒ `'websocket'` (back-compat with saved profiles). */
    transportType?: TransportType,
    /** Serial device for `transportType: 'usb'` (e.g. /dev/cu.usbserial-x, COM3). */
    serialPort?: string,
    /** Serial baud rate for `transportType: 'usb'`. Defaults to 115200. */
    baudRate?: number,
    firmware?: string,
    axisPositions: AxisPositions,
    dimensions: {
        X: number,
        Y: number,
        Z: number
    },
    temperatures: Temperatures,
    homed: boolean,
}

interface HeatingProfile {
    uuid: string,
    name: string,
    e0: number,
    e1: number,
    e2: number,
    bed: number
}

export type {
    PrintStatus,
    PrinterFile,
    File,
    Axis,
    AxisPositions,
    Temperatures,
    TransportType,
    PrinterProfile,
    PrinterCommands,
    HeatingProfile,
}
