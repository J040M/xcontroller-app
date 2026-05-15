<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';
import { storage, getTransport, setActiveTransport, printer } from '../init/client';
import { createTransport } from '../transport';
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

        useListener(eventBus, 'connection:open', () => {
            connectionStatus.value = true
            loadingStatus.value = false
        })
        useListener(eventBus, 'connection:close', () => {
            connectionStatus.value = false
        })
        useListener(eventBus, 'connection:error', () => {
            connectionStatus.value = false
            loadingStatus.value = false
            eventBus.emit('message', 'openConnectionErrorDialog')
        })
        useListener(eventBus, 'connection:authfailed', () => {
            connectionStatus.value = false
            loadingStatus.value = false
        })

        function setProfile(): void {
            if (!selectedProfile.value) return
            const profile = printerProfiles.value.find((p) => p.uuid === selectedProfile.value)
            if (!profile) return
            // Build the transport for this profile's link type (WebSocket or
            // USB) and make it the active one — `client.ts`'s dispatcher
            // re-binds to it, so the rest of the app is unaffected.
            setActiveTransport(createTransport(profile))
            printer.bindProfile(profile)
        }

        function connectToPrinter(): void {
            loadingStatus.value = true
            getTransport().connect()
        }

        function disconnect(): void {
            getTransport().disconnect()
        }

        return {
            eventBus, storage,
            printerProfiles, loadingStatus, connectionStatus, selectedProfile,
            setProfile, connectToPrinter, disconnect,
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
            @value-change="setProfile"
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
                @click="connectToPrinter"
                class="w-10 h-10 rounded border border-primary-fixed-dim text-primary-fixed-dim flex items-center justify-center transition-colors hover:bg-primary-fixed-dim/10 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="$t('app.connector')"
            >
                <span v-if="loadingStatus" class="material-symbols-outlined animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined">power_settings_new</span>
            </button>
            <button
                v-else
                @click="disconnect"
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
