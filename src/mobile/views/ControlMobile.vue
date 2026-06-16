<script lang="ts">
import { computed, defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { printer } from '../../init/client'
import Three3DPrinter from '../../3d-render/3dprinter'
import type { Axis } from '../../types/printer'

/**
 * Cheap WebGL2 feature probe on a throwaway canvas. Mobile GPUs / older
 * webviews can lack WebGL2 or float render targets, and the 3D viewer builds
 * an EffectComposer + bloom pass that throws on those — so we degrade to the
 * numeric coordinate readout instead of crashing the whole Control view.
 */
function webgl2Supported(): boolean {
  if (typeof WebGL2RenderingContext === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    if (!gl) return false
    // Release the probe context immediately. Mobile webviews cap the number
    // of live WebGL contexts; leaking this one counts against that budget
    // until GC runs and can starve the real viewer on weaker devices.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export default defineComponent({
  name: 'ControlMobile',
  setup() {
    /** Jog step in mm — chip-selected for glove/touch use. */
    const movementValue = ref(10)
    const stepOptions = [0.1, 1, 10, 50, 100]
    /** Extruder push/pull distance in mm. */
    const extruderValue = ref(5)
    const extruderOptions = [1, 5, 10, 25]
    /** Fan speed as 0-100% (UI). Sent to printer as 0-255. */
    const fanPercent = ref(0)
    /** Extrusion feed multiplier 0-100% (UI). */
    const feedPercent = ref(50)

    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const canvasContainerRef = ref<HTMLDivElement | null>(null)
    const vizFailed = ref(false)

    let viz: Three3DPrinter | null = null
    let resizeObserver: ResizeObserver | null = null
    let stopPositionWatch: (() => void) | null = null
    let stopDimensionsWatch: (() => void) | null = null
    let lastFanCommandTimer: ReturnType<typeof setTimeout> | null = null

    onMounted(() => {
      const canvas = canvasRef.value
      const container = canvasContainerRef.value
      if (!canvas || !container) return

      if (!webgl2Supported()) {
        vizFailed.value = true
        return
      }

      try {
        viz = new Three3DPrinter(canvas, printer.printerInfo.dimensions)
        viz.updatePosition(printer.axisPositions)
      } catch (e) {
        console.error('3D viewer init failed; falling back to readout only', e)
        vizFailed.value = true
        viz = null
        return
      }

      stopPositionWatch = watch(
        () => [printer.axisPositions.X, printer.axisPositions.Y, printer.axisPositions.Z] as const,
        ([X, Y, Z]) => viz?.updatePosition({ X, Y, Z }),
      )

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
      movementValue, stepOptions, extruderValue, extruderOptions,
      fanPercent, feedPercent, fanSegments, feedSegments,
      canvasRef, canvasContainerRef, vizFailed,
      sendMovementCommand, setFanFromSegment, setFeedFromSegment,
    }
  },
})
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Coordinate readout -->
    <div class="grid grid-cols-3 gap-2">
      <div class="bg-surface-container-lowest border-l-2 border-primary-fixed-dim rounded-r px-3 py-2">
        <div class="text-[9px] font-label-caps text-on-surface-variant">X</div>
        <div class="font-code-lg text-lg text-primary-fixed-dim tracking-tighter">{{ printer.axisPositions.X.toFixed(1) }}</div>
      </div>
      <div class="bg-surface-container-lowest border-l-2 border-secondary-container rounded-r px-3 py-2">
        <div class="text-[9px] font-label-caps text-on-surface-variant">Y</div>
        <div class="font-code-lg text-lg text-secondary-container tracking-tighter">{{ printer.axisPositions.Y.toFixed(1) }}</div>
      </div>
      <div class="bg-surface-container-lowest border-l-2 border-tertiary-container rounded-r px-3 py-2">
        <div class="text-[9px] font-label-caps text-on-surface-variant">Z</div>
        <div class="font-code-lg text-lg text-tertiary-container tracking-tighter">{{ printer.axisPositions.Z.toFixed(1) }}</div>
      </div>
    </div>

    <!-- 3D viewer (guarded; degrades to readout-only on weak GPUs) -->
    <div
      ref="canvasContainerRef"
      class="w-full aspect-[4/3] bg-surface-container-lowest border border-outline-variant/40 rounded overflow-hidden relative"
    >
      <canvas v-if="!vizFailed" ref="canvasRef" class="w-full h-full block" />
      <div
        v-if="vizFailed"
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-surface-variant"
      >
        <span class="material-symbols-outlined text-2xl">3d_rotation</span>
        <span class="text-[10px] font-label-caps uppercase tracking-widest text-center px-6">3D preview unavailable on this device</span>
      </div>
      <div class="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse" />
        <span class="text-[9px] font-code-sm uppercase tracking-[0.2em] text-primary-fixed-dim/80">
          {{ printer.printerInfo.dimensions.X }}×{{ printer.printerInfo.dimensions.Y }}×{{ printer.printerInfo.dimensions.Z }}
        </span>
      </div>
    </div>

    <!-- Jog -->
    <div class="border border-outline-variant/60 rounded-xl p-4 bg-surface-container-lowest flex flex-col gap-4">
      <!-- Homing hint: moves are rejected until the printer is homed -->
      <div
        v-if="!printer.printerInfo.homed"
        class="flex items-center gap-2 px-3 py-2 rounded bg-secondary-container/10 border border-secondary-container/30 text-secondary-container"
      >
        <span class="material-symbols-outlined text-base shrink-0">info</span>
        <span class="text-[10px] font-label-caps uppercase tracking-wider">Home the printer before jogging</span>
      </div>

      <!-- Step chips -->
      <div class="flex flex-col gap-2">
        <span class="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">Step (mm)</span>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="s in stepOptions"
            :key="`step-${s}`"
            type="button"
            class="h-9 rounded text-xs font-code-sm border transition-colors"
            :class="movementValue === s
              ? 'bg-primary-fixed-dim/15 border-primary-fixed-dim text-primary-fixed-dim'
              : 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant'"
            @click="movementValue = s"
          >{{ s }}</button>
        </div>
      </div>

      <!-- XY pad + Z rail -->
      <div class="flex items-center justify-center gap-3">
        <div class="grid grid-cols-3 grid-rows-3 gap-1.5">
          <div />
          <button type="button" class="jog-btn" @click="sendMovementCommand('Y+')">
            <span class="material-symbols-outlined text-primary-fixed-dim">keyboard_arrow_up</span>
            <span class="jog-label">Y+</span>
          </button>
          <div />

          <button type="button" class="jog-btn" @click="sendMovementCommand('X-')">
            <span class="material-symbols-outlined text-primary-fixed-dim">keyboard_arrow_left</span>
            <span class="jog-label">X-</span>
          </button>
          <button
            type="button"
            class="w-16 h-16 rounded-full bg-surface-variant/40 border-2 border-primary-fixed-dim flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,220,229,0.2)]"
            @click="printer.autoHome()"
          >
            <span class="material-symbols-outlined text-primary-fixed-dim">home_pin</span>
            <span class="text-[8px] font-label-caps text-primary-fixed-dim font-bold">HOME</span>
          </button>
          <button type="button" class="jog-btn" @click="sendMovementCommand('X+')">
            <span class="material-symbols-outlined text-primary-fixed-dim">keyboard_arrow_right</span>
            <span class="jog-label">X+</span>
          </button>

          <div />
          <button type="button" class="jog-btn" @click="sendMovementCommand('Y-')">
            <span class="material-symbols-outlined text-primary-fixed-dim">keyboard_arrow_down</span>
            <span class="jog-label">Y-</span>
          </button>
          <div />
        </div>

        <div class="flex flex-col gap-1.5">
          <button type="button" class="jog-btn jog-btn-z" @click="sendMovementCommand('Z+')">
            <span class="material-symbols-outlined text-tertiary-container">expand_less</span>
            <span class="jog-label text-tertiary-container">Z+</span>
          </button>
          <button type="button" class="jog-btn jog-btn-z" @click="sendMovementCommand('Z-')">
            <span class="material-symbols-outlined text-tertiary-container">expand_more</span>
            <span class="jog-label text-tertiary-container">Z-</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Extruder -->
    <div class="border border-outline-variant/60 rounded-xl p-4 bg-surface-container-lowest flex flex-col gap-3">
      <span class="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">Extruder (mm)</span>
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="e in extruderOptions"
          :key="`ext-${e}`"
          type="button"
          class="h-9 rounded text-xs font-code-sm border transition-colors"
          :class="extruderValue === e
            ? 'bg-primary-fixed-dim/15 border-primary-fixed-dim text-primary-fixed-dim'
            : 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant'"
          @click="extruderValue = e"
        >{{ e }}</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="py-3 bg-primary-fixed-dim text-on-primary-fixed rounded font-label-caps text-[11px] font-bold flex items-center justify-center gap-1"
          @click="sendMovementCommand('extrude')"
        >
          <span class="material-symbols-outlined text-base">double_arrow</span>
          {{ $t('control.btn_extrude') }}
        </button>
        <button
          type="button"
          class="py-3 border border-primary-fixed-dim/40 text-primary-fixed-dim rounded font-label-caps text-[11px] font-bold flex items-center justify-center gap-1"
          @click="sendMovementCommand('retract')"
        >
          <span class="material-symbols-outlined text-base rotate-180">double_arrow</span>
          {{ $t('control.btn_retract') }}
        </button>
      </div>
    </div>

    <!-- Fan / Feed -->
    <div class="border border-outline-variant/60 rounded-xl p-4 bg-surface-container-lowest flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-baseline">
          <span class="text-[10px] font-label-caps text-on-surface-variant tracking-widest">COOLING FAN</span>
          <span class="font-code-lg text-primary-fixed-dim">{{ fanPercent }}%</span>
        </div>
        <div class="flex gap-1 h-10">
          <button
            v-for="i in 10"
            :key="`fan-${i}`"
            type="button"
            class="flex-1 rounded-sm transition-all"
            :class="i <= fanSegments
              ? 'bg-primary-fixed-dim/40 border border-primary-fixed-dim/30'
              : 'bg-surface-variant/20 border border-outline-variant/10'"
            @click="setFanFromSegment(i - 1)"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-baseline">
          <span class="text-[10px] font-label-caps text-on-surface-variant tracking-widest">EXTRUSION FEED</span>
          <span class="font-code-lg text-secondary-container">{{ (feedPercent / 100).toFixed(1) }}X</span>
        </div>
        <div class="flex gap-1 h-10">
          <button
            v-for="i in 10"
            :key="`feed-${i}`"
            type="button"
            class="flex-1 rounded-sm transition-all"
            :class="i <= feedSegments
              ? 'bg-secondary-container/60 border border-secondary-container/40'
              : 'bg-surface-variant/20 border border-outline-variant/10'"
            @click="setFeedFromSegment(i - 1)"
          />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="flex items-center gap-3 p-4 bg-secondary-container/10 border border-secondary-container/40 rounded-lg"
        @click="printer.bedLeveling()"
      >
        <span class="w-9 h-9 bg-secondary-container flex items-center justify-center rounded shrink-0">
          <span class="material-symbols-outlined text-on-secondary-container">grid_view</span>
        </span>
        <span class="text-xs font-bold text-on-surface tracking-wider uppercase">{{ $t('control.btn_bedleveling') }}</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-3 p-4 bg-surface-container-high border border-outline-variant/30 rounded-lg"
        @click="printer.disableMotors()"
      >
        <span class="material-symbols-outlined text-error shrink-0">lock_open</span>
        <span class="text-xs font-label-caps text-on-surface-variant uppercase font-bold tracking-wider">{{ $t('control.btn_unlockmotor') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.jog-btn {
  @apply w-16 h-16 bg-surface-container-high border border-outline-variant/50 rounded-lg flex flex-col items-center justify-center transition-colors;
}
.jog-btn:active {
  @apply bg-primary-fixed-dim/20 border-primary-fixed-dim;
}
.jog-btn-z {
  @apply border-tertiary-container/40;
}
.jog-label {
  @apply text-[9px] font-code-sm text-on-surface-variant;
}
</style>
