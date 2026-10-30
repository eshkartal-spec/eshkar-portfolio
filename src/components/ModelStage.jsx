import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import './ModelStage.css'

// ---- How it looks and moves (times in seconds) ----
const FIT = 0.56 // how much of the stage's width the model fills, front on
const FIT_HIGH = 0.62 // ...and at most how much of its height
const FIT_NARROW = 0.84 // ...and of a phone's width
const TURN = 0.005 // how far it turns per pixel dragged
const TILT = 0.6 // how far it can be tipped up or down (with a mouse)
const SPIN_FRICTION = 3.5 // how quickly a flick's spin dies out: lower spins longer
const IDLE = 3.5 // after being let go this long, it drifts back to face the front...
const RETURN = 1.2 // ...this quickly...
const SWAY = 0.14 // ...and sways gently from side to side, this far
const SWAY_TIME = 10 // one sway there and back
const EDGE_ANGLE = 35 // faces meeting at more than this angle get a line on the CAD side...
const EDGE_MIN = 0.006 // ...as do the outlines where parts meet, unless the run is shorter than this (meters)
// The finished side's colors and finishes, by the model's material names (roughness: 0
// is glossy, 1 matte)
const FINISHES = {
  pink: { color: '#c95fc1', roughness: 0.55 },
  red: { color: '#a948bb', roughness: 0.45 },
  whitesolid: { color: '#efedee', roughness: 0.55 },
  defaultplastic: { color: '#d6d4d7', roughness: 0.45 },
  glossyrubber: { color: '#1b191c', roughness: 0.3 },
}
const CAD_COLOR = '#a7abb3'
const CAD_LINES = '#1d2026'
// ---------------------------------------------------

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const TAU = Math.PI * 2

