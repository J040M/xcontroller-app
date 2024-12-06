export interface PrintStatus {
    state: string,
    file: string,
    elap_time: string,
    est_time: string,
}

export interface File {
    file_name: string,
    file_size: string,
    file_modified_date: string,
}

export type Axis = 'x' | 'y' | 'z' | 'e'
