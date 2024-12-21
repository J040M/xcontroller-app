<script lang="ts">
import { defineComponent } from 'vue'
import { PrinterProfile } from '../types/printer';
import { eventBus } from '../utils/eventbus';

export default defineComponent({
    name: 'printerProfileComponent',
    data: () => ({
        printerProfile: {
            name: '',
            url: '',
            firmware: '',
            dimensions: {
                x: 0,
                y: 0,
                z: 0,
            },
        } as PrinterProfile,
        visible: false,
    }),
    mounted() {
        eventBus.on('message', (message: string) => {
            if (message === 'openProfileDialog') {
                this.visible = true
            }
        })
    },
    methods: {
        saveProfile(): void {
            let profiles = localStorage.getItem('printerProfiles')
            if (profiles || profiles === '[]') {
                const nProfiles = JSON.parse(profiles) as PrinterProfile[] || []
                nProfiles.push(this.printerProfile)
                localStorage.setItem('PrinterProfiles', JSON.stringify(nProfiles))
            } else {
                let nProfiles: PrinterProfile[] = []
                nProfiles.push(this.printerProfile)
                localStorage.setItem('PrinterProfiles', JSON.stringify(nProfiles))
            }
            this.visible = false
        }
    }
})
</script>

<template>
    <Dialog :visible="visible" modal :header="$t('printer_profile.header')" :style="{ width: '25rem' }"
        :closable="false" optionLabel="name" optionValue="url">
        <div class="flex items-center gap-4 mb-4">
            <label for="printerName" class="font-semibold w-24">{{ $t('printer_profile.label_name') }}</label>
            <InputText id="printerName" v-model="printerProfile.name" lass="flex-auto" autocomplete="off" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="url" class="font-semibold w-24">{{ $t('printer_profile.label_url') }}</label>
            <InputText id="url" v-model="printerProfile.url" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="firmware" class="font-semibold w-24">{{ $t('printer_profile.label_firmware') }}</label>
            <InputText id="firmware" v-model="printerProfile.firmware" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="printerDimensions" class="font-semibold w-24">{{ $t('printer_profile.label_dimensions')
                }}</label>
            <InputNumber id="xAxis" v-model="printerProfile.dimensions.x" inputId="printerDimensions" suffix=" mm"
                fluid />
            <InputNumber id="yAxis" v-model="printerProfile.dimensions.y" inputId="printerDimensions" suffix=" mm"
                fluid />
            <InputNumber id="zAxis" v-model="printerProfile.dimensions.z" inputId="printerDimensions" suffix=" mm"
                fluid />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
            <Button type="button" label="Save" @click="saveProfile" />
        </div>
    </Dialog>
</template>

<style scoped></style>
