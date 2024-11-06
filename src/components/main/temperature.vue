<script lang="ts">
import Chart from 'chart.js/auto';
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'temperatureComponent',
    data: () => ({
        gcodeCommand: '',
    }),
    methods: {
    },
    mounted() {
        console.log('Temp component mounted')


        const labels = ['-1', '-30sec', 'now']

        const data = {
            labels: labels,
            datasets: [{
                label: 'Extruder 1',
                data: [25, 130, 203],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Bed',
                data: [50, 51, 50, 49],
                fill: false,
                borderColor: 'rgb(255, 255, 0)',
                tension: 0.1
            }
        ]
        };
        const ctx = document.getElementById('temp-graph');
        const lineChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {},
        });
    },
})
</script>

<template>
    <div class="temp-status-container">
        <h2>Temperatures</h2>

        <div class="temperature-graph-container">
            <canvas id="temp-graph">

            </canvas>
        </div>
        <!-- TODO: Loop this for multiple extruders -->
        <label>
            Extruder:
        </label>
        <label>
            Bed:
        </label>

    </div>
</template>

<style scoped></style>
