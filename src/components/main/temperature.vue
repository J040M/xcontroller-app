<script lang="ts">
import Chart, { ChartItem } from 'chart.js/auto';
import { defineComponent } from 'vue'
import { wsClient } from '../../init/client';

export default defineComponent({
    name: 'temperatureComponent',
    
    methods: {
    },
    mounted() {
        const labels = ['-1min', '-30sec', 'now']

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
                data: [50, 51, 50],
                fill: false,
                borderColor: 'rgb(255, 255, 0)',
                tension: 0.1
            }
            ]
        };

        const ctx = document.getElementById('temp-graph') as ChartItem;
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {},
        });

        // TODO: Add websocket listener for temperature updates

        // Create a timer that send a command every 30sec to get the temperature
        // setInterval(() => {
        //     wsClient.sendCommand({
        //         message_type: 'GCommand',
        //         message: 'M105'
        //     })
        // }, 30000)
    }
})
</script>

<template>
    <div class="temp-status-container">
        <div class="temperature-graph-container">
            <canvas id="temp-graph">

            </canvas>
        </div>
        <!-- TODO: Loop this for multiple extruders -->
        <label>
            {{ $t('temperature.grad_extruder') }}
        </label>
        <label>
            {{ $t('temperature.grad_bed') }}
        </label>

    </div>
</template>

<style scoped></style>
