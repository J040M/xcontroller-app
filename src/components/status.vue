<script lang="ts">
import { defineComponent } from 'vue'
import { printer } from '../init/client'
import { eventBus } from '../utils/eventbus'
import { useListener } from '../utils/listeners'

export default defineComponent({
    name: 'statusComponent',
    setup() {
        useListener(eventBus, 'connection:open', () => {
            printer.getPrintStatus()
        })

        useListener(eventBus, 'printer:m27', (raw: string) => {
            const cleaned = raw.replaceAll('"', '')
            if (cleaned === 'not-printing') {
                printer.printerInfo.printStatus.state = 'unknown'
                return
            }
            try {
                printer.printerInfo.printStatus.progress = parseInt(JSON.parse(raw))
            } catch {
                /* ignore unparseable progress payload */
            }
        })

        useListener(eventBus, 'printer:m27c', (raw: string) => {
            const cleaned = raw.replaceAll('"', '')
            if (cleaned === 'not-printing') {
                printer.printerInfo.printStatus.state = 'unknown'
                return
            }
            printer.printerInfo.printStatus.state = 'idle'
            printer.printerInfo.printStatus.file_name = cleaned
        })

        useListener(eventBus, 'printer:m31', (raw: string) => {
            printer.printerInfo.printStatus.elapsed_time = raw.replaceAll('"', '')
        })

        // If the user opens this panel after the connection is already up,
        // fetch the current status immediately. Otherwise we wait for the
        // 'connection:open' event so we don't fire a command pre-connect.
        if (printer.printerInfo.status) {
            printer.getPrintStatus()
        }

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
