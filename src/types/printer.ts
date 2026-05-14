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
type SafetyState = 'secure' | 'warning' | 'fault' | 'unknown'

interface PrintStatus {
    state: State,
    file_name: string | undefined,
    elapsed_time: string,
    /** Estimated total time in seconds. 0 when unknown. */
    estimated_time: number,
    /** Remaining time as HH:MM:SS, or null when the firmware doesn't report it. */
    remaining_time: string | null,
    /** 0–100 progress. */
    progress: number,
    /** Current layer index, null when not exposed by firmware. */
    current_layer: number | null,
    /** Total layer count for the active file, null when unknown. */
    total_layers: number | null,
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
    /** Ambient/case temperature in °C, null when not reported. */
    ambient: number | null,
}

/**
 * Auxiliary telemetry not tied to a specific axis or heater.
 * All fields default to null when the firmware doesn't surface the value.
 */
interface PrinterTelemetry {
    /** Cooling fan speed 0–100 (%), null when not reported. */
    fan_speed: number | null,
    /** Live power draw in watts, null when not reported. */
    power_draw: number | null,
    /** Current safety/door/lid status. */
    safety_state: SafetyState,
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
    firmware?: string,
    axisPositions: AxisPositions,
    dimensions: {
        X: number,
        Y: number,
        Z: number
    },
    temperatures: Temperatures,
    telemetry: PrinterTelemetry,
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
    PrinterTelemetry,
    PrinterProfile,
    PrinterCommands,
    HeatingProfile,
    SafetyState,
}
