<template>
  <div class="gcode-viewer">
    <div class="controls">
      <input type="file" @change="handleFileUpload" accept=".gcode" />
      <input 
        v-if="maxZ > 0" 
        type="range" 
        v-model.number="zLevel" 
        :min="0" 
        :max="maxZ" 
        step="0.1"
        @input="updateVisualization"
      />
      <span v-if="maxZ > 0">Z-Height: {{ zLevel.toFixed(1) }}</span>
    </div>
    <div class="gcode-container" ref="containerRef">
      <canvas ref="gcodeCanvas"></canvas>
      <div v-if="loading" class="loading-overlay">Loading G-code...</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { parseGCode } from '../../utils/gcode';
import { SceneManager } from '../../utils/SceneManager';

export default defineComponent({
  name: 'GcodeViewerComponent',
  setup() {
    // Refs
    const gcodeCanvas = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLDivElement | null>(null);
    const zLevel = ref(0);
    const maxZ = ref(0);
    const loading = ref(false);
    
    // State
    let sceneManager: SceneManager | null = null;
    let commands: any[] = [];
    let resizeObserver: ResizeObserver | null = null;
    
    // Initialize Three.js scene with fixed dimensions first, then adjust
    onMounted(async () => {
      // Wait for next DOM update so container is rendered
      await nextTick();
      
      if (!gcodeCanvas.value || !containerRef.value) {
        console.error("Canvas or container element not found");
        return;
      }
      
      try {
        // Set explicit canvas dimensions first
        const containerRect = containerRef.value.getBoundingClientRect();
        const width = Math.max(containerRect.width, 400); // Minimum width
        const height = Math.max(containerRect.height, 300); // Minimum height
        
        console.log("Container dimensions:", width, height);
        
        // Set canvas size explicitly
        gcodeCanvas.value.width = width;
        gcodeCanvas.value.height = height;
        
        // Initialize SceneManager with properly sized canvas
        sceneManager = new SceneManager(gcodeCanvas.value, width, height);
        
        // Set up resize observer to handle container resize
        resizeObserver = new ResizeObserver(() => {
          if (!containerRef.value || !gcodeCanvas.value || !sceneManager) return;
          
          const rect = containerRef.value.getBoundingClientRect();
          const newWidth = Math.max(rect.width, 400);
          const newHeight = Math.max(rect.height, 300);
          
          // Update canvas size
          gcodeCanvas.value.width = newWidth;
          gcodeCanvas.value.height = newHeight;
          
          // Update renderer size
          sceneManager.updateSize(newWidth, newHeight);
        });
        
        resizeObserver.observe(containerRef.value);
        
      } catch (error) {
        console.error("Error initializing SceneManager:", error);
      }
    });
    
    // Watch for changes to zLevel
    watch(zLevel, () => {
      updateVisualization();
    });
    
    // Clean up Three.js resources
    onBeforeUnmount(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      if (sceneManager) {
        try {
          sceneManager.dispose();
        } catch (error) {
          console.error("Error disposing SceneManager:", error);
        }
        sceneManager = null;
      }
    });
    
    // Handle file upload
    const handleFileUpload = (event: Event) => {
      loading.value = true;
      console.log('Loading G-code file...');
      
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      
      if (!file) {
        loading.value = false;
        return;
      }
      
      if (!sceneManager) {
        console.error("SceneManager not initialized");
        loading.value = false;
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const gcode = e.target?.result as string;
          if (!gcode) {
            console.error("Failed to read G-code file");
            loading.value = false;
            return;
          }
          
          console.log(`Parsing ${gcode.length} bytes of G-code data`);
          const result = parseGCode(gcode);
          commands = result.commands;
          
          // Ensure we have valid Z values
          const finalZ = isNaN(result.zValue) ? 0 : result.zValue;
          
          console.log(`Parsed ${commands.length} G-code commands, max Z: ${finalZ}`);
          maxZ.value = finalZ;
          zLevel.value = finalZ;
          
          updateVisualization();
        } catch (error) {
          console.error("Error processing G-code:", error);
        } finally {
          loading.value = false;
        }
      };
      
      reader.onerror = () => {
        console.error("FileReader error");
        loading.value = false;
      };
      
      reader.readAsText(file);
    };
    
    // Update visualization based on z-level
    const updateVisualization = () => {
      if (!sceneManager || commands.length === 0) {
        return;
      }
      
      try {
        // Ensure zLevel is always a valid number
        const validZLevel = isNaN(zLevel.value) ? 0 : zLevel.value;
        sceneManager.visualizeGcode(commands, validZLevel);
      } catch (error) {
        console.error("Error visualizing G-code:", error);
      }
    };
    
    return {
      gcodeCanvas,
      containerRef,
      zLevel,
      maxZ,
      loading,
      handleFileUpload,
      updateVisualization
    };
  }
});
</script>

<style scoped>
.gcode-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.controls {
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.gcode-container {
  flex-grow: 1;
  background-color: #111;
  position: relative;
  min-height: 400px;
  min-width: 400px;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
</style>
