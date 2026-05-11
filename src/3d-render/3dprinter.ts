import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export interface PrinterDimensions {
    X: number
    Y: number
    Z: number
}

export interface PrinterPosition {
    X: number
    Y: number
    Z: number
}

const DEFAULT_DIMENSIONS: PrinterDimensions = { X: 220, Y: 220, Z: 250 }

const COLOR_GRID = new THREE.Color('#00dce5')
const COLOR_FRAME = new THREE.Color('#3a494a')
const COLOR_AXIS_X = new THREE.Color('#ffb4ab')
const COLOR_AXIS_Y = new THREE.Color('#fd8b00')
const COLOR_AXIS_Z = new THREE.Color('#63f7ff')
const COLOR_EXTRUDER = new THREE.Color('#ff3a3a')
const COLOR_HOME = new THREE.Color('#ffb4ab')
const COLOR_PROJECTION = new THREE.Color('#00dce5')
const BACKGROUND = new THREE.Color('#081010')

/**
 * Procedural two-scale grid on a plane. Uses screen-space derivatives for
 * analytic anti-aliasing, then radially fades from the bed centre so the
 * grid blends into the surrounding dark space instead of cutting off hard
 * at the build-volume frame.
 */
function createGridMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
            uColor: { value: COLOR_GRID },
            uMinor: { value: 10.0 },
            uMajor: { value: 100.0 },
        },
        vertexShader: /* glsl */ `
            varying vec3 vWorld;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorld = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uMinor;
            uniform float uMajor;
            varying vec3 vWorld;

            float gridLine(vec2 coord, float spacing) {
                vec2 g = abs(fract(coord / spacing - 0.5) - 0.5) / fwidth(coord / spacing);
                float line = min(g.x, g.y);
                return 1.0 - min(line, 1.0);
            }

            void main() {
                vec2 c = vWorld.xz;
                float minorMask = gridLine(c, uMinor) * 0.30;
                float majorMask = gridLine(c, uMajor) * 0.85;
                float mask = max(minorMask, majorMask);

                if (mask < 0.001) discard;
                gl_FragColor = vec4(uColor, mask);
            }
        `,
    })
}

export default class Three3DPrinter {
    public scene: THREE.Scene
    public camera: THREE.PerspectiveCamera
    public renderer: THREE.WebGLRenderer
    private controls: OrbitControls
    private composer: EffectComposer
    private bloomPass: UnrealBloomPass

    private dimensions: PrinterDimensions
    private gridMesh: THREE.Mesh
    private bedOutline: THREE.LineSegments
    private frameMesh: THREE.LineSegments
    private axisLines: Line2[] = []
    private axisMats: LineMaterial[] = []
    private projectionLines: Line2[] = []
    private projectionMats: LineMaterial[] = []
    private extruderGroup: THREE.Group
    private extruderCore: THREE.Mesh
    private extruderHalo: THREE.Mesh
    private homeMesh: THREE.Mesh

    private rafId: number | null = null
    private startTime: number = performance.now()
    private isVisible = true
    private onVisibilityChange: () => void
    private projectionBuffers: Float32Array[] = []

    private static readonly EXTRUDER_RADIUS = 4
    private static readonly HALO_RADIUS = 9
    private static readonly HOME_RADIUS = 3

    constructor(canvas: HTMLCanvasElement, dimensions: PrinterDimensions = DEFAULT_DIMENSIONS) {
        this.dimensions = sanitizeDimensions(dimensions)
        const width = canvas.clientWidth || canvas.width || 800
        const height = canvas.clientHeight || canvas.height || 600

        this.scene = new THREE.Scene()
        this.scene.background = BACKGROUND

        this.camera = new THREE.PerspectiveCamera(35, width / height, 1, 5000)

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(width, height, false)
        this.renderer.setClearColor(BACKGROUND, 1)
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1.1

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.08
        this.controls.screenSpacePanning = false
        this.controls.enablePan = false
        this.controls.minDistance = Math.max(this.dimensions.X, this.dimensions.Y, this.dimensions.Z) * 0.8
        this.controls.maxDistance = Math.max(this.dimensions.X, this.dimensions.Y, this.dimensions.Z) * 6
        this.controls.minPolarAngle = 0.05
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02
        this.frameInitialView()
        this.controls.update()

        // MSAA × 4 render target so bloom hits anti-aliased edges, not jaggies.
        const renderTarget = new THREE.WebGLRenderTarget(width, height, { samples: 4 })
        this.composer = new EffectComposer(this.renderer, renderTarget)
        this.composer.setPixelRatio(this.renderer.getPixelRatio())
        this.composer.setSize(width, height)
        this.composer.addPass(new RenderPass(this.scene, this.camera))
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.6, 0.5, 0.0)
        this.composer.addPass(this.bloomPass)
        this.composer.addPass(new OutputPass())

