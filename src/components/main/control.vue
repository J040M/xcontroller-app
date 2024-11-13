<script lang="ts">
import { defineComponent } from 'vue'
import * as THREE from 'three'
import { Message } from '../../types/messages';
import { wsClient } from '../../init/client';

type Axi = 'X' | 'Y' | 'Z' | 'X-' | 'Y-' | 'Z-'

export default defineComponent({
    name: 'controlComponent',
    data: () => ({
        gcodeCommand: '',
        movementValue: 10 as number,
        extruderValue: 1 as number,
        input: {
            x: 0,
            y: 0,
            z: 0,
        },
        redSphere: undefined as THREE.Mesh | undefined,
    }),
    mounted() {
        // Scene, camera, and renderer setup
        const canvasID = document.getElementById('3dprinter-animation') as HTMLCanvasElement;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 800 / 600, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasID, antialias: true });
        renderer.setSize(800, 600);

        // Cube representing the 3D printer volume
        const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
        const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
        const cubeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const cubeLine = new THREE.LineSegments(cubeEdges, cubeMaterial);
        scene.add(cubeLine);

        // Red movable sphere
        const redSphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const redSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const redSphere = new THREE.Mesh(redSphereGeometry, redSphereMaterial);
        scene.add(redSphere);
        this.redSphere = redSphere; // Store reference to redSphere

        // Purple stationary sphere at (-1, -1, 1)
        const purpleSphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const purpleSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x800080 });
        const purpleSphere = new THREE.Mesh(purpleSphereGeometry, purpleSphereMaterial);
        purpleSphere.position.set(-1, -1, 1);
        scene.add(purpleSphere);

        // Force dimensions
        canvasID.style.width = '800px';
        canvasID.style.height = '600px';
        canvasID.width = 800;  // Set internal width
        canvasID.height = 600; // Set internal height

        // Camera position
        camera.position.z = 5;

        // Handle mouse clicks to move the camera
        const onMouseClick = (event: MouseEvent) => {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

            const radius = 5; // Distance from the origin
            camera.position.x = radius * Math.sin(mouse.y * Math.PI);
            camera.position.z = radius * Math.cos(mouse.y * Math.PI);
            camera.position.y = radius * mouse.x;
            camera.lookAt(0, 0, 0); // Look at the center of the scene
        };

        renderer.domElement.addEventListener('click', onMouseClick);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            this.updateRedSpherePosition();
            renderer.render(scene, camera);
        };
        animate();
    },
    methods: {
        // TODO: The values from the commands must be scaled for the sphere
        updateRedSpherePosition(): void {
            if (this.redSphere) {
                // Update red sphere's position using the slider values
                // Limit the red sphere's position to stay within the cube
                const halfSize = 1; // Half of the cube size
                this.redSphere.position.set(
                    THREE.MathUtils.clamp(-this.input.y, -halfSize + 0.1, halfSize - 0.1),
                    THREE.MathUtils.clamp(this.input.z, -halfSize + 0.1, halfSize - 0.1),
                    THREE.MathUtils.clamp(this.input.x, -halfSize + 0.1, halfSize - 0.1),
                );
            }
        },
        sendCommand(command: Axi | string): void {
            const message: Message = {
                message_type: 'Movement',
                message: ''
            }

            switch (command) {
                case 'extrude':
                    message.message = `E${this.extruderValue}`
                    break;
                case 'retract':
                    message.message = `E-${this.extruderValue}`
                    break;
                case 'lockmotor':
                    message.message = `M17`
                    break;
                case 'unlockmotor':
                    message.message = `M18`
                    break;
                case 'X':
                case 'Y':
                case 'Z':
                case 'X-':
                case 'Y-':
                case 'Z-':
                    console.log(`Movement ${command}${this.movementValue}`)
                    message.message = command + this.movementValue
                    break;
                default:
                    console.error('No command found. Returning...')
                    return
            }

            if (message.message !== '') return
            wsClient.sendCommand(message)
        }
    },
});

