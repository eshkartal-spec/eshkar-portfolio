import { useEffect, useRef } from 'react'
import './PleatWarp.css'

// ---- How the fabric moves (sizes in CSS pixels, times in seconds) ----
const MAX = 16 // the furthest a pleat can be pushed aside
const PART = 9 // how far the pleats part around a resting cursor
const SPRING = 70 // how strongly a pushed pleat pulls back into place
const HOLD = 90 // how firmly the pleats follow the cursor while it's over them
const DAMP = 5 // how quickly the sway dies out: lower wobbles longer
const DRAG = 0.035 // how much a moving cursor sweeps the pleats along with it
const SPREAD = 22 // how much each pleat carries its neighbours with it
// ------------------------------------------------------------------------
const CELLS = 72 // grid cells along the longer side

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// Each point of the photo is read from a little to the side, by the amount in the field
// (128 = still); where the pleats bunch up they darken a touch, where they open, lighten
const FRAGMENT = `
precision mediump float;
uniform sampler2D uImage;
uniform sampler2D uField;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uMax;
uniform vec2 uTexel;
varying vec2 vUv;
float field(vec2 p) { return (texture2D(uField, p).r - 0.5) * 2.0; }
void main() {
  float d = field(vUv);
  float slope = field(vUv + vec2(uTexel.x, 0.0)) - field(vUv - vec2(uTexel.x, 0.0));
  vec2 uv = uOffset + (vUv - vec2(d * uMax, 0.0)) * uScale;
  vec4 c = texture2D(uImage, uv);
  c.rgb *= 1.0 + slope * 0.35;
  gl_FragColor = c;
}`

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// A full-screen photo of fabric you can run your fingers through: where the cursor (or a
// finger dragged across it) passes, the pleats bend aside around it, and once it moves
// on they spring back with a little sway. Drawn with WebGL over the plain photo, which
// stays as it is wherever that isn't available, or with reduced motion.
export default function PleatWarp({ wide, tall }) {
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

    // The field: how far each patch of the photo is pushed aside, and how fast it moves
    let gw = 0
    let gh = 0
    let push = new Float32Array(0)
    let speed = new Float32Array(0)
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
      push = new Float32Array(gw * gh)
      speed = new Float32Array(gw * gh)
      bytes = new Uint8Array(gw * gh).fill(128)
      gl.uniform1f(u('uMax'), MAX / w)
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

    // The cursor, in canvas pixels, and how it's moving
    let over = false
    let cx = 0
    let cy = 0
    let mvx = 0
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height
      if (inside && over) mvx += x - cx
      over = inside
      cx = x
      cy = y
      if (inside) wake()
    }
    const onLeave = () => (over = false)
    // A finger lifted lets go of the fabric (a mouse stays until it leaves)
    const onUp = (e) => {
      if (e.pointerType !== 'mouse') over = false
    }

    let raf = 0
    let last = 0
    let running = false
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const sigma = clamp(Math.min(w, h) * 0.09, 40, 110)
      const reach = sigma * 3
      const decay = Math.exp(-DAMP * dt)
      let moving = over
      for (let j = 0; j < gh; j++) {
        const y = ((j + 0.5) / gh) * h
        for (let i = 0; i < gw; i++) {
          const k = j * gw + i
          const x = ((i + 0.5) / gw) * w
          let force = -SPRING * push[k]
          // Pleats near the cursor lean away from it, to either side, and get swept along
          if (over && Math.abs(x - cx) < reach && Math.abs(y - cy) < reach) {
            const dx = x - cx
            const fall = Math.exp(-(dx * dx + (y - cy) * (y - cy)) / (2 * sigma * sigma))
            const target = (PART / MAX) * clamp(dx / sigma, -1, 1) * fall
            force += HOLD * (target - push[k])
            speed[k] += (mvx / MAX) * DRAG * fall * 60
          }
          // ...and carry their neighbours with them, so the fabric moves as one
          const l = i > 0 ? push[k - 1] : push[k]
          const r = i < gw - 1 ? push[k + 1] : push[k]
          const up = j > 0 ? push[k - gw] : push[k]
          const dn = j < gh - 1 ? push[k + gw] : push[k]
          force += SPREAD * (l + r + up + dn - 4 * push[k])
          speed[k] = (speed[k] + force * dt) * decay
        }
      }
      mvx = 0
      for (let k = 0; k < push.length; k++) {
        push[k] = clamp(push[k] + speed[k] * dt, -1, 1)
        bytes[k] = Math.round(128 + push[k] * 127)
        if (Math.abs(push[k]) > 0.002 || Math.abs(speed[k]) > 0.002) moving = true
      }
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fieldTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gw, gh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      canvas.classList.add('is-on')
      // Rests once everything has settled, until the cursor comes back
      if (moving) raf = requestAnimationFrame(step)
      else running = false
    }
    const wake = () => {
      if (running || !ready || !visible) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(step)
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
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      img.removeEventListener('load', load)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="warp">
      <picture>
        <source media="(orientation: portrait)" srcSet={tall.src} />
        <img ref={imgRef} src={wide.src} alt={wide.alt} />
      </picture>
      <canvas ref={canvasRef} className="warp__canvas" aria-hidden="true" />
    </div>
  )
}
