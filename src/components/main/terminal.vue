<script lang="ts">

import { defineComponent } from 'vue'

import TerminalService from 'primevue/terminalservice'
import { wsClient } from '../../init/client';
import { MessageResponse } from '../../types/messages';
import { gcommands_list } from '../../assets/terminal_commands';

export default defineComponent({
    name: 'terminalComponent',
    data: () => ({
        commandHistory: [] as string[],
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

            // Check is a known command
            switch (command) {
                case 'help':
                    TerminalService.emit('response', "Available commands: help \n | gcommands (list of commands)")
                    return
                case 'gcommands':
                    TerminalService.emit('response', gcommands_list)
                    return
            }

            console.log('Sending command to server:', command)
            wsClient.sendCommand({
                message_type: 'Unsafe',
                message: command
            })
        }
    },
})
</script>

<template>
    <Terminal class="terminal" prompt="xcontroller $ " />
</template>

<style scoped>
.terminal {
    height: 750px;
    width: 100%;
}
</style>
