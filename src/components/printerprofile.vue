<script lang="ts">
import { defineComponent } from 'vue'
import { eventBus } from '../utils/eventbus';
import { storage } from '../init/client';
import type { PrinterProfile } from '../types/printer';

export default defineComponent({
    name: 'printerProfileComponent',
    data: () => ({
        printerProfile: {
            uuid: '',
            name: '',
            url: '',
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
            this.printerProfile.uuid = crypto.randomUUID()
            storage.saveProfile('PrinterProfiles', this.printerProfile)
            this.printerProfile = {} as PrinterProfile
            this.visible = false
        }
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
                <InputNumber id="xAxis" v-model="printerProfile.dimensions.x" inputId="printerDimensions" prefix="X " suffix=" mm"
                    fluid />
                <InputNumber id="yAxis" v-model="printerProfile.dimensions.y" inputId="printerDimensions" prefix="Y " suffix=" mm"
                    fluid />
                <InputNumber id="zAxis" v-model="printerProfile.dimensions.z" inputId="printerDimensions" prefix="Z " suffix=" mm"
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
