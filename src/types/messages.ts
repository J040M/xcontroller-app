interface Message {
    message_type: string,
    message: string,
}

interface MessageResponse {
    message_type: string,
    message: string,
    raw_message: string,
    timestamp: number,
}

export type { Message, MessageResponse }