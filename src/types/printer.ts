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

interface PrintStatus {
    state: string,
    file: File,
    elapsed_time: string,
    estimated_time: string,
}

interface File {
    file_name: string,
    file_size: string,
    file_modified_date: string,
}

interface AxisPositions {
    x: number
    y: number
    z: number
    e: number
}

interface PrinterProfile {
    status: boolean,
    printStatus?: PrintStatus,
    name: string,
    url: string,
    firmware: string,
    axisPositions: AxisPositions,
    dimensions: {
        x: number,
        y: number,
        z: number
    },
    temperatures: {
        e0: number,
        e0_set: number,
        bed: number,
        bed_set: number
    },
    homed: boolean
}

export type { PrintStatus, File, Axis, AxisPositions, PrinterProfile, PrinterCommands }