// The CAD side's lines for one part of the model, like the edges SolidWorks draws: where
// two faces meet at a sharp angle, and the outlines where this part meets another. The
// file's triangles are loose, so points in the same place are first treated as one; then
// short scraps (bits of a curved surface's tessellation) are left out. `scale` turns the
// part's own units into meters.
function cadEdges(geometry, scale) {
  const pos = geometry.attributes.position
  const index = geometry.index
  // One id per place
  const ids = new Map()
  const at = []
  const vid = new Int32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`
    let id = ids.get(key)
    if (id === undefined) {
      id = at.length / 3
      ids.set(key, id)
      at.push(x, y, z)
    }
    vid[i] = id
  }
  // Each edge, and the faces on either side of it
  const edges = new Map()
  const count = index ? index.count : pos.count
  const corner = (k) => vid[index ? index.getX(k) : k]
  const u = new THREE.Vector3()
  const v = new THREE.Vector3()
  const p = (id, out) => out.set(at[id * 3], at[id * 3 + 1], at[id * 3 + 2])
  const A = new THREE.Vector3()
  for (let k = 0; k < count; k += 3) {
    const a = corner(k)
    const b = corner(k + 1)
    const c = corner(k + 2)
    if (a === b || b === c || a === c) continue
    p(a, A)
    p(b, u).sub(A)
    p(c, v).sub(A)
    const n = u.clone().cross(v).normalize()
    for (const [m, q] of [[a, b], [b, c], [c, a]]) {
      const key = m < q ? m * 4194304 + q : q * 4194304 + m
      const e = edges.get(key)
      if (e) e.push(n)
      else edges.set(key, [Math.min(m, q), Math.max(m, q), n])
    }
  }
  const sharp = Math.cos(THREE.MathUtils.degToRad(EDGE_ANGLE))
  const chosen = []
  for (const e of edges.values()) {
    if (e.length === 3 || (e.length === 4 && e[2].dot(e[3]) < sharp)) chosen.push(e)
  }
  // Join the chosen edges into runs, and keep only the long enough runs
  const parent = new Map()
  const root = (x) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)))
      x = parent.get(x)
    }
    return x
  }
  for (const [a, b] of chosen) {
    if (!parent.has(a)) parent.set(a, a)
    if (!parent.has(b)) parent.set(b, b)
    parent.set(root(a), root(b))
  }
  const length = (a, b) => p(a, u).distanceTo(p(b, v)) * scale
  const run = new Map()
  for (const [a, b] of chosen) run.set(root(a), (run.get(root(a)) ?? 0) + length(a, b))
  const out = []
  for (const [a, b] of chosen) {
    if (run.get(root(a)) < EDGE_MIN) continue
    out.push(at[a * 3], at[a * 3 + 1], at[a * 3 + 2], at[b * 3], at[b * 3 + 1], at[b * 3 + 2])
  }
  const lines = new THREE.BufferGeometry()
  lines.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  return lines
}

// A 3D model on a full-screen stage: drag it to turn it (a flick spins it), and after a
// while it drifts back to face the front. A line across it splits it in two: the
// finished product on the left, the bare CAD surfaces with their edges on the right;
// drag the line to show more of either. Notes sit on its details, read on hover (or a
// tap). The model is only loaded once this section is near.
export default function ModelStage({ model }) {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const dotsRef = useRef([])
  const [split, setSplit] = useState(0.5)
  const splitRef = useRef(0.5)
  const redrawRef = useRef(null)
  const [state, setState] = useState('waiting') // 'waiting', 'ready' or 'failed'
  const [turned, setTurned] = useState(false)
  const [open, setOpen] = useState(null) // the note opened by a tap

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      queueMicrotask(() => setState('failed'))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.75
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 10)
    // A soft light from above left, for shape (it turns with the camera, not the model)
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(-1, 1.4, 1.2)
    camera.add(key)
    scene.add(camera)
    const pivot = new THREE.Group()
    scene.add(pivot)

    // The model twice over, sharing its shapes: finished, and as bare CAD surfaces
    const finished = new THREE.Group()
    const cad = new THREE.Group()
    pivot.add(finished, cad)
    const anchors = []
    const normals = []
    const disposables = []
    let size = new THREE.Vector3(1, 1, 1)

    // The stage's size, and how far back the camera stands to frame the model
    let W = 1
    let H = 1
    const frame = () => {
      const r = stage.getBoundingClientRect()
      W = r.width
      H = r.height
      renderer.setSize(W, H, false)
      camera.aspect = W / H
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const fit = W < 700 ? FIT_NARROW : FIT
      const far = Math.max(size.x / (fit * 2 * half * camera.aspect), size.y / (FIT_HIGH * 2 * half))
      camera.position.set(0, 0, far + size.z / 2)
      camera.updateProjectionMatrix()
    }

    // ---- Loading ----
    let loaded = false
    const load = () => {
      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      loader.load(
        model.src,
        (gltf) => {
          const body = gltf.scene
          const box = new THREE.Box3().setFromObject(body)
          size = box.getSize(new THREE.Vector3())
          const centre = box.getCenter(new THREE.Vector3())
          const cadMaterial = new THREE.MeshStandardMaterial({
            color: CAD_COLOR,
            roughness: 0.8,
            // Pushed back a touch, so its lines show whole rather than dashed
            polygonOffset: true,
            polygonOffsetFactor: 2,
            polygonOffsetUnits: 6,
          })
          const lineMaterial = new THREE.LineBasicMaterial({ color: CAD_LINES, transparent: true, opacity: 0.7 })
          disposables.push(cadMaterial, lineMaterial)
          const cadBody = body.clone()
          body.traverse((o) => {
            if (!o.isMesh) return
            disposables.push(o.material)
            const f = FINISHES[o.material.name] ?? { color: '#cccccc', roughness: 0.5 }
            o.material = new THREE.MeshStandardMaterial({ color: f.color, roughness: f.roughness, metalness: 0 })
            disposables.push(o.material, o.geometry)
          })
          cadBody.updateMatrixWorld(true)
          cadBody.traverse((o) => {
            if (!o.isMesh) return
            o.material = cadMaterial
            const edges = cadEdges(o.geometry, o.matrixWorld.getMaxScaleOnAxis())
            disposables.push(edges)
            o.add(new THREE.LineSegments(edges, lineMaterial))
          })
          body.position.sub(centre)
          cadBody.position.sub(centre)
          finished.add(body)
          cad.add(cadBody)

          // Each note: a point on the surface, and which way the surface faces there
          // (from the nearest point of the model), so it hides when turned away
          body.updateMatrixWorld(true)
          const p = new THREE.Vector3()
          const n = new THREE.Vector3()
          for (const note of model.notes ?? []) {
            const at = new THREE.Vector3(...note.at)
            let best = Infinity
            const facing = new THREE.Vector3(0, 0, 1)
            body.traverse((o) => {
              if (!o.isMesh) return
              const pos = o.geometry.attributes.position
              const nor = o.geometry.attributes.normal
              const m = new THREE.Matrix3().getNormalMatrix(o.matrixWorld)
              for (let i = 0; i < pos.count; i++) {
                p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld)
                const d = p.distanceToSquared(at)
                if (d < best && nor) {
                  best = d
                  facing.copy(n.fromBufferAttribute(nor, i).applyMatrix3(m).normalize())
                }
              }
            })
            const anchor = new THREE.Object3D()
            anchor.position.copy(at).sub(centre)
            finished.add(anchor)
            anchors.push(anchor)
            normals.push(facing)
          }
          frame()
          loaded = true
          setState('ready')
          wake()
        },
        undefined,
        () => setState('failed'),
      )
    }

    // ---- Turning ----
    let yaw = 0
    let pitch = 0
    let spin = 0 // a flick's leftover spin, per second
    let held = null // the pointer turning it
    let lastX = 0
    let lastY = 0
    let lastT = 0
    let letGo = -Infinity
    const onDown = (e) => {
      if (held !== null || e.button > 0) return
      held = e.pointerId
      canvas.setPointerCapture(e.pointerId)
      lastX = e.clientX
      lastY = e.clientY
      lastT = performance.now()
      spin = 0
      stage.classList.add('is-turning')
    }
    const onMove = (e) => {
      if (e.pointerId !== held) return
      const t = performance.now()
      const dx = e.clientX - lastX
      yaw += dx * TURN
      if (e.pointerType === 'mouse') pitch = clamp(pitch + (e.clientY - lastY) * TURN, -TILT, TILT)
      spin = (dx * TURN) / Math.max((t - lastT) / 1000, 1 / 120)
      lastX = e.clientX
      lastY = e.clientY
      lastT = t
      setTurned(true)
      wake()
    }
    const onUp = (e) => {
      if (e.pointerId !== held) return
      held = null
      letGo = performance.now()
      // Only a quick flick keeps spinning
      if (performance.now() - lastT > 80 || still) spin = 0
      stage.classList.remove('is-turning')
    }

    // ---- Drawing ----
    const toCamera = new THREE.Vector3()
    const world = new THREE.Vector3()
    const facing = new THREE.Vector3()
    let raf = 0
    let last = 0
    let running = false
    const draw = (t) => {
      const dt = Math.min((t - last) / 1000, 1 / 20)
      last = t
      if (held === null) {
        // A flick spins on and slows; a while after being let go it drifts back to face
        // the front, swaying gently
        yaw += spin * dt
        spin *= Math.exp(-SPIN_FRICTION * dt)
        if (!still && t - letGo > IDLE * 1000 && Math.abs(spin) < 0.05) {
          const k = 1 - Math.exp(-RETURN * dt)
          const home = Math.round(yaw / TAU) * TAU + SWAY * Math.sin((t / 1000 / SWAY_TIME) * TAU)
          yaw += (home - yaw) * k
          pitch += (0 - pitch) * k
        }
      }
      pivot.rotation.set(pitch, yaw, 0, 'YXZ')
      pivot.updateMatrixWorld(true)

      // Finished on the left of the line, CAD on the right
      const x = Math.round(W * splitRef.current)
      renderer.setScissorTest(true)
      finished.visible = true
      cad.visible = false
      renderer.setScissor(0, 0, x, H)
      renderer.setViewport(0, 0, W, H)
      renderer.render(scene, camera)
      finished.visible = false
      cad.visible = true
      renderer.setScissor(x, 0, W - x, H)
      renderer.render(scene, camera)

      // The notes follow their points, hidden while their side faces away
      anchors.forEach((a, i) => {
        const dot = dotsRef.current[i]
        if (!dot) return
        a.getWorldPosition(world)
        facing.copy(normals[i]).applyQuaternion(pivot.quaternion)
        toCamera.copy(camera.position).sub(world).normalize()
        const shown = facing.dot(toCamera) > 0.25
        world.project(camera)
        const x = ((world.x + 1) / 2) * W
        dot.style.translate = `${x}px ${((1 - world.y) / 2) * H}px`
        dot.classList.toggle('is-away', !shown)
        // Its words kept on screen, shifted aside near the edges
        const half = dot.firstChild.offsetWidth / 2
        dot.style.setProperty('--shift', `${clamp(x, half + 12, W - half - 12) - x}px`)
      })
      if (visible) raf = requestAnimationFrame(draw)
      else running = false
    }
    const wake = () => {
      if (running || !loaded || !visible) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(draw)
    }

    // Loaded once the section comes near; drawn only while it's on screen
    let visible = false
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        near.disconnect()
        load()
      },
      { rootMargin: '150% 0px' },
    )
    near.observe(stage)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      wake()
    })
    io.observe(stage)
    const ro = new ResizeObserver(() => {
      frame()
      wake()
    })
    ro.observe(stage)
    // Moving the line redraws (see moveSplit)
    redrawRef.current = wake

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      near.disconnect()
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      disposables.forEach((d) => d.dispose())
      scene.environment?.dispose()
      pmrem.dispose()
      renderer.dispose()
    }
  }, [model])

  // ---- The line ----
  const moveSplit = (to) => {
    const v = clamp(to, 0.06, 0.94)
    splitRef.current = v
    setSplit(v)
    redrawRef.current?.()
  }
  const onSplitDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    stageRef.current.classList.add('is-splitting')
  }
  const onSplitMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const r = stageRef.current.getBoundingClientRect()
    moveSplit((e.clientX - r.left) / r.width)
  }
  const onSplitUp = () => stageRef.current.classList.remove('is-splitting')
  const onSplitKey = (e) => {
    const step = { ArrowLeft: -0.05, ArrowRight: 0.05 }[e.key]
    if (!step) return
    e.preventDefault()
    moveSplit(splitRef.current + step)
  }

  return (
    <section
      ref={stageRef}
      className={`model is-${state}${turned ? ' is-turned' : ''}`}
      style={{ '--split': `${split * 100}%` }}
      aria-label={model.label}
    >
      {state === 'failed' ? (
        <img className="model__fallback" src={model.fallback.src} alt={model.fallback.alt} />
      ) : (
        <>
          <canvas ref={canvasRef} className="model__canvas" aria-hidden="true" />
          <p className="label model__hint">Drag to turn it</p>
          {model.notes?.map((note, i) => (
            <button
              key={note.title}
              ref={(el) => (dotsRef.current[i] = el)}
              type="button"
              className={`model__note${open === i ? ' is-open' : ''}`}
              onClick={() => setOpen(open === i ? null : i)}
              onBlur={() => setOpen(null)}
            >
              <span className="model__tip">
                <span className="model__tip-title">{note.title}</span>
                {note.text && <span className="model__tip-text">{note.text}</span>}
              </span>
            </button>
          ))}
          {/* The line: dragged anywhere along it, or moved with the arrow keys */}
          <div
            className="model__split"
            onPointerDown={onSplitDown}
            onPointerMove={onSplitMove}
            onPointerUp={onSplitUp}
            onPointerCancel={onSplitUp}
          >
            <span className="label model__side model__side--render">Render</span>
            <button
              type="button"
              className="model__handle"
              aria-label="Move the line between the render and the CAD model"
              onKeyDown={onSplitKey}
            />
            <span className="label model__side model__side--cad">CAD</span>
          </div>
        </>
      )}
    </section>
  )
}
