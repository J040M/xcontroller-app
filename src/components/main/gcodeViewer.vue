<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { parseGCode, SceneManager } from '../../3d-render/gcode';

export default defineComponent({
  name: 'GcodeViewerComponent',
  setup() {
    const gcodeCanvas = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLDivElement | null>(null);
    const fileInputRef = ref<HTMLInputElement | null>(null);

    const fileName = ref<string | null>(null);
    const fileSize = ref<number | null>(null);
    const zLevel = ref(0);
    const maxZ = ref(0);
    const loading = ref(false);

    let sceneManager: SceneManager | null = null;
    let commands: ReturnType<typeof parseGCode>['commands'] = [];
    let resizeObserver: ResizeObserver | null = null;

    onMounted(async () => {
      await nextTick();
      if (!gcodeCanvas.value || !containerRef.value) return;

      const containerRect = containerRef.value.getBoundingClientRect();
      const width = Math.max(containerRect.width, 400);
      const height = Math.max(containerRect.height, 300);

      gcodeCanvas.value.width = width;
      gcodeCanvas.value.height = height;
      sceneManager = new SceneManager(gcodeCanvas.value, width, height);

      resizeObserver = new ResizeObserver(() => {
        if (!containerRef.value || !gcodeCanvas.value || !sceneManager) return;
        const rect = containerRef.value.getBoundingClientRect();
        const newWidth = Math.max(rect.width, 400);
        const newHeight = Math.max(rect.height, 300);
        gcodeCanvas.value.width = newWidth;
        gcodeCanvas.value.height = newHeight;
        sceneManager.updateSize(newWidth, newHeight);
      });
      resizeObserver.observe(containerRef.value);
    });

    watch(zLevel, () => updateVisualization());

    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
      sceneManager?.dispose();
      sceneManager = null;
    });

    function triggerUpload(): void {
      fileInputRef.value?.click();
    }

    function handleFileUpload(event: Event): void {
      loading.value = true;
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];

      if (!file || !sceneManager) {
        loading.value = false;
        return;
      }

      fileName.value = file.name;
      fileSize.value = file.size;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const gcode = e.target?.result as string;
          if (!gcode) return;
          const result = parseGCode(gcode);
          commands = result.commands;
          const finalZ = isNaN(result.zValue) ? 0 : result.zValue;
          maxZ.value = finalZ;
          zLevel.value = finalZ;
          updateVisualization();
        } catch (error) {
          console.error('Error processing G-code:', error);
        } finally {
          loading.value = false;
        }
      };
      reader.onerror = () => {
        console.error('FileReader error');
        loading.value = false;
      };
      reader.readAsText(file);
    }

    function updateVisualization(): void {
      if (!sceneManager || commands.length === 0) return;
      try {
        const validZLevel = isNaN(zLevel.value) ? 0 : zLevel.value;
        sceneManager.visualizeGcode(commands, validZLevel);
      } catch (error) {
        console.error('Error visualizing G-code:', error);
      }
    }

    function resetView(): void { sceneManager?.resetView(); }
    function topView(): void { sceneManager?.topView(); }
    function sideView(): void { sceneManager?.sideView(); }
    function zoomToFit(): void { sceneManager?.zoomToFit(); }

    const progressPct = computed(() => {
      if (!maxZ.value) return 0;
      return Math.round((zLevel.value / maxZ.value) * 100);
    });

    const sliderPct = computed({
      get: () => maxZ.value ? Math.round((zLevel.value / maxZ.value) * 100) : 0,
      set: (v: number) => { zLevel.value = (v / 100) * maxZ.value; },
    });

    return {
      gcodeCanvas, containerRef, fileInputRef,
      fileName, fileSize, zLevel, maxZ, loading,
      progressPct, sliderPct,
      triggerUpload, handleFileUpload, updateVisualization,
      resetView, topView, sideView, zoomToFit,
    };
  }
});
</script>

