type Axis = 'x' | 'y' | 'z' | 'e'

interface PrintStatus {
    state: string,
    file: string,
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
    name: string
    url: string,
    firmware: string,
    axisPositions: AxisPositions,
    dimensions: {
        x: number,
        y: number,
        z: number
    },
    homed: boolean
}

export type { PrintStatus, File, Axis, AxisPositions, PrinterProfile }