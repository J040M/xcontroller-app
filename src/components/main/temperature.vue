<script lang="ts">
import Chart, { ChartData, ChartItem } from 'chart.js/auto';
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'temperatureComponent',
    data: () => ({
        graphData: {
            labels: ['+90sec', '+60sec', '+30sec', 'now'],
            // TODO: Loop this for multiple extruders
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
            }] as ChartData['datasets']
        }
    }),
    mounted() {
        const ctx = document.getElementById('temp-graph') as ChartItem;
        new Chart(ctx, {
            type: 'line',
            data: this.graphData,
            options: {},
        });

        //TODO: Fetch data from backend
    }
})
</script>

<template>
    <div class="temp-status-container">
        <div class="temperature-graph-container">
            <canvas id="temp-graph">

            </canvas>
        </div>
        <label>
            {{ $t('temperature.grad_extruder') }}
        </label>
        <label>
            {{ $t('temperature.grad_bed') }}
        </label>

    </div>
</template>

<style scoped></style>
