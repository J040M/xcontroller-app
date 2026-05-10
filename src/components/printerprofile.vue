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
    <Dialog :visible="visible" modal :header="$t('printer_profile.header')" :style="{ width: '25rem' }"
        :closable="false" optionLabel="name" optionValue="url">
        <div class="bottom-pad-10 flex items-center gap-4 mb-4 bottom-pad">
            <InputGroup class="bottom-pad-5">
                <InputText id="printerName" v-model="printerProfile.name" class="flex-auto"
                    :placeholder="$t('printer_profile.label_name')" autocomplete="off" />
            </InputGroup>
            <InputGroup class="bottom-pad-5">
                <InputText id="url" v-model="printerProfile.url" class="flex-auto"
                    :placeholder="$t('printer_profile.label_url')" autocomplete="off" />
            </InputGroup>
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="printerDimensions" class="font-semibold w-24">{{ $t('printer_profile.label_dimensions')
            }}</label>
            <InputGroup>
                <InputNumber id="xAxis" v-model="printerProfile.dimensions.X" inputId="printerDimensions" prefix="X " suffix=" mm"
                    fluid />
                <InputNumber id="yAxis" v-model="printerProfile.dimensions.Y" inputId="printerDimensions" prefix="Y " suffix=" mm"
                    fluid />
                <InputNumber id="zAxis" v-model="printerProfile.dimensions.Z" inputId="printerDimensions" prefix="Z " suffix=" mm"
                    fluid />
            </InputGroup>
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Save" @click="saveProfile" />
            <Button type="button" label="Cancel" severity="secondary" @click="visible = false" />
        </div>
    </Dialog>
</template>

<style scoped>
button {
    margin: 10px 10px 0 0;
}
.bottom-pad-10 {
    padding-bottom: 10px;
}
.bottom-pad-5 {
    padding-bottom: 5px;
}

</style>
