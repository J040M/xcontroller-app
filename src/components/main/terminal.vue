<script lang="ts">

import { defineComponent } from 'vue'

import TerminalService from 'primevue/terminalservice'

export default defineComponent({
    name: 'terminalComponent',
    data: () => ({
        gcodeCommand: '',
        lastCommand: '' as string,
        commandHistory: [] as string[]
    }),
    mounted() {
        console.log('Terminal component mounted')

        TerminalService.on("command", this.commandHandler)
    },
    beforeUnmount() {
        TerminalService.off("command", this.commandHandler)
    },
    methods: {
        sendCommand(message: string) {
            console.log('sendign command: ', message)

            // Do some filtering
            const finalMessage = ''
            // send clean output to printer
            this.sendPrinterCommand(finalMessage)
        },
        sendPrinterCommand(message: string) {
            // send message to pritner and recover response
            const response = message

            TerminalService.emit('response', response);
            TerminalService.on("command", this.commandHandler(message))
            // send message to terminal
            TerminalService.emit("response", ["response"])
        },
        commandHandler(message: string) {
            this.commandHistory.push(message)

            let response
            
            response = 'Test response'

            // switch (command) {
            //     case 'validcommand':
            //         response = 'Valid command';
            //         break;

            //     default:
            //         response = 'Unknown command: ' + command;
            // }

            TerminalService.emit('response', response);
        }
    },
})
</script>

<template>

    <Terminal prompt="xcontroller $ " />

</template>

<style scoped></style>
