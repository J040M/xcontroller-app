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
    <Dialog
        :visible="visible"
        modal
        :header="$t('heating_profile.header')"
        :style="{ width: '28rem' }"
        :closable="false"
    >
        <div class="flex flex-col gap-4 pt-2">
            <div class="flex flex-col gap-2">
                <label for="profileName" class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                    {{ $t('heating_profile.label_name') }}
                </label>
                <InputText
                    id="profileName"
                    v-model="heatingProfile.name"
                    autocomplete="off"
                    class="w-full font-code-sm"
                />
            </div>

            <div class="flex flex-col gap-2">
                <span class="text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant">
                    {{ $t('heating_profile.heating_values') }}
                </span>
                <InputGroup>
                    <InputNumber prefix="e0 " v-model="heatingProfile.e0" suffix=" °C" fluid />
                    <InputNumber prefix="bed " v-model="heatingProfile.bed" suffix=" °C" fluid />
                </InputGroup>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 pt-4">
                <Button type="button" label="Cancel" severity="secondary" @click="visible = false" />
                <Button type="button" label="Save" @click="saveProfile" />
            </div>
        </template>
    </Dialog>
</template>
