<script lang="ts">

import { defineComponent } from 'vue'

import TerminalService from 'primevue/terminalservice'
import { wsClient } from '../../init/client';
import { MessageResponse } from '../../types/messages';

export default defineComponent({
    name: 'terminalComponent',
    data: () => ({
        commandHistory: [] as string[]
    }),
    mounted() {
        // Listen to commands from terminal 
        TerminalService.on("command", this.commandHandler)

        // Listen to messages from WS
        wsClient.on('message', (message: any) => { 
            const data = JSON.parse(message.data) as MessageResponse

            data.raw_message = data.raw_message.replace(/\r/g, ' ')

            TerminalService.emit('response', data.raw_message) 
        })
    },
    beforeUnmount() {
        TerminalService.off("command", this.commandHandler)
    },
    methods: {
        commandHandler(command: string): void {
            this.commandHistory.push(command)

            wsClient.sendCommand({
                message_type: 'Unsafe',
                message: command
            })
        }
    },
})
</script>

<template>
    <Terminal prompt="xcontroller $ " />
</template>

<style scoped></style>
