<script lang="ts">
import { defineComponent, ref } from 'vue'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';
import { storage } from '../init/client';
import type { PrinterProfile } from '../types/printer';

function defaultProfile(): PrinterProfile {
    return {
        uuid: '',
        status: false,
        name: '',
        url: '',
        printStatus: {
            state: 'unknown',
            file_name: undefined,
            elapsed_time: '',
            estimated_time: 0,
            remaining_time: null,
            progress: 0,
            current_layer: null,
            total_layers: null,
        },
        axisPositions: { X: 0, Y: 0, Z: 0, e0: 0, e1: 0 },
        dimensions: { X: 0, Y: 0, Z: 0 },
        temperatures: { e0: 0, e0_set: 0, e1: 0, e1_set: 0, bed: 0, bed_set: 0, ambient: null },
        telemetry: { fan_speed: null, power_draw: null, safety_state: 'unknown' },
        homed: false,
    }
}

export default defineComponent({
    name: 'printerProfileComponent',
    setup() {
        const printerProfile = ref<PrinterProfile>(defaultProfile())
        const visible = ref(false)

        useListener(eventBus, 'message', (message: string) => {
            if (message === 'openProfileDialog') {
                printerProfile.value = defaultProfile()
                visible.value = true
            }
        })

        function saveProfile(): void {
            printerProfile.value.uuid = crypto.randomUUID()
            storage.saveProfile('PrinterProfiles', printerProfile.value)
            printerProfile.value = defaultProfile()
            visible.value = false
        }

        return { printerProfile, visible, saveProfile }
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
