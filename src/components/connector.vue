<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';
import { storage, wsClient, printer } from '../init/client';
import printerProfile from './printerprofile.vue';
import type { PrinterProfile } from '../types/printer';

export default defineComponent({
    name: 'connectorComponent',
    components: {
        printerProfile,
    },
    setup() {
        const printerProfiles = ref<PrinterProfile[]>([])
        const loadingStatus = ref(false)
        const connectionStatus = ref(false)
        const selectedProfile = ref<string | null>(null)

        onMounted(() => {
            printerProfiles.value = JSON.parse(localStorage.getItem('PrinterProfiles') || '[]') as PrinterProfile[]
        })

        useListener(wsClient, 'connected', () => {
            connectionStatus.value = true
            loadingStatus.value = false
        })
        useListener(wsClient, 'disconnected', () => {
            connectionStatus.value = false
        })
        useListener(wsClient, 'error', () => {
            connectionStatus.value = false
            loadingStatus.value = false
            eventBus.emit('message', 'openConnectionErrorDialog')
        })

        function setWSS(): void {
            if (!selectedProfile.value) return
            const profile = printerProfiles.value.find((p) => p.uuid === selectedProfile.value)
            if (!profile) return
            wsClient.wsURL = profile.url
            printer.bindProfile(profile)
        }

        function connectToWSS(): void {
            loadingStatus.value = true
            wsClient.connect()
        }

        return {
            wsClient, eventBus, storage,
            printerProfiles, loadingStatus, connectionStatus, selectedProfile,
            setWSS, connectToWSS,
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
