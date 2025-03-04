import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Command } from './gcode';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number | null = null;
  
  private extrusionLine: THREE.LineSegments | null = null;
  private travelLine: THREE.LineSegments | null = null;

  constructor(canvas: HTMLCanvasElement, width?: number, height?: number) {
    console.log('Initializing SceneManager with canvas:', 
      width || canvas.width, 
      height || canvas.height
    );
    // Initialize scene
    this.scene = new THREE.Scene();
    
    // Use provided dimensions or get from canvas
    const canvasWidth = width || canvas.width || 800;
    const canvasHeight = height || canvas.height || 600;
    
    // Initialize camera with explicit aspect ratio
    const aspect = canvasWidth / canvasHeight;
    this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 1000);
    this.camera.position.set(0, -150, 200); // Adjust camera position to see the model
    
    // Initialize renderer with explicit dimensions
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(canvasWidth, canvasHeight, false);
    this.renderer.setClearColor(0x111111);
    
    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Add smooth damping
    this.controls.update();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Add directional light for better visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 0, 200);
    this.scene.add(directionalLight);
    
    // Add axis helper
    const axesHelper = new THREE.AxesHelper(100);
    this.scene.add(axesHelper);
    
    // Start the animation loop
    this.animate();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    if (this.controls) {
      this.controls.update();
    }
    
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Render error:', error);
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  // Update to accept explicit dimensions
  public updateSize(width?: number, height?: number): void {
    const canvas = this.renderer.domElement;
    const newWidth = width || canvas.clientWidth;
    const newHeight = height || canvas.clientHeight;
    
    // Only update if dimensions have changed
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      console.log('Updating canvas size to:', newWidth, newHeight);
      this.renderer.setSize(newWidth, newHeight, false);
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  public visualizeGcode(commands: Command[], zLevel: number): void {
    console.log(`Visualizing ${commands.length} commands at Z-level: ${zLevel}`);
    // Remove previous lines
    this.clearVisualization();
    
    // Create materials
    const extrudeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const travelMaterial = new THREE.LineBasicMaterial({ color: 0x00aaff });
    
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
    
    console.log(`Found ${extrudeVertices.length/6} extrusion segments and ${travelVertices.length/6} travel segments`);
    
    // Create and add lines to scene
    if (extrudeVertices.length > 0) {
      extrudeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(extrudeVertices, 3));
      this.extrusionLine = new THREE.LineSegments(extrudeGeometry, extrudeMaterial);
      this.scene.add(this.extrusionLine);
    }
    
    if (travelVertices.length > 0) {
      travelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(travelVertices, 3));
      this.travelLine = new THREE.LineSegments(travelGeometry, travelMaterial);
      this.scene.add(this.travelLine);
    }

    // Auto-center camera on model
    if (extrudeVertices.length > 0 || travelVertices.length > 0) {
      this.centerCameraOnModel(extrudeVertices, travelVertices);
    }
  }

  // Add a method to center the camera on the model
  private centerCameraOnModel(extrudeVertices: number[], travelVertices: number[]): void {
    // Combine all vertices
    const allVertices = [...extrudeVertices, ...travelVertices];
    if (allVertices.length === 0) return;
    
    // Calculate bounding box
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    
    if (!boundingBox) return;
    
    // Get center and size of bounding box
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Position camera to see the entire model
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5; // Add some margin
    
    // Update camera and controls
    const offset = new THREE.Vector3(0, -cameraZ * 0.6, cameraZ);
    this.camera.position.copy(center).add(offset);
    this.controls.target.copy(center);
    this.controls.update();
    
    // Clean up temporary geometry
    geometry.dispose();
  }

  private clearVisualization(): void {
    // Remove and dispose extrusion line
    if (this.extrusionLine) {
      this.scene.remove(this.extrusionLine);
      this.extrusionLine.geometry.dispose();
      if (this.extrusionLine.material instanceof THREE.Material) {
        this.extrusionLine.material.dispose();
      }
      this.extrusionLine = null;
    }
    
    // Remove and dispose travel line
    if (this.travelLine) {
      this.scene.remove(this.travelLine);
      this.travelLine.geometry.dispose();
      if (this.travelLine.material instanceof THREE.Material) {
        this.travelLine.material.dispose();
      }
      this.travelLine = null;
    }
  }

  public dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear visualization
    this.clearVisualization();
    
    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }
    
    // Clear scene
    while(this.scene.children.length > 0){ 
      const object = this.scene.children[0];
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
      this.scene.remove(object);
    }
    
    // Dispose renderer
    this.renderer.forceContextLoss();
    this.renderer.dispose();
  }
}
