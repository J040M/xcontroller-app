import * as THREE from 'three'

/**
 * Represents a single G-code movement command
 */
export interface Command {
    start: THREE.Vector3    // Starting position of the movement
    end: THREE.Vector3,     // Ending position of the movement
    travel: boolean         // Whether this is a travel move (G0) or extrusion move (G1)
}

/**
 * Tracks the current visualization state
 */
export interface CurrentValues {
    currentLine: THREE.LineSegments,      // Current extrusion line being displayed
    currentTravelLine: THREE.LineSegments // Current travel line being displayed
}

/**
 * Result of parsing G-code containing commands and final Z height
 */
interface ParseResult {
    commands: Command[],    // Array of parsed movement commands
    zValue: number         // Final Z height encountered
}

/**
 * Parses raw G-code string into an array of 3D movement commands
 * @param {string} gcode Raw G-code string to parse
 * @returns ParseResult containing movement commands and final Z height
 */
export function parseGCode(gcode: string ): ParseResult {
    const lines = gcode.split('\n');
    const commands = [] as Command[];
    let lastPosition = new THREE.Vector3(0, 0, 0);
    let zValue = 0; // Track the last Z level

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('G0') || trimmed.startsWith('G1')) {
            const args = trimmed.split(' ');
            let x = lastPosition.x, y = lastPosition.y, z = lastPosition.z;

            args.forEach(arg => {
                if (arg.startsWith('X')) x = parseFloat(arg.substring(1));
                if (arg.startsWith('Y')) y = parseFloat(arg.substring(1));
                if (arg.startsWith('Z')) z = parseFloat(arg.substring(1));
            });

            const newPosition = new THREE.Vector3(x, y, z);
            const isTravel = trimmed.startsWith('G0'); // Check if it's a travel movement
            commands.push({ start: lastPosition.clone(), end: newPosition, travel: isTravel });
            lastPosition = newPosition;
            zValue = z; // Update the last Z value
        }
    });

    return { commands, zValue };
}

/**
 * Creates or updates the visual representation of G-code commands in a Three.js scene
 * @param {Command[]} commands Array of movement commands to visualize
 * @param {number} zLevel Current Z-height level to filter movements
 * @param {THREE.Scene} scene Three.js scene to render into
 * @param {CurrentValues} currentLine Object containing references to current visualization lines
 * @returns {void}
 */
export function visualizeGCode(
    commands: Command[], 
    zLevel: number, 
    scene: THREE.Scene, 
    currentLine: { extrude: THREE.LineSegments | null; travel: THREE.LineSegments | null }
): void {
    // Properly dispose of previous lines
    if (currentLine.extrude) {
        currentLine.extrude.geometry.dispose();
        (currentLine.extrude.material as THREE.Material).dispose();
        scene.remove(currentLine.extrude);
        currentLine.extrude = null;
    }
    if (currentLine.travel) {
        currentLine.travel.geometry.dispose();
        (currentLine.travel.material as THREE.Material).dispose();
        scene.remove(currentLine.travel);
        currentLine.travel = null;
    }

    // Create new materials and geometries
    const extrudeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const travelMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });

    // Create separate geometries for travel and extrusion moves
    const extrudeGeometry = new THREE.BufferGeometry();
    const travelGeometry = new THREE.BufferGeometry();

    // Collect vertices for travel and extrusion moves
    const extrudeVertices: number[] = [];
    const travelVertices: number[] = [];

    // Filter and transform commands into vertex arrays
    commands.forEach(cmd => {
        if (cmd.start.z <= zLevel && cmd.end.z <= zLevel) {
            const vertexArray = cmd.travel ? travelVertices : extrudeVertices;
            vertexArray.push(cmd.start.x, cmd.start.y, cmd.start.z);
            vertexArray.push(cmd.end.x, cmd.end.y, cmd.end.z);
        }
    });

    // Create and add extrusion lines to scene if vertices exist
    if (extrudeVertices.length > 0) {
        extrudeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(extrudeVertices, 3));
        currentLine.extrude = new THREE.LineSegments(extrudeGeometry, extrudeMaterial);
        scene.add(currentLine.extrude);
    }

    // Create and add travel lines to scene if vertices exist
    if (travelVertices.length > 0) {
        travelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(travelVertices, 3));
        currentLine.travel = new THREE.LineSegments(travelGeometry, travelMaterial);
        scene.add(currentLine.travel);
    }
}
