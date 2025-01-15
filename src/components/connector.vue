<script lang="ts">
import { defineComponent, ref } from 'vue'
import { eventBus } from '../utils/eventbus';
import { wsClient } from '../init/client';
import printerProfile from './printerprofile.vue';
import type{ PrinterProfile } from '../types/printer';

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
            //TODO: Modify this to use printer profile
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
    <!-- This is a dialog for machine profiles. -->
    <!-- Only show on new creating -->
    <printerProfile />
    <!--  -->
    <div class="flex flex-column">
        <div class="flex  bg-primary m-2">
            <Select class="full-width" v-model="websocketURL" @focusout="setWSS" :options="printerProfiles"
                optionLabel="name" optionValue="url" filter filterBy="name" 
                :emptyMessage="$t('connector.empty_message')" :emptyFilterMessage="$t('connector.empty_filter_message')"
                :emptySelectionMessage="$t('connector.empty_selection_message')" :selectionMessage="$t('connector.selection_message')"/>
        </div>
        <div class="flex  bg-primary m-2 button-action-group">
            <Button v-if="!connectionStatus" icon="pi pi-power-off" style="color: red" @click="wsClient.connect()" />
            <Button v-else icon="pi pi-power-off" style="color: green" @click="wsClient.disconnect()" />
            <Button icon="pi pi-plus" style="color: green" @click="openProfileDialog" />
        </div>
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}

.button-action-group {
    margin-top: 10px;
}

.full-width {
    width: 100%;
}
</style>
