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
        wsClient.on('message', (message: any) => {
            const data = JSON.parse(message.data) as MessageResponse

            if (data.message_type == 'Unsafe') {
                console.log('Message to terminals')
                data.raw_message = data.raw_message.replace(/\r/g, ' ')
                TerminalService.emit('response', data.raw_message)
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

            printer.unsafeCommand(command)
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