        this.gridMesh = this.buildGrid()
        this.scene.add(this.gridMesh)

        this.bedOutline = this.buildBedOutline()
        this.scene.add(this.bedOutline)

        this.frameMesh = this.buildFrame()
        this.scene.add(this.frameMesh)

        this.buildAxes()

        this.extruderGroup = new THREE.Group()
        this.extruderCore = this.buildExtruderCore()
        this.extruderHalo = this.buildExtruderHalo()
        this.extruderGroup.add(this.extruderCore)
        this.extruderGroup.add(this.extruderHalo)
        this.scene.add(this.extruderGroup)

        this.homeMesh = this.buildHome()
        this.scene.add(this.homeMesh)

        this.buildProjectionLines()

        this.onVisibilityChange = () => {
            this.isVisible = document.visibilityState === 'visible'
        }
        document.addEventListener('visibilitychange', this.onVisibilityChange)

        this.updatePosition({ X: 0, Y: 0, Z: 0 })
        this.start()
    }

    /** Update the live extruder marker. Coordinates are raw printer mm. */
    updatePosition(pos: PrinterPosition): void {
        const { X, Y, Z } = this.dimensions
        const x = THREE.MathUtils.clamp(pos.X, 0, X)
        const z = THREE.MathUtils.clamp(pos.Y, 0, Y)
        const y = THREE.MathUtils.clamp(pos.Z, 0, Z)
        this.extruderGroup.position.set(x, y, z)

        // Three projection drops onto the bed and the two back walls. Reuses
        // pre-allocated Float32Array buffers so the update loop is alloc-free.
        this.setProjection(0, x, y, z, x, 0, z)
        this.setProjection(1, x, y, z, X, y, z)
        this.setProjection(2, x, y, z, x, y, Y)
    }

    /** Resize all three render surfaces (renderer, composer, bloom resolution). */
    resize(width: number, height: number): void {
        if (!width || !height) return
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height, false)
        this.composer.setSize(width, height)
        this.bloomPass.setSize(width / 2, height / 2)
        const res = new THREE.Vector2(width, height).multiplyScalar(this.renderer.getPixelRatio())
        for (const m of [...this.axisMats, ...this.projectionMats]) {
            m.resolution.copy(res)
        }
    }

    /** Rebuild the build volume if the active profile's dimensions change. */
    setDimensions(dimensions: PrinterDimensions): void {
        const next = sanitizeDimensions(dimensions)
        if (next.X === this.dimensions.X && next.Y === this.dimensions.Y && next.Z === this.dimensions.Z) return
        this.dimensions = next

        this.gridMesh.geometry.dispose()
        this.gridMesh.geometry = new THREE.PlaneGeometry(next.X, next.Y).rotateX(-Math.PI / 2)
        this.gridMesh.position.set(next.X / 2, 0, next.Y / 2)

        this.scene.remove(this.frameMesh)
        this.frameMesh.geometry.dispose()
        ;(this.frameMesh.material as THREE.Material).dispose()
        this.frameMesh = this.buildFrame()
        this.scene.add(this.frameMesh)

        this.scene.remove(this.bedOutline)
        this.bedOutline.geometry.dispose()
        ;(this.bedOutline.material as THREE.Material).dispose()
        this.bedOutline = this.buildBedOutline()
        this.scene.add(this.bedOutline)

        this.disposeAxes()
        this.buildAxes()

        this.controls.minDistance = Math.max(next.X, next.Y, next.Z) * 0.8
        this.controls.maxDistance = Math.max(next.X, next.Y, next.Z) * 6
        this.frameInitialView()
        this.controls.update()
    }

    /** Dispose every GPU resource and stop the animation loop. */
    dispose(): void {
        this.stop()
        document.removeEventListener('visibilitychange', this.onVisibilityChange)

        this.scene.traverse((obj) => {
            const anyObj = obj as unknown as { geometry?: { dispose?: () => void }, material?: THREE.Material | THREE.Material[] }
            anyObj.geometry?.dispose?.()
            const m = anyObj.material
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose())
            else m?.dispose?.()
        })
        this.composer.dispose()
        this.renderer.dispose()
    }

    // ---- internals ------------------------------------------------------

    private start(): void {
        const tick = () => {
            this.rafId = requestAnimationFrame(tick)
            if (!this.isVisible) return
            this.controls.update()
            const t = (performance.now() - this.startTime) / 1000
            // Pulse home + extruder emissive intensity on a sin wave (cheap —
            // mutating a uniform value on an existing material, no recompile).
            ;(this.homeMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 2.4) * 0.8
            ;(this.extruderCore.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5 + Math.sin(t * 3.0) * 0.5
            this.composer.render()
        }
        tick()
    }

    private stop(): void {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId)
        this.rafId = null
    }

    private frameInitialView(): void {
        const { X, Y, Z } = this.dimensions
        const span = Math.max(X, Y, Z)
        // 135° azimuth so the bed origin (0,0,0) lands on the left of the
        // view (camera sits in the +X / −Z quadrant relative to the volume
        // centre, looking back toward −X / +Z). 30° elevation for a 3/4
        // perspective, sat back ~2.8× span so the volume fits comfortably.
        const dist = span * 2.8
        const cosE = Math.cos(Math.PI / 6)
        const sinE = Math.sin(Math.PI / 6)
        const cosA = Math.cos(Math.PI * 3 / 2)
        const sinA = Math.sin(Math.PI * 3 / 2)

        const vx = X / 2, vy = Z / 2, vz = Y / 2
        const cx = dist * cosE * sinA
        const cy = dist * sinE
        const cz = dist * cosE * cosA

        // Pan the orbit target along −view_right (i.e. screen-left in world
        // coords) so the volume renders in the right portion of the canvas,
        // leaving room for the left-side X/Y/Z overlay.
        const viewDir = new THREE.Vector3(-cx, -cy, -cz).normalize()
        const viewRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewDir).normalize()
        const pan = viewRight.multiplyScalar(-(span * 0.25 - 60))

        const tx = vx + pan.x
        const ty = vy + pan.y
        const tz = vz + pan.z

        this.camera.position.set(tx + cx, ty + cy, tz + cz)
        this.camera.up.set(0, 1, 0)
        this.camera.lookAt(tx, ty, tz)
        if (this.controls) this.controls.target.set(tx, ty, tz)
    }

    private buildGrid(): THREE.Mesh {
        const { X, Y } = this.dimensions
        // Plane is exactly bed-sized so the grid stops at the build-plate edge.
        const geom = new THREE.PlaneGeometry(X, Y).rotateX(-Math.PI / 2)
        const mesh = new THREE.Mesh(geom, createGridMaterial())
        mesh.position.set(X / 2, 0, Y / 2)
        return mesh
    }

    private buildFrame(): THREE.LineSegments {
        const positions = boxEdgePositions(this.dimensions)
        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const mat = new THREE.LineBasicMaterial({
            color: COLOR_FRAME,
            transparent: true,
            opacity: 0.7,
        })
        return new THREE.LineSegments(geom, mat)
    }

    /** Bright bed-perimeter outline so it reads as "this is the build plate"
     *  rather than blending into the dim gantry frame. */
    private buildBedOutline(): THREE.LineSegments {
        const { X, Y } = this.dimensions
        const positions = new Float32Array([
            0, 0, 0,   X, 0, 0,
            X, 0, 0,   X, 0, Y,
            X, 0, Y,   0, 0, Y,
            0, 0, Y,   0, 0, 0,
        ])
        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const mat = new THREE.LineBasicMaterial({
            color: COLOR_GRID,
            transparent: true,
            opacity: 0.95,
            toneMapped: false,
        })
        return new THREE.LineSegments(geom, mat)
    }

    private buildAxes(): void {
        const len = Math.min(this.dimensions.X, this.dimensions.Y, this.dimensions.Z) * 0.4
        const axes: Array<{ end: [number, number, number]; color: THREE.Color }> = [
            { end: [len, 0, 0], color: COLOR_AXIS_X },
            { end: [0, 0, len], color: COLOR_AXIS_Y },
            { end: [0, len, 0], color: COLOR_AXIS_Z },
        ]
        for (const a of axes) {
            const geom = new LineGeometry()
            geom.setPositions([0, 0, 0, ...a.end])
            const mat = new LineMaterial({
                color: a.color.getHex(),
                linewidth: 3,
                transparent: true,
                opacity: 0.9,
            })
            mat.resolution.set(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight)
            const line = new Line2(geom, mat)
            line.computeLineDistances()
            this.scene.add(line)
            this.axisLines.push(line)
            this.axisMats.push(mat)
        }
    }

    private disposeAxes(): void {
        for (const l of this.axisLines) {
            this.scene.remove(l)
            l.geometry.dispose()
        }
        for (const m of this.axisMats) m.dispose()
        this.axisLines = []
        this.axisMats = []
    }

    private buildExtruderCore(): THREE.Mesh {
        const geom = new THREE.SphereGeometry(Three3DPrinter.EXTRUDER_RADIUS, 24, 24)
        const mat = new THREE.MeshStandardMaterial({
            color: COLOR_EXTRUDER,
            emissive: COLOR_EXTRUDER,
            emissiveIntensity: 2.5,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.7,
            toneMapped: false,
        })
        return new THREE.Mesh(geom, mat)
    }

    private buildExtruderHalo(): THREE.Mesh {
        const geom = new THREE.SphereGeometry(Three3DPrinter.HALO_RADIUS, 24, 24)
        const mat = new THREE.MeshBasicMaterial({
            color: COLOR_EXTRUDER,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
        })
        return new THREE.Mesh(geom, mat)
    }

    private buildHome(): THREE.Mesh {
        const geom = new THREE.SphereGeometry(Three3DPrinter.HOME_RADIUS, 16, 16)
        const mat = new THREE.MeshStandardMaterial({
            color: COLOR_HOME,
            emissive: COLOR_HOME,
            emissiveIntensity: 1.5,
            roughness: 0.4,
            toneMapped: false,
        })
        const mesh = new THREE.Mesh(geom, mat)
        mesh.position.set(0, 0, 0)
        return mesh
    }

    private buildProjectionLines(): void {
        for (let i = 0; i < 3; i++) {
            const buf = new Float32Array(6)
            this.projectionBuffers.push(buf)
            const geom = new LineGeometry()
            geom.setPositions(Array.from(buf))
            const mat = new LineMaterial({
                color: COLOR_PROJECTION.getHex(),
                linewidth: 1.5,
                transparent: true,
                opacity: 0.55,
                dashed: true,
                dashSize: 4,
                gapSize: 4,
            })
            mat.defines = { ...(mat.defines || {}), USE_DASH: '' }
            mat.needsUpdate = true
            mat.resolution.set(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight)
            const line = new Line2(geom, mat)
            line.computeLineDistances()
            this.scene.add(line)
            this.projectionLines.push(line)
            this.projectionMats.push(mat)
        }
    }

    private setProjection(idx: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number): void {
        const buf = this.projectionBuffers[idx]
        buf[0] = ax; buf[1] = ay; buf[2] = az
        buf[3] = bx; buf[4] = by; buf[5] = bz
        const geom = this.projectionLines[idx].geometry as LineGeometry
        geom.setPositions(Array.from(buf))
        this.projectionLines[idx].computeLineDistances()
    }
}

