<script lang="ts">
import { ChartData } from 'chart.js/auto';
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
        const activeProfileId = ref<string | null>(null)

        const graphData = ref({
            labels: ['+120sec', '+90sec', '+60sec', '+30sec', 'now'],
            datasets: [
                {
                    label: 'Extruder 1',
                    data: [0, 0, 0, 0, 0],
                    fill: false,
                    borderColor: '#00dce5',
                    backgroundColor: '#00dce5',
                    tension: 0.3,
                },
                {
                    label: 'Bed',
                    data: [0, 0, 0, 0, 0],
                    fill: false,
                    borderColor: '#fd8b00',
                    backgroundColor: '#fd8b00',
                    tension: 0.3,
                },
            ] as ChartData['datasets'],
        })
        const graphOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#dce4e4', font: { family: 'Inter', size: 11 } },
                },
            },
            scales: {
                x: {
                    grid: { color: 'rgba(58,73,74,0.3)' },
                    ticks: { color: '#849495', font: { family: 'JetBrains Mono', size: 10 } },
                },
                y: {
                    grid: { color: 'rgba(58,73,74,0.3)' },
                    ticks: { color: '#849495', font: { family: 'JetBrains Mono', size: 10 } },
                },
            },
        }

        let pollHandle: ReturnType<typeof setInterval> | null = null
        let updateHandle: ReturnType<typeof setTimeout> | null = null

        onMounted(() => {
            heatingProfiles.value = JSON.parse(localStorage.getItem('HeatingProfiles') || '[]') as HeatingProfile[]
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

        function selectProfile(profile: HeatingProfile): void {
            activeProfileId.value = profile.uuid
            printer.setHotendTemperature(profile.e0)
            printer.setBedTemperature(profile.bed)
        }

        function shutdownHeating(): void {
            activeProfileId.value = null
            printer.setHotendTemperature(0)
            printer.setBedTemperature(0)
        }

        function deleteProfile(uuid: string): void {
            storage.deleteProfile('HeatingProfiles', uuid)
            heatingProfiles.value = JSON.parse(localStorage.getItem('HeatingProfiles') || '[]') as HeatingProfile[]
        }

        const e0Segments = (target: number) => Math.min(8, Math.max(0, Math.round((target / 280) * 8)))
        const bedSegments = (target: number) => Math.min(8, Math.max(0, Math.round((target / 110) * 8)))

        const ambient = computed(() => printer.printerInfo.temperatures.ambient)
        const fanSpeed = computed(() => printer.printerInfo.telemetry.fan_speed)
        const powerDraw = computed(() => printer.printerInfo.telemetry.power_draw)
        const safetyState = computed(() => printer.printerInfo.telemetry.safety_state)

        return {
            eventBus, printer, heatingProfiles, activeProfileId,
            graphData, graphOptions,
            selectProfile, shutdownHeating, deleteProfile,
            e0Segments, bedSegments,
            ambient, fanSpeed, powerDraw, safetyState,
        }
    },
})
</script>

