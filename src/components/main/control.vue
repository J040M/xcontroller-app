<script lang="ts">
import { computed, defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { printer } from '../../init/client';
import Three3DPrinter from '../../3d-render/3dprinter.ts';
import type { Axis } from '../../types/printer';

export default defineComponent({
    name: 'controlComponent',
    setup() {
        const movementValue = ref(10)
        const extruderValue = ref(1)
        /** Fan speed as 0-100% (UI). Sent to printer as 0-255. */
        const fanPercent = ref(0)
        /** Extrusion feed multiplier 0-100% (UI). */
        const feedPercent = ref(50)
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        const canvasContainerRef = ref<HTMLDivElement | null>(null)

        let viz: Three3DPrinter | null = null
        let resizeObserver: ResizeObserver | null = null
        let stopPositionWatch: (() => void) | null = null
        let stopDimensionsWatch: (() => void) | null = null
        let lastFanCommandTimer: ReturnType<typeof setTimeout> | null = null

        onMounted(() => {
            const canvas = canvasRef.value
            const container = canvasContainerRef.value
            if (!canvas || !container) return

            viz = new Three3DPrinter(canvas, printer.printerInfo.dimensions)
            viz.updatePosition(printer.axisPositions)

            // Live position updates: react to the printer store directly so we
            // don't have to drive a polling RAF in the component — the viz has
            // its own render loop.
            stopPositionWatch = watch(
                () => [printer.axisPositions.X, printer.axisPositions.Y, printer.axisPositions.Z] as const,
                ([X, Y, Z]) => viz?.updatePosition({ X, Y, Z }),
            )

            // Profile dimensions can change when the user picks a different
            // printer in the connector.
            stopDimensionsWatch = watch(
                () => [printer.printerInfo.dimensions.X, printer.printerInfo.dimensions.Y, printer.printerInfo.dimensions.Z] as const,
                ([X, Y, Z]) => viz?.setDimensions({ X, Y, Z }),
            )

            resizeObserver = new ResizeObserver(() => {
                if (!container || !viz) return
                const rect = container.getBoundingClientRect()
                viz.resize(rect.width, rect.height)
            })
            resizeObserver.observe(container)
        })

        onBeforeUnmount(() => {
            if (lastFanCommandTimer) clearTimeout(lastFanCommandTimer)
            lastFanCommandTimer = null

            stopPositionWatch?.()
            stopDimensionsWatch?.()
            resizeObserver?.disconnect()
            resizeObserver = null
            viz?.dispose()
            viz = null
        })

        function sendMovementCommand(command: Axis | string): void {
            switch (command) {
                case 'extrude':
                    printer.moveAxis('e0', '+', extruderValue.value)
                    break
                case 'retract':
                    printer.moveAxis('e0', '-', extruderValue.value)
                    break
                case 'X+':
                case 'Y+':
                case 'Z+':
                case 'X-':
                case 'Y-':
                case 'Z-': {
                    const axis = command[0].toUpperCase() as Axis
                    const direction = command[1]
                    printer.moveAxis(axis, direction, movementValue.value)
                    break
                }
                default:
                    console.error('No command found. Returning...')
            }
        }

        function setFanFromSegment(segmentIndex: number): void {
            // 10 segments → 0..100% in 10% steps; index 0 means 10%.
            fanPercent.value = (segmentIndex + 1) * 10
            if (lastFanCommandTimer) clearTimeout(lastFanCommandTimer)
            lastFanCommandTimer = setTimeout(() => {
                printer.setFanSpeed(Math.round((fanPercent.value / 100) * 255))
                lastFanCommandTimer = null
            }, 300)
        }

        function setFeedFromSegment(segmentIndex: number): void {
            feedPercent.value = (segmentIndex + 1) * 10
            // Feed multiplier: M220 S<percent>. Bypass the typed wrapper since
            // setFeedrate isn't in PrinterCommands.
            ;(printer as { unsafeCommand?: (cmd: string) => void }).unsafeCommand?.(`M220 S${feedPercent.value}`)
        }

        const fanSegments = computed(() => Math.ceil(fanPercent.value / 10))
        const feedSegments = computed(() => Math.ceil(feedPercent.value / 10))

        return {
            printer,
            movementValue, extruderValue, fanPercent, feedPercent,
            fanSegments, feedSegments, canvasRef, canvasContainerRef,
            sendMovementCommand, setFanFromSegment, setFeedFromSegment,
        }
    },
})
</script>

<template>
    <div class="px-margin py-margin flex flex-col items-center gap-6">
        <!-- 3D Workspace Visualizer -->
        <div
            ref="canvasContainerRef"
            class="w-full max-w-5xl aspect-video bg-surface-container-lowest border border-outline-variant/40 rounded overflow-hidden relative"
        >
            <canvas ref="canvasRef" id="3dprinter-animation" class="w-full h-full block" />
            <!-- Decorative HUD corner brackets -->
            <div class="pointer-events-none absolute inset-0">
                <div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-fixed-dim/40" />
                <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-fixed-dim/40" />
                <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-fixed-dim/40" />
                <div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-fixed-dim/40" />
            </div>
            <div class="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse" />
                <span class="text-[9px] font-code-sm uppercase tracking-[0.25em] text-primary-fixed-dim/80">
                    Vol {{ printer.printerInfo.dimensions.X }}×{{ printer.printerInfo.dimensions.Y }}×{{ printer.printerInfo.dimensions.Z }} mm
                </span>
            </div>

            <!-- X/Y/Z position vertical overlay on the left of the viewport -->
            <div class="pointer-events-none absolute top-12 left-4 bottom-12 flex flex-col gap-3 w-44">
                <div class="pointer-events-auto relative overflow-hidden bg-surface-container-lowest/85 backdrop-blur-md border-l-2 border-primary-fixed-dim rounded-r p-3">
                    <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">X COORDINATE</div>
                    <div class="flex items-baseline gap-2">
                        <span class="font-code-lg text-2xl text-primary-fixed-dim tracking-tighter">{{ printer.axisPositions.X.toFixed(2) }}</span>
                        <span class="text-[10px] font-code-sm text-outline">MM</span>
                    </div>
                </div>
                <div class="pointer-events-auto relative overflow-hidden bg-surface-container-lowest/85 backdrop-blur-md border-l-2 border-secondary-container rounded-r p-3">
                    <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">Y COORDINATE</div>
                    <div class="flex items-baseline gap-2">
                        <span class="font-code-lg text-2xl text-secondary-container tracking-tighter">{{ printer.axisPositions.Y.toFixed(2) }}</span>
                        <span class="text-[10px] font-code-sm text-outline">MM</span>
                    </div>
                </div>
                <div class="pointer-events-auto relative overflow-hidden bg-surface-container-lowest/85 backdrop-blur-md border-l-2 border-tertiary-container rounded-r p-3">
                    <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">Z COORDINATE</div>
                    <div class="flex items-baseline gap-2">
                        <span class="font-code-lg text-2xl text-tertiary-container tracking-tighter">{{ printer.axisPositions.Z.toFixed(2) }}</span>
                        <span class="text-[10px] font-code-sm text-outline">MM</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manual Control Deck -->
        <div class="w-full max-w-5xl border border-outline-variant/60 rounded-xl p-8 bg-surface-container-lowest relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div class="grid-overlay opacity-5" />
            <div class="absolute top-0 right-0 w-32 h-32 bg-primary-fixed-dim/5 blur-[80px]" />
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-secondary-container/5 blur-[100px]" />

            <!-- Header -->
            <div class="flex justify-between items-end mb-10 relative">
                <div class="flex flex-col">
                    <div class="flex items-center gap-3 mb-1">
                        <div class="w-1.5 h-1.5 bg-primary-fixed-dim rounded-full animate-pulse" />
                        <span class="text-[10px] font-code-sm text-primary-fixed-dim/80 uppercase tracking-[0.3em]">Module-04 // Subsystem</span>
                    </div>
                    <h3 class="font-headline-lg text-primary-fixed-dim tracking-tighter">CONTROL DECK</h3>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <div class="px-3 py-1 bg-primary-fixed-dim/10 border border-primary-fixed-dim/20 rounded text-[10px] font-label-caps text-primary-fixed-dim">
                        MANUAL OVERRIDE: ACTIVE
                    </div>
                    <div class="h-px w-48 bg-gradient-to-r from-transparent via-outline-variant to-transparent" />
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
                <!-- D-Pad (5 cols) -->
                <div class="lg:col-span-5 flex flex-col items-center justify-center gap-6">
                    <div class="relative w-72 h-72 flex items-center justify-center">
                        <!-- Z+/Z- side rail -->
                        <div class="absolute -left-16 h-full flex flex-col justify-center gap-4">
                            <button
                                @click="sendMovementCommand('Z+')"
                                class="w-12 h-20 bg-surface-container-high border border-tertiary-container/50 hover:bg-tertiary-container/20 rounded-lg flex flex-col items-center justify-center transition-all"
                            >
                                <span class="text-[9px] font-code-sm text-tertiary-container mb-1">Z+</span>
                                <span class="material-symbols-outlined text-tertiary-container">expand_less</span>
                            </button>
                            <button
                                @click="sendMovementCommand('Z-')"
                                class="w-12 h-20 bg-surface-container-high border border-tertiary-container/50 hover:bg-tertiary-container/20 rounded-lg flex flex-col items-center justify-center transition-all"
                            >
                                <span class="material-symbols-outlined text-tertiary-container">expand_more</span>
                                <span class="text-[9px] font-code-sm text-tertiary-container mt-1">Z-</span>
                            </button>
                        </div>

                        <div class="absolute inset-0 border border-outline-variant/30 rounded-full" />
                        <div class="absolute w-[110%] h-px bg-outline-variant/20" />
                        <div class="absolute h-[110%] w-px bg-outline-variant/20" />

                        <div class="relative w-full h-full p-8 flex flex-col items-center justify-between">
                            <button
                                @click="sendMovementCommand('Y+')"
                                class="w-16 h-12 bg-surface-container-high border border-outline-variant/50 hover:bg-primary-fixed-dim/20 hover:border-primary-fixed-dim transition-all rounded-t-xl flex flex-col items-center justify-center group"
                            >
                                <span class="text-[9px] font-code-sm text-on-surface-variant group-hover:text-primary-fixed-dim mb-0.5">Y+</span>
                                <span class="material-symbols-outlined text-primary-fixed-dim scale-110">keyboard_arrow_up</span>
                            </button>

                            <div class="flex justify-between w-full items-center">
                                <button
                                    @click="sendMovementCommand('X-')"
                                    class="w-12 h-16 bg-surface-container-high border border-outline-variant/50 hover:bg-primary-fixed-dim/20 hover:border-primary-fixed-dim transition-all rounded-l-xl flex flex-col items-center justify-center group"
                                >
                                    <span class="text-[9px] font-code-sm text-on-surface-variant group-hover:text-primary-fixed-dim mb-0.5">X-</span>
                                    <span class="material-symbols-outlined text-primary-fixed-dim scale-110">keyboard_arrow_left</span>
                                </button>

                                <div class="p-2 bg-surface-container-lowest rounded-full border border-outline-variant/20 shadow-2xl relative">
                                    <button
                                        @click="printer.autoHome()"
                                        class="w-20 h-20 rounded-full bg-surface-variant/40 border-2 border-primary-fixed-dim shadow-[0_0_20px_rgba(0,220,229,0.2)] hover:shadow-[0_0_30px_rgba(0,220,229,0.4)] hover:bg-primary-fixed-dim/10 transition-all flex flex-col items-center justify-center"
                                    >
                                        <span class="material-symbols-outlined text-3xl text-primary-fixed-dim mb-1">home_pin</span>
                                        <span class="text-[9px] font-label-caps text-primary-fixed-dim font-bold">HOME</span>
                                    </button>
                                    <div class="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-primary-fixed-dim/50" />
                                    <div class="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-primary-fixed-dim/50" />
                                </div>

                                <button
                                    @click="sendMovementCommand('X+')"
                                    class="w-12 h-16 bg-surface-container-high border border-outline-variant/50 hover:bg-primary-fixed-dim/20 hover:border-primary-fixed-dim transition-all rounded-r-xl flex flex-col items-center justify-center group"
                                >
                                    <span class="text-[9px] font-code-sm text-on-surface-variant group-hover:text-primary-fixed-dim mb-0.5">X+</span>
                                    <span class="material-symbols-outlined text-primary-fixed-dim scale-110">keyboard_arrow_right</span>
                                </button>
                            </div>

                            <button
                                @click="sendMovementCommand('Y-')"
                                class="w-16 h-12 bg-surface-container-high border border-outline-variant/50 hover:bg-primary-fixed-dim/20 hover:border-primary-fixed-dim transition-all rounded-b-xl flex flex-col items-center justify-center group"
                            >
                                <span class="material-symbols-outlined text-primary-fixed-dim scale-110">keyboard_arrow_down</span>
                                <span class="text-[9px] font-code-sm text-on-surface-variant group-hover:text-primary-fixed-dim mt-0.5">Y-</span>
                            </button>
                        </div>
                    </div>

                    <!-- Step distance -->
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-label-caps text-on-surface-variant uppercase">Step</span>
                        <InputNumber
                            v-model="movementValue"
                            :min="0.1"
                            :max="100"
                            :step="1"
                            showButtons
                            buttonLayout="horizontal"
                            inputClass="font-code-sm text-center w-20"
                            suffix=" mm"
                        />
                    </div>
                </div>

                <!-- Power Bars (4 cols) -->
                <div class="lg:col-span-4 flex flex-col gap-8 justify-center">
                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between items-baseline px-1">
                            <span class="text-[10px] font-label-caps text-on-surface-variant tracking-widest">COOLING FAN / SPEED</span>
                            <span class="font-code-lg text-primary-fixed-dim">{{ fanPercent }}%</span>
                        </div>
                        <div class="flex gap-1 h-12 items-end">
                            <button
                                v-for="i in 10"
                                :key="`fan-${i}`"
                                @click="setFanFromSegment(i - 1)"
                                class="flex-1 h-full transition-all hover:brightness-125"
                                :class="i <= fanSegments
                                    ? 'bg-primary-fixed-dim/40 border border-primary-fixed-dim/30 shadow-[0_0_10px_rgba(0,220,229,0.3)]'
                                    : 'bg-surface-variant/20 border border-outline-variant/10'"
                            />
                        </div>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between items-baseline px-1">
                            <span class="text-[10px] font-label-caps text-on-surface-variant tracking-widest">EXTRUSION FEED / FLOW</span>
                            <span class="font-code-lg text-secondary-container">{{ (feedPercent / 100).toFixed(1) }}X</span>
                        </div>
                        <div class="flex gap-1 h-12 items-end">
                            <button
                                v-for="i in 10"
                                :key="`feed-${i}`"
                                @click="setFeedFromSegment(i - 1)"
                                class="flex-1 h-[80%] transition-all hover:brightness-125"
                                :class="i <= feedSegments
                                    ? 'bg-secondary-container/60 border border-secondary-container/40 shadow-[0_0_10px_rgba(253,139,0,0.3)]'
                                    : 'bg-surface-variant/20 border border-outline-variant/10'"
                            />
                        </div>
                    </div>
                </div>

                <!-- Tactical Actions (3 cols) -->
                <div class="lg:col-span-3 flex flex-col gap-4 justify-center">
                    <button
                        @click="printer.bedLeveling()"
                        class="relative group overflow-hidden"
                    >
                        <div class="absolute inset-0 bg-secondary-container/10 group-hover:bg-secondary-container/20 transition-colors" />
                        <div class="relative py-4 px-4 border border-secondary-container/40 flex items-center gap-4">
                            <div class="w-10 h-10 bg-secondary-container flex items-center justify-center rounded shadow-[0_0_15px_rgba(253,139,0,0.5)]">
                                <span class="material-symbols-outlined text-on-secondary-container">grid_view</span>
                            </div>
                            <div class="flex flex-col items-start">
                                <span class="text-[10px] font-label-caps text-secondary-container font-bold">ENGAGE PROTOCOL</span>
                                <span class="text-xs font-bold text-on-surface tracking-wider">AUTO BED LEVEL</span>
                            </div>
                        </div>
                        <div class="absolute bottom-0 right-0 w-8 h-2 opacity-20 hazard-stripe" />
                    </button>

                    <button
                        @click="printer.disableMotors()"
                        class="flex items-center gap-4 p-4 bg-surface-container-high border border-outline-variant/30 hover:border-error transition-all group"
                    >
                        <span class="material-symbols-outlined text-error opacity-60 group-hover:opacity-100 transition-opacity">lock_open</span>
                        <span class="text-[10px] font-label-caps text-on-surface-variant group-hover:text-error transition-colors uppercase font-bold">{{ $t('control.btn_unlockmotor') }}</span>
                    </button>

                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-label-caps text-on-surface-variant uppercase">E</span>
                        <InputNumber
                            v-model="extruderValue"
                            :min="0.1"
                            :max="50"
                            :step="0.5"
                            showButtons
                            buttonLayout="horizontal"
                            inputClass="font-code-sm text-center w-16"
                            suffix=" mm"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button
                            @click="sendMovementCommand('extrude')"
                            class="py-4 bg-primary-fixed-dim text-on-primary-fixed rounded border border-primary-fixed-dim shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:shadow-[0_0_25px_rgba(0,245,255,0.4)] transition-all font-label-caps text-[10px] font-bold flex flex-col items-center gap-1"
                        >
                            <span class="material-symbols-outlined">double_arrow</span>
                            {{ $t('control.btn_extrude') }}
                        </button>
                        <button
                            @click="sendMovementCommand('retract')"
                            class="py-4 border border-primary-fixed-dim/40 text-primary-fixed-dim hover:bg-primary-fixed-dim/10 transition-all font-label-caps text-[10px] font-bold flex flex-col items-center gap-1"
                        >
                            <span class="material-symbols-outlined rotate-180">double_arrow</span>
                            {{ $t('control.btn_retract') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