</script>

<template>

    <div class="printer-head-animation">
        <canvas id="3dprinter-animation" width="800" height="600"></canvas>
    </div>

    <div id="remote-controller">
        <div class="button-row">
            <!-- Directional buttons -->
            <Panel :header="$t('control.header_cartesian')">
                <div class="button-container remote-container">
                    <InputNumber type="number" v-model="movementValue" />
                    <div class="button-row">
                        <div class="directional-buttons">
                            <Button icon="pi pi-arrow-up" raised rounded @click="sendCommand('X')" />
                            <div class="row">
                                <Button icon="pi pi-arrow-left" raised rounded @click="sendCommand('X-')" />
                                <Button icon="pi pi-arrow-right" raised rounded @click="sendCommand('Y')" />
                            </div>
                            <Button icon="pi pi-arrow-down" raised rounded @click="sendCommand('Y-')" />
                        </div>
                        <div class="button-container">
                            <Button icon="pi pi-arrow-up" raised rounded @click="sendCommand('Z')" />
                            <Button icon="pi pi-arrow-down" raised rounded @click="sendCommand('Z-')" />
                        </div>
                    </div>
                </div>
            </Panel>
            <!--  -->
            <Panel :header="$t('control.header_fan')" class="vertical-container">
                <div class="button-container fan-container vertical-btn-container">
                    <!-- Make this on/off switch -->
                    <Button :label="$t('control.btn_fan_on')" raised rounded @click="sendCommand('Z')" />
                    <Button :label="$t('control.btn_fan_off')" raised rounded @click="sendCommand('Z-')" />
                </div>
            </Panel>

            <Panel :header="$t('control.header_motor')">
                <div class="button-container motor-container">
                    <Button label="Unlock motors" raised rounded @click="sendCommand('lockmotor')" />
                    <Button label="Home motor" raised rounded @click="sendCommand('unlockmotor')" />
                </div>
            </Panel>

            <Panel :header="$t('control.header_extruder')">
                <div class="button-container extruder-container">
                    <InputNumber type="number" v-model="extruderValue" />
                    <Button label="Extrude" raised rounded @click="sendCommand('extrude')">{{ $t('control.btn_extrude')
                        }}</Button>
                    <Button label="Retract" raised rounded @click="sendCommand('retract')">{{ $t('control.btn_retract')
                        }}</Button>
                </div>
            </Panel>
        </div>
    </div>

</template>

<style scoped>
canvas {
    display: block;
    /* Removes extra space */
    margin: 0;
    /* Reset margins */
    padding: 0;
    /* Reset padding */
    border: none;
    /* Remove borders */
}

.vertical-container {
    display: table-cell;
    text-align: center;
}

.vertical-btn-container {
    /* position: absolute; */
    top: 50%;
    left: 50%;
}

.remote-container {}

.extruder-container {
    button {
        margin: 0 0 10px 0;
    }
}

.fan-container {
    button {
        margin: 0 0 10px 0;
    }
}

.motor-container {
    button {
        margin: 0 0 10px 0;
    }
}

/* Container styling */
#remote-controller {
    display: flex;
    flex-direction: column;
    /* Keep vertical stacking for overall structure */
    align-items: center;
    padding: 20px;
    border-radius: 10px;
    margin: 20px auto;

    /* width: 800px;
    height: 600px; */
}

/* Container to align .button-container elements side by side */
.button-row {
    display: flex;
    justify-content: space-between;
    /* Add spacing between containers */
    gap: 10px;
    /* Adjust the gap as needed */
    width: 100%;
    /* Ensure the buttons row spans full width of the remote */
}

/* Layout for individual button containers */
.button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Directional buttons container */
.directional-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px;
}

/* Row for left and right buttons */
.row {
    display: flex;
    justify-content: center;
}
</style>
