import * as THREE from 'three'

export interface Command {
    start: THREE.Vector3
    end: THREE.Vector3,
    travel: boolean
}

export interface CurrentValues {
    currentLine: THREE.LineSegments,
    currentTravelLine: THREE.LineSegments,
}

interface ParseResult {
    commands: Command[],
    zValue: number
}

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

export function visualizeGCode(
    commands: Command[], 
    zLevel: number, 
    scene: THREE.Scene, 
    currentLine: { extrude: THREE.LineSegments | null; travel: THREE.LineSegments | null }
): void {
    // Clear previous lines
    if (currentLine.extrude) scene.remove(currentLine.extrude);
    if (currentLine.travel) scene.remove(currentLine.travel);

    // Create new materials and geometries
    const extrudeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const travelMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });

    const extrudeGeometry = new THREE.BufferGeometry();
    const travelGeometry = new THREE.BufferGeometry();

    const extrudeVertices: number[] = [];
    const travelVertices: number[] = [];

    commands.forEach(cmd => {
        if (cmd.start.z <= zLevel && cmd.end.z <= zLevel) {
            const vertexArray = cmd.travel ? travelVertices : extrudeVertices;
            vertexArray.push(cmd.start.x, cmd.start.y, cmd.start.z);
            vertexArray.push(cmd.end.x, cmd.end.y, cmd.end.z);
        }
    });

    // Only add geometry if there are vertices
    if (extrudeVertices.length > 0) {
        extrudeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(extrudeVertices, 3));
        currentLine.extrude = new THREE.LineSegments(extrudeGeometry, extrudeMaterial);
        scene.add(currentLine.extrude);
    }

    if (travelVertices.length > 0) {
        travelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(travelVertices, 3));
        currentLine.travel = new THREE.LineSegments(travelGeometry, travelMaterial);
        scene.add(currentLine.travel);
    }
}
