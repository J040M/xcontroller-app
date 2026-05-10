<script lang="ts">
import { ChartData } from 'chart.js/auto';
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import { printer, storage } from '../../init/client';
import { eventBus } from '../../utils/eventbus';

import heatingProfile from '../heatingprofile.vue';
import type { HeatingProfile } from '../../types/printer';

export default defineComponent({
    name: 'temperatureComponent',
    components: {
        heatingProfile
    },
    setup() {
        const heatingProfiles = ref<HeatingProfile[]>([])
        const graphData = ref({
            labels: ['+120sec', '+90sec', '+60sec', '+30sec', 'now'],
            datasets: [
                {
                    label: 'Extruder 1',
                    data: [0, 0, 0, 0, 0],
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                },
                {
                    label: 'Bed',
                    data: [0, 0, 0, 0, 0],
                    fill: false,
                    borderColor: 'rgb(255, 255, 0)',
                    tension: 0.1,
                },
            ] as ChartData['datasets'],
            height: 200,
        })
        const graphOptions = {
            responsive: true,
            maintainAspectRatio: true,
        }

        let pollHandle: ReturnType<typeof setInterval> | null = null
        let updateHandle: ReturnType<typeof setTimeout> | null = null

        onMounted(() => {
            heatingProfiles.value = JSON.parse(localStorage.getItem('HeatingProfiles') || '[]') as HeatingProfile[]
            // Poll temperatures every 30 seconds; the printer's response
            // arrives asynchronously, so wait 1s before sampling state.
            pollHandle = setInterval(() => {
                if (!printer.printerInfo.status) return
                printer.getTemperatures()
                updateHandle = setTimeout(() => {
                    const ds = graphData.value.datasets!
                    const e0 = [...(ds[0].data as number[]).slice(1), printer.printerInfo.temperatures.e0]
                    const bed = [...(ds[1].data as number[]).slice(1), printer.printerInfo.temperatures.bed]
                    ds[0].data = e0
                    ds[1].data = bed
                }, 1000)
            }, 30000)
        })

        onBeforeUnmount(() => {
            if (pollHandle) clearInterval(pollHandle)
            if (updateHandle) clearTimeout(updateHandle)
            pollHandle = null
            updateHandle = null
        })

        function selectProfile(profileIndex: number): void {
            printer.setHotendTemperature(heatingProfiles.value[profileIndex].e0)
            printer.setBedTemperature(heatingProfiles.value[profileIndex].bed)
        }

        function shutdownHeating(): void {
            printer.setHotendTemperature(0)
            printer.setBedTemperature(0)
        }

        return { eventBus, storage, heatingProfiles, graphData, graphOptions, selectProfile, shutdownHeating }
    },
})
</script>

<template>
    <heatingProfile />

    <div class="temp-status-container">
        <div class="temperature-graph-container">
            <Chart type="line" :data="graphData" :options="graphOptions" />
        </div>
    </div>

    <Button @click="shutdownHeating" style="color: red" icon="pi pi-power-off" class="btn-pad" />
    <Button @click="eventBus.emit('message', 'openHeatingDialog')" icon="pi pi-plus" />

    <DataTable v-if="heatingProfiles.length > 0" :value="heatingProfiles">
        <Column field="name" header="Name"></Column>
        <Column field="e0" header="Extruder 1"></Column>
        <Column field="bed" header="Bed"></Column>
        <Column field="actions" header="Actions">
            <template #body="{ index }">
                <Button icon="pi pi-check" class="mr-2 btn-pad" @click="selectProfile(index)" />
                <Button icon="pi pi-trash"
                    @click="storage.deleteProfile('HeatingProfiles', heatingProfiles[index].uuid)" />
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
.btn-pad {
    margin-right: 5px;
}
</style>
