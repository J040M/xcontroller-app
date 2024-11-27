export interface Message {
    message_type: string,
    message: string,
}

export interface MessageResponse {
    message_type: string,
    message: string,
    raw_message: string,
    timestamp: number,
}