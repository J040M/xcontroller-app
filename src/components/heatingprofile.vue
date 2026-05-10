<script lang="ts">
import { defineComponent, ref } from 'vue'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';
import { storage } from '../init/client';
import type { HeatingProfile } from '../types/printer';

function defaultHeatingProfile(): HeatingProfile {
    return {
        uuid: '',
        name: '',
        e0: 0,
        e1: 0,
        e2: 0,
        bed: 0,
    }
}

export default defineComponent({
    name: 'heatingProfileComponent',
    setup() {
        const heatingProfile = ref<HeatingProfile>(defaultHeatingProfile())
        const visible = ref(false)

        useListener(eventBus, 'message', (message: string) => {
            if (message === 'openHeatingDialog') {
                heatingProfile.value = defaultHeatingProfile()
                visible.value = true
            }
        })

        function saveProfile(): void {
            heatingProfile.value.uuid = crypto.randomUUID()
            storage.saveProfile('HeatingProfiles', heatingProfile.value)
            heatingProfile.value = defaultHeatingProfile()
            visible.value = false
        }

        return { heatingProfile, visible, saveProfile }
    }
})
</script>

<template>
    <Dialog :visible="visible" modal :header="$t('heating_profile.header')" :style="{ width: '25rem' }"
        :closable="false" optionLabel="name" optionValue="url">
        <div class="flex items-center gap-4 mb-4 bottom-pad-10">
            <InputGroup>
                <InputText id="profileName" v-model="heatingProfile.name" class="flex-auto" autocomplete="off" :placeholder="$t('heating_profile.label_name')" />
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
