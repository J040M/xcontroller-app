interface PrintStatus {
    state: string,
    file: string,
    elap_time: string,
    est_time: string,
}

interface File {
    file_name: string,
    file_size: string,
    file_modified_date: string,
}

type Axis = 'x' | 'y' | 'z' | 'e'

interface AxisPositions {
    x: number
    y: number
    z: number
    e: number
}

interface PrinterInfo {
    firmware?: string
    axisPositions: AxisPositions
    dimensions?: { // Dimensions are in mm
        x: number
        y: number
        z: number
    }
    homed: boolean // Define if the motor was homed, if not, the printer is not ready to print
}

interface PrinterProfile {
    name: string
    url: string
    printerInfo: PrinterInfo
}

export type { PrintStatus, File, Axis, AxisPositions, PrinterInfo, PrinterProfile }