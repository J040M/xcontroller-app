<script lang="ts">
import { defineComponent } from 'vue'
import { eventBus } from '../utils/eventbus';
import { storage } from '../init/client';
import type { HeatingProfile } from '../types/printer';

export default defineComponent({
    name: 'heatingProfileComponent',
    data: () => ({
        heatingProfile: {
            uuid: '',
            name: '',
            e0: 0,
            e1: 0,
            e2: 0,
            bed: 0,
        } as HeatingProfile,
        visible: false,
    }),
    mounted() {
        eventBus.on('message', (message: string) => {
            if (message === 'openHeatingDialog') {
                this.visible = true
            }
        })
    },
    methods: {
        saveProfile(): void {
            this.heatingProfile.uuid = crypto.randomUUID()
            storage.saveProfile('HeatingProfiles', this.heatingProfile)
            this.heatingProfile = {} as HeatingProfile
            this.visible = false
        }
    }
})
</script>

<template>
    <Dialog :visible="visible" modal :header="$t('heating_profile.header')" :style="{ width: '25rem' }"
        :closable="false" optionLabel="name" optionValue="url">
        <div class="flex items-center gap-4 mb-4 bottom-pad-10">
            <InputGroup>
                <InputText id="profileName" v-model="heatingProfile.name" lass="flex-auto" autocomplete="off" :placeholder="$t('heating_profile.label_name')" />
            </InputGroup>
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="heatingValues" class="font-semibold w-24 bottom-pad-5">{{ $t('heating_profile.heating_values')
                }}</label>
            <InputGroup>
                <InputNumber prefix="e0 " placeholder="e0" id="e0Value" v-model="heatingProfile.e0" inputId="heatingE0"
                    suffix=" °C" fluid />
                <InputNumber prefix="bed " placeholder="bed" id="bedValue" v-model="heatingProfile.bed"
                    inputId="heatingBed" suffix=" °C" fluid />
            </InputGroup>
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Save" @click="saveProfile" />
            <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
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
