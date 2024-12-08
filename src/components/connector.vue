<script lang="ts">
import { defineComponent } from 'vue'
import { wsClient } from '../init/client';
import { PrinterProfile } from '../types/printer';

export default defineComponent({
    name: 'connectorComponent',
    data: () => ({
        printerProfiles: [] as PrinterProfile[],
        connectionStatus: false as boolean,
    }),
    setup() {
        return { wsClient }
    },
    mounted() {
        this.printerProfiles = JSON.parse(localStorage.getItem('printerProfiles') || '[]') as PrinterProfile[]

        // Set connection status on events
        wsClient.on('connected', () => this.connectionStatus = true)
        wsClient.on('disconnected', () => this.connectionStatus = false)
    },
    methods: {
        setWSS(): void {
            // wsClient.wsURL = this.websocketURL
        }
    }
})
</script>

<template>
    <div class="card flex justify-center">
        <AutoComplete dropdown :suggestions="printerProfiles" variant="filled" />
        <!-- <InputText type="text" placeholder="ws://websocket-server-url:port" @focusout="setWSURL" v-model="websocketURL"
            style="flex: 1; margin-right: 10px;" /> -->
        <Button v-if="!connectionStatus" icon="pi pi-power-off" style="color: red" @click="wsClient.connect()" />
        <Button v-else icon="pi pi-power-off" style="color: green" @click="wsClient.disconnect()" />
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}
</style>
