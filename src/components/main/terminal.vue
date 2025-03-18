<script lang="ts">

import { defineComponent } from 'vue'

import TerminalService from 'primevue/terminalservice'
import { wsClient, printer } from '../../init/client';
import { gcommands_list } from '../../assets/terminal_commands';
import type { MessageResponse } from '../../types/messages';

export default defineComponent({
    name: 'terminalComponent',
    data: () => ({
        commandHistory: [] as string[],
    }),
    mounted() {
        // Listen to commands from terminal 
        TerminalService.on("command", this.commandHandler)

        // Listen to messages from WS
        wsClient.on('message', (incomingMessage: MessageEvent) => {
            const message: MessageResponse = JSON.parse(incomingMessage.data)

            if (message.message_type == 'terminal') {
                console.log('Message to terminal')
                message.raw_message = message.raw_message.replace(/\r/g, ' ')
                TerminalService.emit('response', message.raw_message)
            } 

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
                    TerminalService.emit('response', "Available commands: <help> \n <gcommands> (list of commands)")
                    return
                case 'gcommands':
                    TerminalService.emit('response', gcommands_list)
                    return
            }

            printer.terminalCommand(command)
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
