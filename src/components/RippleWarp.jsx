import { useEffect, useRef } from 'react'
import './RippleWarp.css'

// ---- How the water moves (sizes in CSS pixels) ----
const MAX = 4 // the furthest the photo is pushed by a ripple
const DROP = 0.3 // how hard a moving cursor stirs the surface
const REACH = 3 // how many cells around the cursor it stirs
const CALM = 0.955 // how much of a ripple is left after each step: lower dies out sooner
const STEPS = 40 // steps of the water per second: fewer spread more slowly
const SHADE = 0.12 // how much the ripples catch the light
// ----------------------------------------------------
const CELLS = 140 // grid cells along the longer side

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// Each point of the photo is read from a little off to the side, along the slope of the
// water there (128 = still); slopes facing up-left catch a touch of light, the others
// a touch of shade
const FRAGMENT = `
precision mediump float;
uniform sampler2D uImage;
uniform sampler2D uField;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec2 uMax;
uniform vec2 uTexel;
uniform float uShade;
varying vec2 vUv;
float height(vec2 p) { return (texture2D(uField, p).r - 0.5) * 2.0; }
void main() {
  float sx = height(vUv + vec2(uTexel.x, 0.0)) - height(vUv - vec2(uTexel.x, 0.0));
  float sy = height(vUv + vec2(0.0, uTexel.y)) - height(vUv - vec2(0.0, uTexel.y));
  vec2 uv = uOffset + (vUv + vec2(sx, sy) * uMax) * uScale;
  vec4 c = texture2D(uImage, uv);
  c.rgb *= 1.0 - (sx + sy) * uShade;
  gl_FragColor = c;
}`

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// A full-screen photo the cursor moves over like a hand over still water: soft ripples
// spread out from where it passes and slowly calm (and from a finger dragged sideways
// across it). Drawn with WebGL over the plain photo, which stays as it is wherever that
// isn't available, or with reduced motion.
export default function RippleWarp({ wide, tall }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false })
    if (!gl) return

    const shader = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const u = (name) => gl.getUniformLocation(prog, name)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    const texture = (unit) => {
      const t = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const imageTex = texture(0)
    const fieldTex = texture(1)
    gl.uniform1i(u('uImage'), 0)
    gl.uniform1i(u('uField'), 1)
    gl.uniform1f(u('uShade'), SHADE)

    // The water: its height in each cell now and a step ago (ripples spread by comparing
    // the two), and the same heights as bytes for the shader
    let gw = 0
    let gh = 0
    let now = new Float32Array(0)
    let before = new Float32Array(0)
    let bytes = new Uint8Array(0)
    let w = 0
    let h = 0
    let ready = false

    // The photo covers the canvas like object-fit: cover, centred
    const fit = () => {
      if (!img.naturalWidth) return
      const ai = img.naturalWidth / img.naturalHeight
      const ac = w / h
      if (ac > ai) {
        gl.uniform2f(u('uScale'), 1, ai / ac)
        gl.uniform2f(u('uOffset'), 0, (1 - ai / ac) / 2)
      } else {
        gl.uniform2f(u('uScale'), ac / ai, 1)
        gl.uniform2f(u('uOffset'), (1 - ac / ai) / 2, 0)
      }
    }
    const size = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gw = w >= h ? CELLS : Math.round((CELLS * w) / h)
      gh = w >= h ? Math.round((CELLS * h) / w) : CELLS
      now = new Float32Array(gw * gh)
      before = new Float32Array(gw * gh)
      bytes = new Uint8Array(gw * gh).fill(128)
      gl.uniform2f(u('uMax'), MAX / w, MAX / h)
      gl.uniform2f(u('uTexel'), 1 / gw, 1 / gh)
      fit()
    }
    // The photo the browser picked (wide or tall) goes up as the texture
    const load = () => {
      if (!img.naturalWidth) return
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, imageTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
      fit()
      ready = true
      wake()
    }

    // Where the cursor stirs the water: a soft dip around it, deeper the faster it moves
    let lx = null
    let ly = null
    const stir = (x, y, amount) => {
      const ci = Math.round((x / w) * gw)
      const cj = Math.round((y / h) * gh)
      for (let j = cj - REACH; j <= cj + REACH; j++) {
        for (let i = ci - REACH; i <= ci + REACH; i++) {
          if (i < 1 || j < 1 || i >= gw - 1 || j >= gh - 1) continue
          const d2 = (i - ci) ** 2 + (j - cj) ** 2
          now[j * gw + i] -= amount * Math.exp(-d2 / (REACH * REACH * 0.5))
        }
      }
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        lx = null
        return
      }
      if (lx !== null) {
        const moved = Math.hypot(x - lx, y - ly)
        // A stir every few pixels along the way, so a quick sweep leaves an even trail
        const n = Math.min(Math.ceil(moved / 8), 12)
        for (let k = 1; k <= n; k++) {
          stir(lx + ((x - lx) * k) / n, ly + ((y - ly) * k) / n, DROP * clamp(moved / (n * 10), 0.2, 1))
        }
      }
      lx = x
      ly = y
      wake()
    }
    const onUp = (e) => {
      if (e.pointerType !== 'mouse') lx = null
    }

    let raf = 0
    let last = 0
    let owed = 0
    let running = false
    // One step of the water: each cell follows its neighbours, and everything calms a little
    const flow = () => {
      for (let j = 1; j < gh - 1; j++) {
        for (let i = 1; i < gw - 1; i++) {
          const k = j * gw + i
          const next = (now[k - 1] + now[k + 1] + now[k - gw] + now[k + gw]) / 2 - before[k]
          before[k] = next * CALM
        }
      }
      ;[now, before] = [before, now]
    }
    const frame = (t) => {
      owed = Math.min(owed + (t - last) / 1000, 4 / STEPS)
      last = t
      while (owed >= 1 / STEPS) {
        flow()
        owed -= 1 / STEPS
      }
      let moving = false
      for (let k = 0; k < now.length; k++) {
        const v = clamp(now[k], -1, 1)
        bytes[k] = Math.round(128 + v * 127)
        if (Math.abs(now[k]) > 0.003) moving = true
      }
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fieldTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gw, gh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      canvas.classList.add('is-on')
      // Rests once the water is calm again, until the cursor comes back
      if (moving) raf = requestAnimationFrame(frame)
      else {
        running = false
        now.fill(0)
        before.fill(0)
      }
    }
    const wake = () => {
      if (running || !ready || !visible) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    // Only while the photo is on screen
    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) wake()
    })
    io.observe(canvas)

    size()
    if (img.complete) load()
    img.addEventListener('load', load)
    const onResize = () => {
      size()
      wake()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      img.removeEventListener('load', load)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <div className="ripple-warp">
      <picture>
        {tall && <source media="(orientation: portrait)" srcSet={tall.src} />}
        <img ref={imgRef} src={wide.src} alt={wide.alt} />
      </picture>
      <canvas ref={canvasRef} className="ripple-warp__canvas" aria-hidden="true" />
    </div>
  )
}
