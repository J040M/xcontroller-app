<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { parseGCode, SceneManager } from '../../3d-render/gcode'

export default defineComponent({
  name: 'GcodeViewerMobile',
  setup() {
    const gcodeCanvas = ref<HTMLCanvasElement | null>(null)
    const containerRef = ref<HTMLDivElement | null>(null)
    const fileInputRef = ref<HTMLInputElement | null>(null)

    const fileName = ref<string | null>(null)
    const fileSize = ref<number | null>(null)
    const zLevel = ref(0)
    const maxZ = ref(0)
    const loading = ref(false)

    let sceneManager: SceneManager | null = null
    let commands: ReturnType<typeof parseGCode>['commands'] = []
    let resizeObserver: ResizeObserver | null = null

    onMounted(async () => {
      await nextTick()
      if (!gcodeCanvas.value || !containerRef.value) return

      const rect = containerRef.value.getBoundingClientRect()
      const width = Math.max(rect.width, 320)
      const height = Math.max(rect.height, 240)

      gcodeCanvas.value.width = width
      gcodeCanvas.value.height = height
      sceneManager = new SceneManager(gcodeCanvas.value, width, height)

      resizeObserver = new ResizeObserver(() => {
        if (!containerRef.value || !sceneManager) return
        const r = containerRef.value.getBoundingClientRect()
        const w = Math.max(r.width, 320)
        const h = Math.max(r.height, 240)
        // Let updateSize() own the resize: it sets the drawing buffer AND the
        // camera aspect, but only when the size actually changed. Pre-assigning
        // canvas.width here would defeat that guard and leave the camera aspect
        // stale, stretching the model on every mobile chrome/orientation resize.
        sceneManager.updateSize(w, h)
      })
      resizeObserver.observe(containerRef.value)
    })

    watch(zLevel, () => updateVisualization())

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      sceneManager?.dispose()
      sceneManager = null
    })

    function triggerUpload(): void {
      fileInputRef.value?.click()
    }

    function handleFileUpload(event: Event): void {
      loading.value = true
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      // Clear the input so re-selecting the same file still fires `change`.
      input.value = ''

      if (!file || !sceneManager) {
        loading.value = false
        return
      }

      fileName.value = file.name
      fileSize.value = file.size

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const gcode = e.target?.result as string
          if (!gcode) return
          const result = parseGCode(gcode)
          commands = result.commands
          const finalZ = isNaN(result.zValue) ? 0 : result.zValue
          maxZ.value = finalZ
          zLevel.value = finalZ
          updateVisualization()
        } catch (error) {
          console.error('Error processing G-code:', error)
        } finally {
          loading.value = false
        }
      }
      reader.onerror = () => {
        console.error('FileReader error')
        loading.value = false
      }
      reader.readAsText(file)
    }

    function updateVisualization(): void {
      if (!sceneManager || commands.length === 0) return
      try {
        const validZLevel = isNaN(zLevel.value) ? 0 : zLevel.value
        sceneManager.visualizeGcode(commands, validZLevel)
      } catch (error) {
        console.error('Error visualizing G-code:', error)
      }
    }

    function resetView(): void { sceneManager?.resetView() }
    function topView(): void { sceneManager?.topView() }
    function sideView(): void { sceneManager?.sideView() }
    function zoomToFit(): void { sceneManager?.zoomToFit() }

    const sliderPct = computed({
      get: () => (maxZ.value ? Math.round((zLevel.value / maxZ.value) * 100) : 0),
      set: (v: number) => { zLevel.value = (v / 100) * maxZ.value },
    })

    return {
      gcodeCanvas, containerRef, fileInputRef,
      fileName, fileSize, zLevel, maxZ, loading, sliderPct,
      triggerUpload, handleFileUpload,
      resetView, topView, sideView, zoomToFit,
    }
  },
})
</script>

<template>
  <div class="h-full flex flex-col bg-surface">
    <!-- Top bar -->
    <header class="shrink-0 flex items-center gap-3 px-4 py-2 bg-surface-container-highest border-b border-outline-variant">
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 bg-secondary-container text-on-secondary-container font-bold text-[10px] uppercase tracking-wider rounded shrink-0"
        @click="triggerUpload"
      >
        <span class="material-symbols-outlined text-base">upload_file</span>
        <span>Upload</span>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".gcode,.gco,.g"
        class="hidden"
        @change="handleFileUpload"
      >
      <div class="flex flex-col min-w-0 flex-1">
        <span class="text-[8px] text-outline uppercase font-bold tracking-widest leading-none mb-1">File</span>
        <span class="font-code-sm text-primary-fixed-dim truncate text-xs">{{ fileName || '—' }}</span>
      </div>
      <div class="flex flex-col items-end shrink-0">
        <span class="text-[8px] text-outline uppercase font-bold tracking-widest leading-none mb-1">Max Z</span>
        <span class="font-code-sm text-tertiary-container text-xs">{{ maxZ.toFixed(1) }} mm</span>
      </div>
    </header>

    <!-- Canvas -->
    <main class="flex-1 min-h-0 relative p-2">
      <div ref="containerRef" class="w-full h-full relative gcode-canvas-frame bg-surface-container-lowest overflow-hidden">
        <canvas ref="gcodeCanvas" class="w-full h-full block" />

        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary-fixed-dim/20" />
          <div class="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary-fixed-dim/20" />
          <div class="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary-fixed-dim/20" />
          <div class="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary-fixed-dim/20" />
        </div>

        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-sm pointer-events-none">
          <div class="px-4 py-2 bg-surface-container-high border border-primary-fixed-dim/40 text-primary-fixed-dim font-label-caps uppercase tracking-widest text-xs flex items-center gap-2">
            <span class="material-symbols-outlined animate-spin">progress_activity</span>
            Processing
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom control sheet -->
    <footer class="shrink-0 flex flex-col gap-3 px-4 py-3 bg-surface-container-lowest border-t border-outline-variant pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div class="flex items-center gap-3">
        <span class="text-[9px] text-outline uppercase font-bold tracking-widest shrink-0">Z</span>
        <input
          v-model.number="sliderPct"
          type="range"
          min="0"
          max="100"
          :disabled="!maxZ"
          class="segmented-slider cursor-pointer flex-1 disabled:opacity-40"
        >
        <span class="font-code-sm text-primary-fixed-dim text-xs shrink-0 w-16 text-right">{{ zLevel.toFixed(1) }} mm</span>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <button type="button" class="view-btn" @click="resetView">
          <span class="material-symbols-outlined text-lg">restart_alt</span>
          <span>Reset</span>
        </button>
        <button type="button" class="view-btn" @click="topView">
          <span class="material-symbols-outlined text-lg">view_in_ar</span>
          <span>Top</span>
        </button>
        <button type="button" class="view-btn" @click="sideView">
          <span class="material-symbols-outlined text-lg">side_navigation</span>
          <span>Side</span>
        </button>
        <button type="button" class="view-btn" @click="zoomToFit">
          <span class="material-symbols-outlined text-lg">zoom_in_map</span>
          <span>Fit</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.view-btn {
  @apply flex flex-col items-center justify-center gap-0.5 py-2 rounded border border-outline-variant/40 bg-surface-container-high text-on-surface-variant text-[9px] font-label-caps uppercase tracking-wider transition-colors;
}
.view-btn:active {
  @apply text-primary-fixed-dim border-primary-fixed-dim/50;
}
</style>
