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

interface AxisPositions {
    x: number
    y: number
    z: number
    e: number
}

interface PrinterProfile {
    name: string
    url: string,
    firmware: string,
    dimensions: {
        x: number
        y: number
        z: number
    }
}

type Axis = 'x' | 'y' | 'z' | 'e'

export type { PrintStatus, File, Axis, AxisPositions, PrinterProfile }