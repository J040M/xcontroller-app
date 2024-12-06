<script lang="ts">
import { defineComponent } from 'vue'
import * as THREE from 'three'
import { printer } from '../../init/client';
import { Axis } from '../../types/printer';

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
        sendCommand(command: Axis | string): void {
            switch (command) {
                case 'extrude':
                    printer.moveAxis('e', this.extruderValue, '+');
                    break;
                case 'retract':
                    printer.moveAxis('e', this.extruderValue, '-');
                    break;
                //TODO: This is probably not necessary
                case 'lockmotor':
                    break;
                case 'unlockmotor':
                    printer.disableMotors();
                    break;
                case 'homemotor':
                    printer.autoHome();
                    break;
                case 'homemotor':
                    printer.bedLeveling();
                    break;
                case 'x+':
                case 'y+':
                case 'z+':
                case 'x-':
                case 'y-':
                case 'z-':
                    //seperatee the axis and the direction
                    const axis = command[0] as Axis;
                    const direction = command[1];

                    printer.moveAxis(axis, this.movementValue, direction);

                    break;
                default:
                    console.error('No command found. Returning...')
                    return
            }
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
                    <!-- TODO: This should be a slider for the fan -->
                </div>
            </Panel>

            <Panel :header="$t('control.header_motor')">
                <div class="button-container motor-container">
                    <Button label="Home motor" raised rounded @click="sendCommand('homemotor')" />
                    <Button label="Bed leveling" raised rounded @click="sendCommand('bedleveling')" />
                </div>
                <div class="button-container motor-container">
                    <Button label="Lock motor" raised rounded @click="sendCommand('lockmotor')" />
                    <Button label="Unlock motor" raised rounded @click="sendCommand('unlockmotor')" />
                </div>
            </Panel>

            <Panel :header="$t('control.header_extruder')">
                <InputNumber type="number" v-model="extruderValue" />
                <div class="button-container extruder-container">
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
    margin: 0;
    padding: 0;
    border: none;
}

.vertical-container {
    display: table-cell;
    text-align: center;
}

.vertical-btn-container {
    top: 50%;
    left: 50%;
}

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
