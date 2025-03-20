<script lang="ts">
import { defineComponent } from 'vue'
import { printer, wsClient } from '../init/client'
import { MessageResponse } from '../types/messages'

export default defineComponent({
    name: 'statusComponent',
    mounted() {
        printer.getPrintStatus()

        wsClient.on('message', (incomingMessage: MessageEvent) => {
            const message: MessageResponse = JSON.parse(incomingMessage.data)
            // TODO: Maybe this should be a method in the printer class
            if(message.message === 'not-printing' || message.message.replaceAll('"', '') === 'not-printing') {
                this.printer.printerInfo.printStatus.state = 'unknown'
                return
            }

            if (message.message_type === 'M27' && message.message !== 'not-printing') {
                const response = JSON.parse(message.message)
                // this.printer.printerInfo.printStatus.state = 'printing'
                this.printer.printerInfo.printStatus.progress = parseInt(response)
            } else if (message.message_type === 'M27 C') {
                // TODO: Backend should not send double quotes
                message.message = message.message.replaceAll('"', '')
                if(message.message === 'not-printing') {
                    this.printer.printerInfo.printStatus.state = 'unknown'
                    return
                };

                this.printer.printerInfo.printStatus.state = 'idle'
                this.printer.printerInfo.printStatus.file_name = message.message
            } else if (message.message_type === 'M31') {
                // TODO: Backend should not send double quotes
                message.message = message.message.replaceAll('"', '')
                this.printer.printerInfo.printStatus.elapsed_time = message.message
            }
        })
    },
    setup() {
        return { printer }
    },

})
</script>

<template>
    <button @click="printer.getPrintStatus()">Reload</button>
    <div v-if="printer.printerInfo.printStatus.state !== 'unknown'">
        <label>{{ $t('status.state') }}</label>
        {{ printer.printerInfo.printStatus.state }} <br>
        <label>{{ $t('status.file') }}</label>
        {{ printer.printerInfo.printStatus.file_name }}<br>
        <label>{{ $t('status.elapsed_time') }}</label>
        {{ printer.printerInfo.printStatus.elapsed_time }}<br>
        <!-- <label>{{ $t('status.estimated_time') }}</label>
        {{ printer.printerInfo.printStatus.estimated_time }}<br> -->
        <label>{{ $t('status.progress') }}</label>
        {{ printer.printerInfo.printStatus.progress }} %<br>

        <div class="button-action-group">
            <Button @click="printer.startPrint()" label="print" icon="pi pi-play" />
            <Button @click="printer.pausePrint()" label="pause" icon="pi pi-pause" />
            <Button @click="printer.stopPrint()" label="stop" icon="pi pi-stop" />
        </div>
    </div>
    <div v-else>
        <label>{{ $t('status.no_status') }}</label>
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}
</style>
