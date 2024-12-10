<script lang="ts">
import { defineComponent, ref } from 'vue'
import { wsClient } from '../init/client';
import { PrinterProfile } from '../types/printer';
import  printerProfile from './printerprofile.vue';

import { eventBus } from '../utils/eventbus';

export default defineComponent({
    name: 'connectorComponent',
    components: {
        printerProfile,
    },
    data: () => ({
        printerProfiles: [] as PrinterProfile[],
        connectionStatus: false as boolean,
        dialogOpen: false as boolean,
        websocketURL: ref(''),
    }),
    setup() {
        return { wsClient }
    },
    mounted() {
        this.printerProfiles = JSON.parse(localStorage.getItem('PrinterProfiles') || '[]') as PrinterProfile[]

        // Set connection status on events
        wsClient.on('connected', () => this.connectionStatus = true)
        wsClient.on('disconnected', () => this.connectionStatus = false)
    },
    methods: {
        setWSS(): void {
            console.log('Setting WS URL to:', this.websocketURL)
            wsClient.wsURL = this.websocketURL
        },
        openProfileDialog(): void {
            eventBus.emit('message', 'openProfileDialog')
        }
    }
})
</script>

<template>
    <printerProfile />
    <div class="card flex justify-center">
        <Select v-model="websocketURL" @focusout="setWSS" :options="printerProfiles" optionLabel="name" optionValue="url" filter filterBy="name" class="w-full" />
        <Button v-if="!connectionStatus" icon="pi pi-power-off" style="color: red" @click="wsClient.connect()" />
        <Button v-else icon="pi pi-power-off" style="color: green" @click="wsClient.disconnect()" />
        <Button icon="pi pi-plus" style="color: green" @click="openProfileDialog" />
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}
</style>
