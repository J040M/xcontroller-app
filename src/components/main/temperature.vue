<script lang="ts">
import { ChartData } from 'chart.js/auto';
import { defineComponent } from 'vue'
import { printer } from '../../init/client';
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
            labels: ['+90sec', '+60sec', '+30sec', 'now'],
            datasets: [{
                label: 'Extruder 1',
                data: [0, 0, 0, 0],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Bed',
                data: [0, 0, 0, 0],
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
         * Get the temperatures every 30 seconds and update the graph
         * set a timeout of 1 second to get the temperatures and wait to update the graph
         * to avoid the graph to be updated before the temperatures are fetched
         * TODO: Probably a better approach could improve this code
         */
        setInterval(() => {
            if (!this.printer.printerInfo.status) return;

            setTimeout(() => {
                this.printer.getTemperatures();
            }, 1000);

            const e0 = [...this.graphData.datasets[0].data.slice(1), this.printer.printerInfo.temperatures.e0];
            const bed = [...this.graphData.datasets[0].data.slice(1), this.printer.printerInfo.temperatures.bed];

            this.graphData.datasets[0].data = e0;
            this.graphData.datasets[1].data = bed;
        }, 30000);
    },
    methods: {
        openHeatingDialog(): void {
            eventBus.emit('message', 'openHeatingDialog')
        },
        selectProfile(profileIndex: number): void {
            this.printer.setHotendTemperature(this.heatingProfiles[profileIndex].e0)
            this.printer.setBedTemperature(this.heatingProfiles[profileIndex].bed)
        }
    },
    setup() {
        return { printer }
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

    <Button @click="openHeatingDialog" icon="pi pi-plus" />

    <DataTable v-if="heatingProfiles.length > 0" :value="heatingProfiles">
        <Column field="name" header="Name"></Column>
        <Column field="e0" header="Extruder 1"></Column>
        <Column field="bed" header="Bed"></Column>
        <Column field="actions" header="Actions">
            <template #body="{ index }">
                <Button icon="pi pi-check" class="mr-2" @click="selectProfile(index)" />
                <Button icon="pi pi-trash" />
            </template>
        </Column>
    </DataTable>
</template>

<style scoped></style>
