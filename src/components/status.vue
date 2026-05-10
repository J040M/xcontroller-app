<script lang="ts">
import { computed, defineComponent } from 'vue'
import { printer } from '../init/client'
import { eventBus } from '../utils/eventbus'
import { useListener } from '../utils/listeners'

export default defineComponent({
    name: 'statusComponent',
    setup() {
        useListener(eventBus, 'connection:open', () => {
            printer.getPrintStatus()
        })

        useListener(eventBus, 'printer:m27', (raw: string) => {
            const cleaned = raw.replaceAll('"', '')
            if (cleaned === 'not-printing') {
                printer.printerInfo.printStatus.state = 'unknown'
                return
            }
            try {
                printer.printerInfo.printStatus.progress = parseInt(JSON.parse(raw))
            } catch {
                /* ignore unparseable progress payload */
            }
        })

        useListener(eventBus, 'printer:m27c', (raw: string) => {
            const cleaned = raw.replaceAll('"', '')
            if (cleaned === 'not-printing') {
                printer.printerInfo.printStatus.state = 'unknown'
                return
            }
            printer.printerInfo.printStatus.state = 'idle'
            printer.printerInfo.printStatus.file_name = cleaned
        })

        useListener(eventBus, 'printer:m31', (raw: string) => {
            printer.printerInfo.printStatus.elapsed_time = raw.replaceAll('"', '')
        })

        if (printer.printerInfo.status) {
            printer.getPrintStatus()
        }

        const stateColor = computed(() => {
            switch (printer.printerInfo.printStatus.state) {
                case 'printing': return 'text-primary-fixed-dim'
                case 'paused': return 'text-tertiary-container'
                case 'error':
                case 'stopped': return 'text-error'
                case 'idle': return 'text-on-surface'
                default: return 'text-outline'
            }
        })

        return { printer, stateColor }
    },
})
</script>

<template>
    <div class="flex flex-col gap-5 px-4 py-3">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">Telemetry</span>
            <button
                @click="printer.getPrintStatus()"
                class="w-7 h-7 rounded-sm border border-outline-variant text-on-surface-variant flex items-center justify-center hover:text-primary-fixed-dim hover:border-primary-fixed-dim transition-colors"
                title="Reload"
            >
                <span class="material-symbols-outlined text-[16px]">refresh</span>
            </button>
        </div>

        <template v-if="printer.printerInfo.printStatus.state !== 'unknown'">
            <div class="flex items-center justify-between">
                <span class="font-label-caps text-on-surface-variant uppercase">{{ $t('status.state') }}</span>
                <span class="font-code-sm font-bold uppercase" :class="stateColor">
                    {{ printer.printerInfo.printStatus.state }}
                </span>
            </div>

            <div class="flex flex-col gap-1">
                <span class="font-label-caps text-on-surface-variant uppercase">{{ $t('status.file') }}</span>
                <span class="font-code-sm text-on-surface truncate" :title="printer.printerInfo.printStatus.file_name">
                    {{ printer.printerInfo.printStatus.file_name || '—' }}
                </span>
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-end">
                    <span class="font-label-caps text-on-surface-variant uppercase">{{ $t('status.progress') }}</span>
                    <span class="font-code-lg text-primary-fixed-dim">{{ printer.printerInfo.printStatus.progress }}%</span>
                </div>
                <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                        class="h-full bg-primary-fixed-dim shadow-[0_0_8px_rgba(0,220,229,0.6)] transition-all"
                        :style="{ width: `${printer.printerInfo.printStatus.progress}%` }"
                    />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="bg-surface-container-low p-3 border border-outline-variant rounded-sm">
                    <div class="font-label-caps text-on-surface-variant uppercase mb-1">Extruder</div>
                    <div class="font-code-lg text-secondary-container">
                        {{ printer.printerInfo.temperatures.e0 }}°C
                        <span class="text-on-surface-variant text-xs">/ {{ printer.printerInfo.temperatures.e0_set }}</span>
                    </div>
                </div>
                <div class="bg-surface-container-low p-3 border border-outline-variant rounded-sm">
                    <div class="font-label-caps text-on-surface-variant uppercase mb-1">Bed</div>
                    <div class="font-code-lg text-secondary-container">
                        {{ printer.printerInfo.temperatures.bed }}°C
                        <span class="text-on-surface-variant text-xs">/ {{ printer.printerInfo.temperatures.bed_set }}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <div class="font-label-caps text-on-surface-variant uppercase mb-1">{{ $t('status.elapsed_time') }}</div>
                    <div class="font-code-sm text-on-surface">{{ printer.printerInfo.printStatus.elapsed_time || '—' }}</div>
                </div>
                <div>
                    <div class="font-label-caps text-on-surface-variant uppercase mb-1">Remaining</div>
                    <div class="font-code-sm text-on-surface">{{ printer.printerInfo.printStatus.remaining_time || '—' }}</div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant/40">
                <button
                    @click="printer.startPrint()"
                    class="py-2 bg-primary-fixed-dim text-on-primary-fixed font-label-caps uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 hover:brightness-110 shadow-[0_0_10px_rgba(0,220,229,0.25)] transition-all"
                >
                    <span class="material-symbols-outlined">play_arrow</span>
                </button>
                <button
                    @click="printer.pausePrint()"
                    class="py-2 border border-primary-fixed-dim/40 text-primary-fixed-dim font-label-caps uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 hover:bg-primary-fixed-dim/10 transition-all"
                >
                    <span class="material-symbols-outlined">pause</span>
                </button>
                <button
                    @click="printer.stopPrint()"
                    class="py-2 border border-error/40 text-error font-label-caps uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 hover:bg-error/10 transition-all"
                >
                    <span class="material-symbols-outlined">stop</span>
                </button>
            </div>
        </template>

        <div v-else class="flex flex-col items-center gap-2 py-4 text-on-surface-variant">
            <span class="material-symbols-outlined text-2xl">sensors_off</span>
            <span class="font-label-caps uppercase tracking-widest text-[10px]">{{ $t('status.no_status') }}</span>
        </div>
    </div>
</template>
