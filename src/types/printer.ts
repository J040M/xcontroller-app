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

type Axis = 'x' | 'y' | 'z' | 'e'
type State = 'idle' | 'printing' | 'paused' | 'stopped' | 'error'

interface PrintStatus {
    state: State,
    file: File,
    elapsed_time: number,
    estimated_time: number,
}

interface File {
    file_name: string,
    file_size: number,
    file_modified_date: string,
}

interface AxisPositions {
    x: number
    y: number
    z: number
    e: number
}

interface PrinterProfile {
    uuid: string,
    status: boolean,
    printStatus?: PrintStatus,
    name: string,
    url: string,
    firmware?: string,
    axisPositions: AxisPositions,
    dimensions: {
        x: number,
        y: number,
        z: number
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