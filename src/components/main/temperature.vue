<script lang="ts">
import Chart, { ChartData, ChartItem } from 'chart.js/auto';
import { defineComponent } from 'vue'
import { printer } from '../../init/client';

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

        // TODO: This will not work when having multiple extruders (let's fix)
        // This is causing too much recursion
        // setInterval(() => {
        //     this.graphData.datasets[0].data = this.updateArray(this.graphData.datasets[0].data as number[], Math.floor(Math.random() * 100))
        //     this.graphData.datasets[1].data = this.updateArray(this.graphData.datasets[1].data as number[], Math.floor(Math.random() * 100))
        // }, 5000)
    },
    setup() {
        return { printer }
    },
    methods: {
        updateArray(nArray: number[], newValue: number): number[] {
            nArray.shift()
            nArray.push(newValue)

            return nArray
        },
    },
})
</script>

<template>
    <div class="temp-status-container">
        <button class="temperature-btn" @click="printer.getTemperatures()">
            Get temperatures
        </button>
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
