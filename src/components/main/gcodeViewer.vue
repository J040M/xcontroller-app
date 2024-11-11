<template>
    <div class="gcode-container">
        <!-- <input type="file" @change="handleFileUpload" accept=".gcode" />
        <input type="range" v-model="zLevel" :min="0" :max="maxZ" @input="updateVisualization" /> -->
        <canvas id="gcode-animation" width="800" height="600"></canvas>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as THREE from 'three'

export default defineComponent({
    name: 'GcodeViewerComponent',
    // data: () => ({}),
    mounted() {
        this.initCanvas()
    },
    methods: {
        initCanvas() {
            const canvasID = document.getElementById('gcode-animation') as HTMLCanvasElement;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(30, 800 / 600, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas: canvasID, antialias: true });
            renderer.setSize(800, 600);

            // Set background color to improve contrast
            renderer.setClearColor(0x111111, 1); // Dark gray

            // Add orbit controls
            const controls = new OrbitControls(camera, renderer.domElement);
            camera.position.set(0, -180, 0);  // Further away to view more lines
            controls.update()

            // Store parsed G-code commands
            // let originalCommands = []
            // let currentLine, currentTravelLine

            // Add ambient light for subtle scene lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
            scene.add(ambientLight);

            // Add an axis helper to better visualize orientation
            const axesHelper = new THREE.AxesHelper(100); // Length of the axis lines
            scene.add(axesHelper);

            const animate = () => {
                requestAnimationFrame(animate);
                
                renderer.render(scene, camera);
            };
            animate();
        },
    }
});
</script>

<style scoped>
.gcode-container {
    position: relative;
    width: 100%;
    height: 100vh;
    background-color: #111;
}

canvas {
    display: block;
    /* Remove default inline block spacing */
}
</style>