<template>
    <heatingProfile />

    <div class="px-margin py-margin flex flex-col gap-8 max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-start justify-between gap-6 flex-wrap">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="bg-primary-fixed-dim text-on-primary-fixed text-[10px] font-bold px-1.5 py-0.5 rounded-sm">MON_01</span>
                    <h1 class="font-headline-lg text-primary-fixed-dim tracking-tight uppercase">Thermal Command</h1>
                </div>
                <p class="text-on-surface-variant font-code-sm uppercase tracking-widest opacity-70">Real-time telemetry / PID active</p>
            </div>
            <div class="flex gap-4">
                <div class="tactical-border bg-surface-container-low px-4 py-3 flex flex-col">
                    <span class="text-[10px] font-label-caps text-outline uppercase">Extruder_01</span>
                    <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-code-lg text-primary-fixed-dim">{{ printer.printerInfo.temperatures.e0.toFixed(1) }}</span>
                        <span class="text-xs font-code-sm text-outline">°C</span>
                    </div>
                </div>
                <div class="tactical-border bg-surface-container-low px-4 py-3 flex flex-col">
                    <span class="text-[10px] font-label-caps text-outline uppercase">Heatbed_00</span>
                    <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-code-lg text-secondary-container">{{ printer.printerInfo.temperatures.bed.toFixed(1) }}</span>
                        <span class="text-xs font-code-sm text-outline">°C</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Graph -->
        <div class="tactical-border bg-surface-container-lowest p-1">
            <div class="bg-surface-container p-6 w-full h-[450px] relative overflow-hidden">
                <Chart type="line" :data="graphData" :options="graphOptions" class="w-full h-full" />
                <div class="absolute bottom-2 left-6 flex items-center gap-2 text-xs font-code-sm text-primary-fixed-dim/50 uppercase tracking-[0.2em] pointer-events-none">
                    <span class="animate-pulse">●</span> LIVE_FEED
                </div>
                <div class="scanline-overlay opacity-20" />
            </div>
        </div>

        <!-- Profiles -->
        <div class="flex flex-col gap-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary-fixed-dim">target</span>
                    <h2 class="font-headline-md text-on-surface uppercase tracking-tight">Thermal Presets</h2>
                </div>
                <div class="flex gap-3">
                    <button
                        @click="shutdownHeating"
                        class="flex items-center gap-2 px-4 py-2.5 bg-surface-variant/30 text-error border border-error/30 rounded-sm font-label-caps uppercase tracking-wider hover:bg-error/10 transition-colors"
                    >
                        <span class="material-symbols-outlined text-sm">power_settings_new</span>
                        Shutdown
                    </button>
                    <button
                        @click="eventBus.emit('message', 'openHeatingDialog')"
                        class="flex items-center gap-2 px-4 py-2.5 bg-surface-variant/30 text-primary-fixed-dim border border-primary-fixed-dim/30 rounded-sm font-label-caps uppercase tracking-wider hover:bg-surface-variant transition-colors"
                    >
                        <span class="material-symbols-outlined text-sm">add_box</span>
                        New Profile
                    </button>
                </div>
            </div>

            <div v-if="heatingProfiles.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    v-for="(profile, idx) in heatingProfiles"
                    :key="profile.uuid"
                    class="tactical-border p-5 flex flex-col gap-5 transition-colors border-l-4 relative overflow-hidden"
                    :class="activeProfileId === profile.uuid
                        ? 'bg-surface-variant border-l-primary-fixed-dim shadow-[0_0_25px_rgba(0,220,225,0.05)]'
                        : 'bg-surface-container hover:bg-surface-container-high border-l-primary-fixed-dim/20'"
                >
                    <div v-if="activeProfileId === profile.uuid" class="absolute top-0 right-0 pointer-events-none">
                        <div class="bg-primary-fixed-dim text-on-primary-fixed text-[8px] font-bold px-4 py-1 rotate-45 translate-x-3 -translate-y-1 uppercase">Active</div>
                    </div>

                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-[10px] font-label-caps uppercase" :class="activeProfileId === profile.uuid ? 'text-primary-fixed-dim' : 'text-outline'">
                                Protocol_{{ String(idx + 1).padStart(2, '0') }}
                            </div>
                            <h3 class="text-xl font-code-lg text-primary-fixed-dim">{{ profile.name }}</h3>
                        </div>
                        <span
                            class="text-[10px] font-code-sm px-2 py-0.5 rounded-sm"
                            :class="activeProfileId === profile.uuid
                                ? 'text-primary-fixed-dim bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 animate-pulse'
                                : 'text-outline bg-surface-variant'"
                        >
                            {{ activeProfileId === profile.uuid ? 'ENGAGED' : 'IDLE' }}
                        </span>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-1">
                            <div class="flex justify-between text-[10px] font-label-caps text-on-surface-variant">
                                <span>EXTRUDER_01</span>
                                <span class="text-on-surface">{{ profile.e0 }}°C</span>
                            </div>
                            <div class="segmented-bar">
                                <div
                                    v-for="i in 8"
                                    :key="`e0-${profile.uuid}-${i}`"
                                    class="segment"
                                    :class="i <= e0Segments(profile.e0) ? 'active-primary' : ''"
                                />
                            </div>
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between text-[10px] font-label-caps text-on-surface-variant">
                                <span>HEATBED_00</span>
                                <span class="text-on-surface">{{ profile.bed }}°C</span>
                            </div>
                            <div class="segmented-bar">
                                <div
                                    v-for="i in 8"
                                    :key="`bed-${profile.uuid}-${i}`"
                                    class="segment"
                                    :class="i <= bedSegments(profile.bed) ? 'active-secondary' : ''"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-2 mt-2">
                        <button
                            @click="selectProfile(profile)"
                            class="flex-1 py-2 text-[10px] font-label-caps uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border"
                            :class="activeProfileId === profile.uuid
                                ? 'bg-primary-fixed-dim text-on-primary-fixed border-primary-fixed-dim shadow-[0_0_10px_rgba(99,247,255,0.3)]'
                                : 'bg-surface-variant text-on-surface border-outline-variant hover:bg-primary-fixed-dim hover:text-on-primary-fixed'"
                        >
                            <span class="material-symbols-outlined text-sm">{{ activeProfileId === profile.uuid ? 'verified' : 'check' }}</span>
                            {{ activeProfileId === profile.uuid ? 'Selected' : 'Activate' }}
                        </button>
                        <button
                            @click="deleteProfile(profile.uuid)"
                            class="w-10 h-10 flex items-center justify-center text-outline hover:text-error transition-colors border border-outline-variant hover:border-error/40"
                        >
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-col items-center gap-2 py-12 text-on-surface-variant">
                <span class="material-symbols-outlined text-3xl">thermostat</span>
                <span class="font-label-caps uppercase tracking-widest text-[10px]">No thermal presets</span>
            </div>
        </div>

        <!-- Footer stat strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-surface-container-low/50 border border-outline-variant/30 p-3 flex flex-col items-center">
                <span class="text-[8px] font-label-caps text-outline uppercase">Ambient_Temp</span>
                <span class="font-code-sm text-on-surface">{{ ambient !== null ? `${ambient}°C` : '—' }}</span>
            </div>
            <div class="bg-surface-container-low/50 border border-outline-variant/30 p-3 flex flex-col items-center">
                <span class="text-[8px] font-label-caps text-outline uppercase">Fan_Speed</span>
                <span class="font-code-sm text-on-surface">{{ fanSpeed !== null ? `${fanSpeed}%` : '—' }}</span>
            </div>
            <div class="bg-surface-container-low/50 border border-outline-variant/30 p-3 flex flex-col items-center">
                <span class="text-[8px] font-label-caps text-outline uppercase">Power_Draw</span>
                <span class="font-code-sm text-on-surface">{{ powerDraw !== null ? `${powerDraw}W` : '—' }}</span>
            </div>
            <div class="bg-surface-container-low/50 border border-outline-variant/30 p-3 flex flex-col items-center">
                <span class="text-[8px] font-label-caps text-outline uppercase">Safety_Status</span>
                <span class="font-code-sm text-[10px] uppercase tracking-tighter" :class="safetyState === 'secure' ? 'text-primary-fixed-dim' : safetyState === 'fault' ? 'text-error' : 'text-outline'">{{ safetyState }}</span>
            </div>
        </div>
    </div>
</template>
