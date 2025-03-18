import * as THREE from 'three'

export default class Three3DPrinter {
    public scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer
    private redSphere!: THREE.Mesh;

    /**
     * Creates a new 3D printer visualization
     * @param {HTMLCanvasElement} canvasID - The canvas element to render on
     * @param {Object} options - Configuration options for the 3D renderer
     * @param {number} options.fov - Field of view for the camera
     * @param {Object} options.aspect - Aspect ratio dimensions
     * @param {number} options.near - Near clipping plane
     * @param {number} options.far - Far clipping plane
     * @param {number} options.cameraPosition - Initial Z position of the camera
     */
    constructor(canvasID: HTMLCanvasElement, options?: { fov: number, aspect: { width: number, height: number }, near: number, far: number, cameraPosition: number }) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            options?.fov || 30, (options?.aspect.width || 800) / (options?.aspect.height || 600),
            options?.near || 0.1, options?.far || 1000);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvasID, antialias: true });
        this.renderer.setSize((options?.aspect.width || 800), (options?.aspect.height || 600));

        this.camera.position.z = options?.cameraPosition || 5;
    }

    /**
     * Initializes the printer dimensions visualization
     * @param {number} width - Width of the printer
     * @param {number} height - Height of the printer
     * @param {number} depth - Depth of the printer
     * @param {string} color - Hexadecimal color value of the printer frame
     * @returns {THREE.LineSegments} - The line segments representing the printer dimensions
     */
    initDimensions(width:number, height:number, depth:number, color?: string): THREE.LineSegments {
        const cubeGeometry = new THREE.BoxGeometry(width, height, depth);
        const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
        const cubeMaterial = new THREE.LineBasicMaterial({ color: color || 0xffffff });
        const cubeLine = new THREE.LineSegments(cubeEdges, cubeMaterial);

        return cubeLine
    }

    /**
     * Initializes the extruder visualization
     * @param {string} color - Hexadecimal color value of the extruder
     * @returns {THREE.Mesh} - The mesh representing the extruder
     */
    initExtruder(color?: string): THREE.Mesh {
        const redSphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const redSphereMaterial = new THREE.MeshBasicMaterial({ color: color || 0xff0000 });

        this.redSphere = new THREE.Mesh(redSphereGeometry, redSphereMaterial);

        return this.redSphere
    }

    /**
     * Updates the extruder position in the visualization
     * @param {Object} position - The new position
     * @param {number} position.x - X coordinate
     * @param {number} position.y - Y coordinate
     * @param {number} position.z - Z coordinate
     * @returns {void}
     */
    updateExtruderPosition(position: { x: number, y: number, z: number }): void {
        const halfSize = 1;
        this.redSphere.position.set(
            THREE.MathUtils.clamp(position.y, -halfSize + 0.1, halfSize - 0.1),
            THREE.MathUtils.clamp(position.z, -halfSize + 0.1, halfSize - 0.1),
            THREE.MathUtils.clamp(position.x, -halfSize + 0.1, halfSize - 0.1),
        );
    }

    /**
     * Initializes the home position indicator
     * @param {string} color - Hexadecimal color value of the home position indicator
     * @returns {THREE.Mesh} - The mesh representing the home position
     */
    initHomePosition(color?: string): THREE.Mesh {
        const homeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const homeSphereMaterial = new THREE.MeshBasicMaterial({ color: color || 0x800080 });
        const homePosition = new THREE.Mesh(homeGeometry, homeSphereMaterial);
        homePosition.position.set(-1, -1, -1);

        return homePosition
    }

    /**
     * Moves the camera around the scene
     * @param {THREE.Vector2} position - The rotation position for the camera
     * @returns {void}
     */
    moveCamera(position: THREE.Vector2): void {
        const radius = 5; // Distance from the origin
        this.camera.position.x = radius * Math.sin(position.y * Math.PI);
        this.camera.position.z = radius * Math.cos(position.y * Math.PI);
        this.camera.position.y = radius * position.x;
        this.camera.lookAt(0, 0, 0); // Look at the center of the scene
    }

    /**
     * Renders the scene
     * @returns {void}
     */
    render(): void {
        this.renderer.render(this.scene, this.camera);
    }

}
