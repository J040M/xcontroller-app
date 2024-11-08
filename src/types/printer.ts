interface Printer {

}

interface PrinterStatus {
    state: string,
    file: string,
    elap_time: string,
    est_time: string,
}

interface Files {
    file_name: string,
    file_size: string,
    file_modified_date: string,
}

export class printer {

    printStatus: PrinterStatus | undefined
    printFile: File | undefined

    constructor() {

    }

}
