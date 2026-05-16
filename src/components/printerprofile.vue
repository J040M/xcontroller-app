<script lang="ts">
import { defineComponent, ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useI18n } from 'vue-i18n'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';
import { storage } from '../init/client';
import { isTauri } from '../transport';
import type { PrinterProfile, TransportType } from '../types/printer';

/** A serial port as reported by the Rust `list_serial_ports` command. */
interface SerialPortInfo {
    name: string
    kind: string
}

function defaultProfile(): PrinterProfile {
    return {
        uuid: '',
        status: false,
        name: '',
        url: '',
        authToken: '',
        transportType: 'websocket',
        serialPort: '',
        baudRate: 115200,
        printStatus: {
            state: 'unknown',
            file_name: undefined,
            elapsed_time: '',
            estimated_time: 0,
            progress: 0,
        },
        axisPositions: { X: 0, Y: 0, Z: 0, e0: 0, e1: 0 },
        dimensions: { X: 0, Y: 0, Z: 0 },
        temperatures: { e0: 0, e0_set: 0, e1: 0, e1_set: 0, bed: 0, bed_set: 0 },
        homed: false,
    }
}

export default defineComponent({
    name: 'printerProfileComponent',
    setup() {
        const { t } = useI18n()
        const printerProfile = ref<PrinterProfile>(defaultProfile())
        const visible = ref(false)

        // USB is only an option in the native (Tauri) app — the web build
        // has no serial access, so the selector is hidden there entirely.
        const tauri = isTauri()
        const availablePorts = ref<SerialPortInfo[]>([])
        const baudRates = [9600, 19200, 38400, 57600, 115200, 250000]
        const transportOptions: { label: string; value: TransportType }[] = tauri
            ? [
                { label: t('printer_profile.transport_websocket'), value: 'websocket' },
                { label: t('printer_profile.transport_usb'), value: 'usb' },
            ]
            : [{ label: t('printer_profile.transport_websocket'), value: 'websocket' }]

        async function refreshPorts(): Promise<void> {
            if (!tauri) return
            try {
                availablePorts.value = await invoke<SerialPortInfo[]>('list_serial_ports')
            } catch {
                availablePorts.value = []
            }
        }

        useListener(eventBus, 'message', (message: string) => {
            if (message === 'openProfileDialog') {
                printerProfile.value = defaultProfile()
                visible.value = true
                void refreshPorts()
            }
        })

        function saveProfile(): void {
            printerProfile.value.uuid = crypto.randomUUID()
            storage.saveProfile('PrinterProfiles', printerProfile.value)
            printerProfile.value = defaultProfile()
            visible.value = false
        }

        return {
            printerProfile, visible, saveProfile,
            tauri, availablePorts, baudRates, transportOptions, refreshPorts,
        }
    }
})
</script>

<template>
    <Dialog
        :visible="visible"
        modal
        :header="$t('printer_profile.header')"
        :style="{ width: '28rem' }"
        :closable="false"
    >
        <div class="flex flex-col gap-4 pt-2">
            <div class="flex flex-col gap-2">
                <label for="printerName" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                    {{ $t('printer_profile.label_name') }}
                </label>
                <InputText
                    id="printerName"
                    v-model="printerProfile.name"
                    autocomplete="off"
                    class="w-full font-code-sm"
                />
            </div>

            <!-- Connection type — USB is only offered in the native app -->
            <div v-if="tauri" class="flex flex-col gap-2">
                <label for="transportType" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                    {{ $t('printer_profile.label_transport') }}
                </label>
                <Select
                    id="transportType"
                    v-model="printerProfile.transportType"
                    :options="transportOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                />
            </div>

            <!-- WebSocket connection fields -->
            <template v-if="printerProfile.transportType !== 'usb'">
                <div class="flex flex-col gap-2">
                    <label for="url" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">URL</label>
                    <InputText
                        id="url"
                        v-model="printerProfile.url"
                        :placeholder="$t('printer_profile.label_url')"
                        autocomplete="off"
                        class="w-full font-code-sm"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="authToken" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                        {{ $t('printer_profile.label_auth_token') }}
                    </label>
                    <InputText
                        id="authToken"
                        v-model="printerProfile.authToken"
                        type="password"
                        :placeholder="$t('printer_profile.placeholder_auth_token')"
                        autocomplete="off"
                        class="w-full font-code-sm"
                    />
                </div>
            </template>

            <!-- USB serial connection fields -->
            <template v-else>
                <div class="flex flex-col gap-2">
                    <label for="serialPort" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                        {{ $t('printer_profile.label_serial_port') }}
                    </label>
                    <div class="flex gap-2">
                        <Select
                            id="serialPort"
                            v-model="printerProfile.serialPort"
                            :options="availablePorts"
                            optionLabel="name"
                            optionValue="name"
                            :placeholder="$t('printer_profile.placeholder_serial_port')"
                            class="w-full"
                        />
                        <button
                            type="button"
                            @click="refreshPorts"
                            :title="$t('printer_profile.btn_refresh_ports')"
                            class="w-10 shrink-0 rounded border border-outline-variant text-on-surface-variant flex items-center justify-center transition-colors hover:border-primary-fixed-dim hover:text-primary-fixed-dim"
                        >
                            <span class="material-symbols-outlined text-[18px]">refresh</span>
                        </button>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="baudRate" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                        {{ $t('printer_profile.label_baud_rate') }}
                    </label>
                    <Select
                        id="baudRate"
                        v-model="printerProfile.baudRate"
                        :options="baudRates"
                        class="w-full"
                    />
                </div>
            </template>

            <div class="flex flex-col gap-2">
                <span class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                    {{ $t('printer_profile.label_dimensions') }}
                </span>
                <InputGroup>
                    <InputNumber id="xAxis" v-model="printerProfile.dimensions.X" prefix="X " suffix=" mm" fluid />
                    <InputNumber id="yAxis" v-model="printerProfile.dimensions.Y" prefix="Y " suffix=" mm" fluid />
                    <InputNumber id="zAxis" v-model="printerProfile.dimensions.Z" prefix="Z " suffix=" mm" fluid />
                </InputGroup>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 pt-4">
                <Button
                    type="button"
                    label="Cancel"
                    severity="secondary"
                    @click="visible = false"
                />
                <Button
                    type="button"
                    label="Save"
                    @click="saveProfile"
                />
            </div>
        </template>
    </Dialog>
</template>
