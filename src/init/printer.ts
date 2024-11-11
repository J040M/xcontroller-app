import { wsClient } from "./client";

wsClient.on('connected', ()=> {
    // Connection to printer is successfull then send M115 to collect pritner info
        wsClient.sendCommand({
            message_type: 'GCommand',
            message: 'M115'
        })
})