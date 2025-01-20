<script lang="ts">
import { ChartData } from 'chart.js/auto';
import { defineComponent } from 'vue'
import { printer } from '../../init/client';

export default defineComponent({
    name: 'temperatureComponent',
    data: () => ({
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
        /**
         * Get the temperatures every 30 seconds and update the graph
         * set a timeout of 1 second to get the temperatures and wait to update the graph
         * to avoid the graph to be updated before the temperatures are fetched
         * TODO: Probably a better approach could improve this code
         */
        setInterval(() => {
            // if (!this.printer.printerInfo.status) return;

            setTimeout(() => {
                this.printer.getTemperatures();
            }, 1000);

            const e0 = [...this.graphData.datasets[0].data.slice(1), this.printer.printerInfo.temperatures.e0];
            const bed = [...this.graphData.datasets[0].data.slice(1), this.printer.printerInfo.temperatures.bed];

            this.graphData.datasets[0].data = e0;
            this.graphData.datasets[1].data = bed;
        }, 30000);
    },
    setup() {
        return { printer }
    },
})
</script>

<template>
    <div class="temp-status-container">
        <div class="temperature-graph-container">
            <Chart type="line" :data="graphData" :options="graphOptions" />
        </div>
    </div>
</template>

<style scoped></style>
