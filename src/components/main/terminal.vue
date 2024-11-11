<script lang="ts">

import { defineComponent } from 'vue'

import TerminalService from 'primevue/terminalservice'
import { wsClient } from '../../init/client';

export default defineComponent({
    name: 'terminalComponent',
    data: () => ({
        commandHistory: [] as string[]
    }),
    mounted() {
        // Listen to commands from terminal 
        TerminalService.on("command", this.commandHandler)

        // Listen to messages from WS
        wsClient.on('message', (message: string) => TerminalService.emit('response', message))
    },
    beforeUnmount() {
        TerminalService.off("command", this.commandHandler)
    },
    methods: {
        commandHandler(command: string): void {
            this.commandHistory.push(command)

            wsClient.sendCommand({
                message_type: 'Terminal',
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
