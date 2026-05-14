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
        useListener(wsClient, 'authfailed', () => {
            connectionStatus.value = false
            loadingStatus.value = false
        })

        function setWSS(): void {
            if (!selectedProfile.value) return
            const profile = printerProfiles.value.find((p) => p.uuid === selectedProfile.value)
            if (!profile) return
            wsClient.wsURL = profile.url
            wsClient.authToken = profile.authToken
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
    <printerProfile />

    <div class="flex flex-col gap-4 px-4 py-3">
        <Select
            class="w-full"
            v-model="selectedProfile"
            @value-change="setWSS"
            :options="printerProfiles"
            optionLabel="name"
            optionValue="uuid"
            filter
            filterBy="name"
            :emptyMessage="$t('connector.empty_message')"
            :emptyFilterMessage="$t('connector.empty_filter_message')"
            :emptySelectionMessage="$t('connector.empty_selection_message')"
            :selectionMessage="$t('connector.selection_message')"
        />

        <div class="flex items-center gap-2">
            <button
                v-if="!connectionStatus"
                :disabled="!selectedProfile || loadingStatus"
                @click="connectToWSS"
                class="w-10 h-10 rounded border border-primary-fixed-dim text-primary-fixed-dim flex items-center justify-center transition-colors hover:bg-primary-fixed-dim/10 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="$t('app.connector')"
            >
                <span v-if="loadingStatus" class="material-symbols-outlined animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined">power_settings_new</span>
            </button>
            <button
                v-else
                @click="wsClient.disconnect()"
                class="w-10 h-10 rounded border border-error text-error flex items-center justify-center transition-colors hover:bg-error/10"
            >
                <span class="material-symbols-outlined">power_off</span>
            </button>

            <button
                v-if="selectedProfile"
                @click="storage.deleteProfile('PrinterProfiles', selectedProfile)"
                class="w-10 h-10 rounded border border-outline-variant text-on-surface-variant flex items-center justify-center transition-colors hover:border-error hover:text-error"
            >
                <span class="material-symbols-outlined">delete</span>
            </button>

            <button
                @click="eventBus.emit('message', 'openProfileDialog')"
                class="w-10 h-10 rounded bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center transition-all hover:brightness-110 shadow-[0_0_10px_rgba(0,220,229,0.3)] ml-auto"
                :title="$t('printer_profile.header')"
            >
                <span class="material-symbols-outlined">add</span>
            </button>
        </div>
    </div>
</template>
