<script lang="ts">
import Chart from 'chart.js/auto';
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n';

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
    setup() {
        const { t } = useI18n() // use as global scope
        return { t }
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
