import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Represents a single G-code movement command
 */
export interface Command {
  start: THREE.Vector3    // Starting position of the movement
  end: THREE.Vector3,     // Ending position of the movement
  travel: boolean         // Whether this is a travel move (G0) or extrusion move (G1)
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
 * @param {string} gcode - The raw G-code string to parse
 * @returns {ParseResult} Object containing parsed commands and maximum Z height
 */
export function parseGCode(gcode: string): ParseResult {
  const lines = gcode.split('\n');
  const commands: Command[] = [];
  let lastPosition = new THREE.Vector3(0, 0, 0);
  let maxZ = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('G0') && !trimmed.startsWith('G1')) continue;

    const isTravel = trimmed.startsWith('G0');
    const args = trimmed.split(' ');
    let x = lastPosition.x, y = lastPosition.y, z = lastPosition.z;

    // Extract coordinates from command arguments
    for (const arg of args) {
      if (!arg.length || !arg[1]) continue;
      const value = parseFloat(arg.substring(1));
      if (isNaN(value)) continue;

      switch (arg[0]) {
        case 'X': x = value; break;
        case 'Y': y = value; break;
        case 'Z':
          z = value;
          maxZ = Math.max(maxZ, z);
          break;
      }
    }

    const newPosition = new THREE.Vector3(x, y, z);
    commands.push({ start: lastPosition.clone(), end: newPosition, travel: isTravel });
    lastPosition = newPosition;
  }

  return { commands, zValue: maxZ };
}

/**
 * Manages the 3D scene for visualizing G-code paths
 */
export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number | null = null;

  private extrusionLine: THREE.LineSegments | null = null;
  private travelLine: THREE.LineSegments | null = null;

  /**
   * Creates a new SceneManager for 3D G-code visualization
   * @param {HTMLCanvasElement} canvas - The canvas element to render on
   * @param {number} width - Optional width for the renderer
   * @param {number} height - Optional height for the renderer
   */
  constructor(canvas: HTMLCanvasElement, width?: number, height?: number) {
    // Initialize scene
    this.scene = new THREE.Scene();

    // Use provided dimensions or get from canvas
    const canvasWidth = width || canvas.width || 800;
    const canvasHeight = height || canvas.height || 600;

    // Initialize camera with explicit aspect ratio
    this.camera = new THREE.PerspectiveCamera(30, canvasWidth / canvasHeight, 0.1, 1000);
    this.camera.position.set(0, -150, 200);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(canvasWidth, canvasHeight, false);
    this.renderer.setClearColor(0x111111);

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.update();

    // Add lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 0, 200);
    this.scene.add(directionalLight);

    // Add axis helper
    this.scene.add(new THREE.AxesHelper(100));

    // Bind the animate method to this instance to preserve context when used as callback
    this.animate = this.animate.bind(this);
    
    // Start animation
    this.animate();
  }

  /**
   * Animation loop for continuous rendering
   * @private
   * @returns {void}
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls?.update();

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Render error:', error);
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  /**
   * Updates renderer size to match canvas dimensions
   * @param {number} width - Optional width to set
   * @param {number} height - Optional height to set
   * @returns {void}
   */
  public updateSize(width?: number, height?: number): void {
    const canvas = this.renderer.domElement;
    const newWidth = width || canvas.clientWidth;
    const newHeight = height || canvas.clientHeight;

    // Only update if dimensions have changed
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      this.renderer.setSize(newWidth, newHeight, false);
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Visualizes G-code commands in the 3D scene
   * @param {Command[]} commands - Array of G-code commands to visualize
   * @param {number} zLevel - Maximum Z level to display
   * @returns {void}
   */
  public visualizeGcode(commands: Command[], zLevel: number): void {
    // Clean up previous visualization
    this.clearVisualization();

    // Collect vertices for travel and extrusion moves
    const extrudeVertices: number[] = [];
    const travelVertices: number[] = [];

    // Filter commands by Z level and collect vertices
    commands.forEach(cmd => {
      if (cmd.start.z <= zLevel && cmd.end.z <= zLevel) {
        const vertices = cmd.travel ? travelVertices : extrudeVertices;
        vertices.push(cmd.start.x, cmd.start.y, cmd.start.z);
        vertices.push(cmd.end.x, cmd.end.y, cmd.end.z);
      }
    });

    // Create and add extrusion lines
    if (extrudeVertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(extrudeVertices, 3));
      this.extrusionLine = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xff0000 })
      );
      this.scene.add(this.extrusionLine);
    }

    // Create and add travel lines
    if (travelVertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(travelVertices, 3));
      this.travelLine = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0x00aaff })
      );
      this.scene.add(this.travelLine);
    }

    // Auto-center camera on model
    if (extrudeVertices.length > 0 || travelVertices.length > 0) {
      this.centerCameraOnModel([...extrudeVertices, ...travelVertices]);
    }
  }

  /**
   * Centers the camera on the model
   * @private
   * @param {number[]} vertices - Flat array of vertex coordinates
   * @returns {void}
   */
  private centerCameraOnModel(vertices: number[]): void {
    if (vertices.length === 0) return;

    // Calculate bounding box
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    if (!boundingBox) return;

    // Get center and size
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    // Position camera to see the entire model
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

    // Update camera position and controls target
    this.camera.position.copy(center).add(new THREE.Vector3(0, -cameraZ * 0.6, cameraZ));
    this.controls.target.copy(center);
    this.controls.update();

    geometry.dispose();
  }

  /**
   * Clears the current visualization and disposes resources
   * @private
   * @returns {void}
   */
  private clearVisualization(): void {
    // Helper function to dispose object
    const disposeObject = (obj: THREE.LineSegments | null) => {
      if (obj) {
        this.scene.remove(obj);
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    };

    // Dispose both line types
    disposeObject(this.extrusionLine);
    disposeObject(this.travelLine);
    this.extrusionLine = this.travelLine = null;
  }

  /**
   * Disposes all resources used by the scene manager
   * @returns {void}
   */
  public dispose(): void {
    // Cancel animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear visualization
    this.clearVisualization();
    this.controls?.dispose();

    // Clear scene and dispose objects
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);

      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    }

    // Dispose renderer
    this.renderer.forceContextLoss();
    this.renderer.dispose();
  }
}