<template>
    <div class="flex flex-col h-full bg-surface">
        <!-- Top Control Bar -->
        <header class="h-16 flex items-center px-6 bg-surface-container-highest border-b border-outline-variant shrink-0 gap-6">
            <button
                @click="triggerUpload"
                class="flex items-center gap-2 px-5 py-2 bg-secondary-container text-on-secondary-container font-bold text-[10px] uppercase tracking-wider hover:brightness-110 transition-all border border-secondary shadow-[0_0_10px_rgba(253,139,0,0.2)] relative overflow-hidden"
            >
                <span class="material-symbols-outlined">upload_file</span>
                <span>Upload Gcode</span>
                <div class="absolute bottom-0 left-0 w-full h-[3px] hazard-stripe opacity-40" />
            </button>
            <input
                ref="fileInputRef"
                type="file"
                accept=".gcode"
                @change="handleFileUpload"
                class="hidden"
            >

            <div class="h-8 w-px bg-outline-variant" />

            <div class="flex items-center gap-10 flex-1 min-w-0">
                <div class="flex flex-col min-w-0">
                    <span class="text-[9px] text-outline uppercase font-bold tracking-widest leading-none mb-1.5">Current Active Link</span>
                    <span class="font-code-sm text-primary-fixed-dim truncate">{{ fileName || '—' }}</span>
                </div>
                <div class="hidden md:flex items-center gap-10">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-outline uppercase font-bold tracking-widest leading-none mb-1.5">Max Z</span>
                        <div class="flex items-baseline gap-1">
                            <span class="font-code-sm text-tertiary-container">{{ maxZ.toFixed(1) }}</span>
                            <span class="text-[9px] text-outline">mm</span>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[8px] text-outline uppercase font-bold tracking-widest leading-none mb-1.5">File Size</span>
                        <span class="font-code-sm text-tertiary-container">{{ fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : '—' }}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-6">
                <div class="flex flex-col items-end">
                    <span class="text-[9px] text-outline uppercase font-bold tracking-widest leading-none mb-1.5">Z-Height Control</span>
                    <span class="font-code-sm text-primary-fixed-dim">{{ zLevel.toFixed(1) }} mm</span>
                </div>
                <div class="relative w-56 h-8 flex items-center bg-surface-container-lowest border border-outline-variant px-2">
                    <div class="absolute inset-x-2 h-2 top-3 power-bar-bg z-0" />
                    <input
                        v-model.number="sliderPct"
                        type="range"
                        min="0"
                        max="100"
                        :disabled="!maxZ"
                        class="segmented-slider cursor-pointer relative z-10 disabled:opacity-40"
                    >
                </div>
            </div>
        </header>

        <!-- 3D Canvas -->
        <main class="flex-1 relative overflow-hidden p-4">
            <div ref="containerRef" class="w-full h-full relative gcode-canvas-frame bg-surface-container-lowest overflow-hidden">
                <canvas ref="gcodeCanvas" class="w-full h-full block" />

                <!-- File / progress HUD -->
                <div v-if="fileName" class="absolute top-8 right-8 flex flex-col gap-4 pointer-events-none">
                    <div class="bg-surface-container-high/80 backdrop-blur-md border border-outline-variant p-4 w-60 relative">
                        <div class="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-secondary-container/60" />
                        <div class="space-y-4">
                            <div class="border-l-2 border-secondary-container pl-3">
                                <span class="block text-[8px] text-outline font-bold uppercase tracking-[0.2em] mb-1">File Identity</span>
                                <span class="block font-code-sm text-on-surface truncate">{{ fileName }}</span>
                            </div>
                            <div class="border-l-2 border-primary-fixed-dim pl-3">
                                <span class="block text-[8px] text-outline font-bold uppercase tracking-[0.2em] mb-1">Z Coverage</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="font-code-lg text-xl text-primary-fixed-dim leading-none">{{ progressPct }}%</span>
                                    <span class="text-[9px] text-outline uppercase font-bold">Layered</span>
                                </div>
                            </div>
                            <div class="pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                                <span class="text-[8px] text-outline uppercase tracking-widest">System Valid</span>
                                <div class="w-2 h-2 rounded-full bg-primary-fixed-dim shadow-[0_0_8px_#00dce5]" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Viewport controls -->
                <div class="absolute bottom-8 right-8">
                    <div class="bg-surface-container-high/90 backdrop-blur-md border border-outline-variant p-2 w-48">
                        <span class="text-[8px] font-bold text-outline uppercase tracking-widest px-2 mb-2 block">Viewport</span>
                        <div class="flex flex-col">
                            <button
                                @click="resetView"
                                class="flex items-center gap-3 px-3 py-2 hover:bg-primary-fixed-dim/10 text-on-surface hover:text-primary-fixed-dim transition-all text-[11px]"
                            >
                                <span class="material-symbols-outlined">restart_alt</span>
                                <span class="font-bold uppercase tracking-wider">Reset View</span>
                            </button>
                            <button
                                @click="topView"
                                class="flex items-center gap-3 px-3 py-2 hover:bg-primary-fixed-dim/10 text-on-surface hover:text-primary-fixed-dim transition-all text-[11px]"
                            >
                                <span class="material-symbols-outlined">view_in_ar</span>
                                <span class="font-bold uppercase tracking-wider">Top View</span>
                            </button>
                            <button
                                @click="sideView"
                                class="flex items-center gap-3 px-3 py-2 hover:bg-primary-fixed-dim/10 text-on-surface hover:text-primary-fixed-dim transition-all text-[11px]"
                            >
                                <span class="material-symbols-outlined">side_navigation</span>
                                <span class="font-bold uppercase tracking-wider">Side View</span>
                            </button>
                            <button
                                @click="zoomToFit"
                                class="flex items-center gap-3 px-3 py-2 hover:bg-primary-fixed-dim/10 text-on-surface hover:text-primary-fixed-dim transition-all text-[11px]"
                            >
                                <span class="material-symbols-outlined">zoom_in_map</span>
                                <span class="font-bold uppercase tracking-wider">Zoom to Fit</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- HUD corner markers -->
                <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary-fixed-dim/20" />
                    <div class="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary-fixed-dim/20" />
                    <div class="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary-fixed-dim/20" />
                    <div class="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary-fixed-dim/20" />
                </div>

                <!-- Loading pill -->
                <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-sm pointer-events-none">
                    <div class="px-4 py-2 bg-surface-container-high border border-primary-fixed-dim/40 text-primary-fixed-dim font-label-caps uppercase tracking-widest text-xs flex items-center gap-2">
                        <span class="material-symbols-outlined animate-spin">progress_activity</span>
                        Processing
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
