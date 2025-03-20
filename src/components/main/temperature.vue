<script lang="ts">
import { ChartData } from 'chart.js/auto';
import { defineComponent } from 'vue'
import { printer, storage } from '../../init/client';
import { eventBus } from '../../utils/eventbus';

import heatingProfile from '../heatingprofile.vue';
import type { HeatingProfile } from '../../types/printer';

export default defineComponent({
    name: 'temperatureComponent',
    components: {
        heatingProfile
    },
    data: () => ({
        heatingProfiles: [] as HeatingProfile[],
        graphData: {
            labels: ['+120sec','+90sec', '+60sec', '+30sec', 'now'],
            datasets: [{
                label: 'Extruder 1',
                data: [0, 0, 0, 0, 0],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Bed',
                data: [0, 0, 0, 0, 0],
                fill: false,
                borderColor: 'rgb(255, 255, 0)',
                tension: 0.1
            }] as ChartData['datasets'],
            height: 200
        },
        graphOptions: {
            responsive: true,
            maintainAspectRatio: true
        }
    }),
    mounted() {
        this.heatingProfiles = JSON.parse(localStorage.getItem('HeatingProfiles') || '[]') as HeatingProfile[]
        /**
         * Get the temperatures every 5 seconds and update the graph
         * set a timeout of 1 second to get the temperatures and wait to update the graph
         * to avoid the graph to be updated before the temperatures are fetched
         * TODO: Probably a better approach could improve this code
         */
        setInterval(() => {
            if (!printer.printerInfo.status) return;
            
            printer.getTemperatures();
            
            setTimeout(() => {
                const e0 = [...this.graphData.datasets[0].data.slice(1), printer.printerInfo.temperatures.e0];
                const bed = [...this.graphData.datasets[1].data.slice(1), printer.printerInfo.temperatures.bed];
                this.graphData.datasets[0].data = e0;
                this.graphData.datasets[1].data = bed;
            }, 1000);
        }, 30000);
    },
    methods: {
        selectProfile(profileIndex: number): void {
            printer.setHotendTemperature(this.heatingProfiles[profileIndex].e0)
            printer.setBedTemperature(this.heatingProfiles[profileIndex].bed)
        },
        shutdownHeating(): void {
            printer.setHotendTemperature(0)
            printer.setBedTemperature(0)
        }
    },
    setup() {
        return { eventBus, storage }
    }
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
