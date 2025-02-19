<script lang="ts">
import { defineComponent } from 'vue'
import { eventBus } from '../utils/eventbus';
import { storage, wsClient } from '../init/client';
import printerProfile from './printerprofile.vue';
import type { PrinterProfile } from '../types/printer';

export default defineComponent({
    name: 'connectorComponent',
    components: {
        printerProfile,
    },
    data: () => ({
        printerProfiles: [] as PrinterProfile[],
        loadingStatus: false as boolean,
        connectionStatus: false as boolean,
        dialogOpen: false as boolean,
        selectedProfile: null as string | null,
    }),
    setup() {
        return { wsClient, eventBus, storage }
    },
    mounted() {
        this.printerProfiles = JSON.parse(localStorage.getItem('PrinterProfiles') || '[]') as PrinterProfile[]

        wsClient.on('connected', () => {
            this.connectionStatus = true
            this.loadingStatus = false
        })
        wsClient.on('disconnected', () => this.connectionStatus = false)
        wsClient.on('error', () => {
            this.connectionStatus = false
            this.loadingStatus = false
            eventBus.emit('message', 'openConnectionErrorDialog')
        })
    },
    methods: {
        setWSS(): void {
            if(!this.selectedProfile) return
            
            const profile = this.printerProfiles.find((profile) => profile.uuid === this.selectedProfile)
            if(!profile) return
            
            wsClient.wsURL = profile.url
        },
        connectToWSS(): void {
            this.loadingStatus = true
            wsClient.connect()
        }
    }
})
</script>

<template>
    <!-- This is a dialog for machine profiles. -->
    <!-- Only show on new creating -->
    <printerProfile />
    <div class="flex flex-column">
        <div class="flex  bg-primary m-2">
            <Select class="full-width" v-model="selectedProfile" @value-change="setWSS" :options="printerProfiles"
                optionLabel="name" optionValue="uuid" filter filterBy="name"
                :emptyMessage="$t('connector.empty_message')" :emptyFilterMessage="$t('connector.empty_filter_message')"
                :emptySelectionMessage="$t('connector.empty_selection_message')"
                :selectionMessage="$t('connector.selection_message')" />
        </div>
        <div class="flex  bg-primary m-2 button-action-group">
            <Button v-if="!connectionStatus" icon="pi pi-power-off" style="color: red" :loading="loadingStatus" :disabled="!selectedProfile" @click="connectToWSS" />
            <Button v-else icon="pi pi-power-off" style="color: green" @click="wsClient.disconnect()" />
            <Button v-if="selectedProfile" v-on:click="storage.deleteProfile('PrinterProfiles', selectedProfile)" icon="pi pi-trash" />
            <Button icon="pi pi-plus" style="color: green" @click="eventBus.emit('message', 'openProfileDialog')" />
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
