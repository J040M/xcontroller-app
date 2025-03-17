<script lang="ts">
import { defineComponent } from 'vue'
import { printer } from '../../init/client';
import * as THREE from 'three'
import Three3DPrinter from '../../3d-render/3dprinter.ts';
import type { Axis } from '../../types/printer';


export default defineComponent({
    name: 'controlComponent',
    data: () => ({
        movementValue: 10 as number,
        extruderValue: 1 as number,
        fanValue: 0 as number,
        lastFanCommandTime: null as NodeJS.Timeout | null,
    }),
    mounted() {
        // Scene, camera, and renderer setup
        const canvasID = document.getElementById('3dprinter-animation') as HTMLCanvasElement;
        const threeDP = new Three3DPrinter(canvasID)

        // Cube representing the 3D printer volume
        const cube = threeDP.initDimensions(2,2,2)
        threeDP.scene.add(cube);

        // Red movable sphere representing the extruder
        const extruder = threeDP.initExtruder()
        threeDP.scene.add(extruder)

        // Purple stationary sphere at (-1, -1, -1) representing the home position
        const homePosition = threeDP.initHomePosition()
        threeDP.scene.add(homePosition);

        // Handle mouse clicks to move the camera
        const onMouseClick = (event: MouseEvent) => {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

            threeDP.moveCamera(mouse)
        };

        threeDP.renderer.domElement.addEventListener('click', onMouseClick);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            threeDP.updateExtruderPosition({
                x: printer.axisPositions.X,
                y: printer.axisPositions.Y,
                z: printer.axisPositions.Z,
            })
            threeDP.render()
        };
        animate();
    },
    setup() {
        return { printer };
    },
    methods: {
       sendMovementCommand(command: Axis | string): void {
            switch (command) {
                case 'extrude':
                    printer.moveAxis('e0', '+', this.extruderValue);
                    break;
                case 'retract':
                    printer.moveAxis('e0', '-', this.extruderValue);
                    break;
                case 'X+':
                case 'Y+':
                case 'Z+':
                case 'X-':
                case 'Y-':
                case 'Z-':
                    //seperatee the axis and the direction
                    const axis = command[0].toUpperCase() as Axis;
                    const direction = command[1];

                    printer.moveAxis(axis, direction, this.movementValue);

                    break;
                default:
                    console.error('No command found. Returning...')
                    return
            }
        },
        sendFanCommand(): void {
            if (this.lastFanCommandTime) clearTimeout(this.lastFanCommandTime);

            this.lastFanCommandTime = setTimeout(() => {
                printer.setFanSpeed(this.fanValue);
                this.lastFanCommandTime = null
            }, 1000);
        },
    },
});

</script>

<template>

    <div class="printer-head-animation">
        <canvas id="3dprinter-animation" width="800" height="600"></canvas>
    </div>
    <div class="axis-values">
        <Panel header="Current Position">
            <div class="axis-grid">
                <div class="axis-item">X: {{ printer.axisPositions.X.toFixed(2) }}</div>
                <div class="axis-item">Y: {{ printer.axisPositions.Y.toFixed(2) }}</div>
                <div class="axis-item">Z: {{ printer.axisPositions.Z.toFixed(2) }}</div>
            </div>
        </Panel>
    </div>

    <div id="remote-controller">
        <div class="button-row">
            <!-- Directional buttons -->
            <Panel :header="$t('control.header_cartesian')">
                <div class="button-container remote-container">
                    <InputNumber type="number" v-model="movementValue" />
                    <div class="button-row">
                        <div class="directional-buttons">
                            <Button icon="pi pi-arrow-up" raised rounded @click="sendMovementCommand('Y+')" />
                            <div class="row">
                                <Button icon="pi pi-arrow-left" class="button-left" raised rounded
                                    @click="sendMovementCommand('X-')" />
                                <Button icon="pi pi-arrow-right" class="button-right" raised rounded
                                    @click="sendMovementCommand('X+')" />
                            </div>
                            <Button icon="pi pi-arrow-down" raised rounded @click="sendMovementCommand('Y-')" />
                        </div>
                        <div class="button-container vertical-align-middle">
                            <Button icon="pi pi-arrow-up" class="button-top" raised rounded
                                @click="sendMovementCommand('Z+')" />
                            <Button icon="pi pi-arrow-down" class="button-bottom" raised rounded
                                @click="sendMovementCommand('Z-')" />
                        </div>
                    </div>
                </div>
            </Panel>

            <Panel :header="$t('control.header_fan')" class="vertical-container">
                <div class="button-container fan-container vertical-btn-container">
                    <Knob v-model="fanValue" :min="0" :max="255" :step="5" v-on:change="sendFanCommand" />
                </div>
            </Panel>

            <Panel :header="$t('control.header_motor')">
                <div class="button-container motor-container">
                    <Button :label="$t('control.btn_homemotor')" raised rounded @click="printer.autoHome()" />
                    <Button :label="$t('control.btn_bedleveling')" raised rounded @click="printer.bedLeveling()" />
                </div>
                <div class="button-container motor-container">
                    <Button :label="$t('control.btn_unlockmotor')" raised rounded @click="printer.disableMotors()" />
                </div>
            </Panel>

            <Panel :header="$t('control.header_extruder')">
                <InputNumber type="number" v-model="extruderValue" />
                <div class="button-container extruder-container">
                    <Button :label="$t('control.btn_extrude')" raised rounded @click="sendMovementCommand('extrude')" />
                    <Button :label="$t('control.btn_retract')" raised rounded @click="sendMovementCommand('retract')" />
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

.axis-values {
    margin: 20px 0;
}

.axis-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    text-align: center;
}

.axis-item {
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
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
    margin-top: 10%;

    button {
        margin: 0 0 15px 0;
    }
}

.fan-container {
    margin-top: 30%;

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
    margin: 20px 10px 10px 10px;
}

/* Row for left and right buttons */
.row {
    display: flex;
    justify-content: center;
}

/* Button alignment */
.button-top {
    margin-top: 70%;
}

.button-bottom {
    margin-top: 10px;
}

.button-left {
    margin-right: 10px;
}

.button-right {
    margin-left: 10px;
}
</style>
