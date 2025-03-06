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

interface PrintStatus {
    state: State,
    file_name: string | undefined,
    elapsed_time: number,
    estimated_time: number,
    progress: number,
}

/*
* @deprecated
*/
interface File {
    file_name: string,
    file_size?: number,
    file_modified_date?: string,
}

interface AxisPositions {
    X: number
    Y: number
    Z: number
    e0: number
    e1: number
}

interface PrinterProfile {
    uuid: string,
    status: boolean,
    printStatus: PrintStatus,
    name: string,
    url: string,
    firmware?: string,
    axisPositions: AxisPositions,
    dimensions: {
        X: number,
        Y: number,
        Z: number
    },
    temperatures: {
        e0: number,
        e0_set: number,
        e1: number,
        e1_set: number,
        bed: number,
        bed_set: number
    },
    homed: boolean
}

interface HeatingProfile {
    uuid: string,
    name: string,
    e0: number,
    e1: number,
    e2: number,
    bed: number
}

export type { PrintStatus, File, Axis, AxisPositions, PrinterProfile, PrinterCommands, HeatingProfile }