function sanitizeDimensions(d: PrinterDimensions): PrinterDimensions {
    return {
        X: d.X > 0 ? d.X : DEFAULT_DIMENSIONS.X,
        Y: d.Y > 0 ? d.Y : DEFAULT_DIMENSIONS.Y,
        Z: d.Z > 0 ? d.Z : DEFAULT_DIMENSIONS.Z,
    }
}

/**
 * Returns a flat Float32Array of 12 line segments (24 vertices) describing
 * a box's wireframe edges, with corner (0,0,0) at the origin and corner
 * (X, Z, Y) at the opposite end. Used for the build-volume frame as
 * gl.LINES (vertex-pair) topology.
 */
function boxEdgePositions(d: PrinterDimensions): Float32Array {
    const x = d.X, y = d.Z, z = d.Y
    const edges: number[] = [
        // bottom rectangle
        0, 0, 0,  x, 0, 0,
        x, 0, 0,  x, 0, z,
        x, 0, z,  0, 0, z,
        0, 0, z,  0, 0, 0,
        // top rectangle
        0, y, 0,  x, y, 0,
        x, y, 0,  x, y, z,
        x, y, z,  0, y, z,
        0, y, z,  0, y, 0,
        // vertical struts
        0, 0, 0,  0, y, 0,
        x, 0, 0,  x, y, 0,
        x, 0, z,  x, y, z,
        0, 0, z,  0, y, z,
    ]
    return new Float32Array(edges)
}
