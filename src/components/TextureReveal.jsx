import { useEffect, useRef } from 'react'
import './TextureReveal.css'

// ---- How the texture shows (sizes in CSS pixels, times in seconds) ----
const RADIUS = 110 // how wide a patch the cursor reveals around it
const FADE = 1.8 // how long a revealed patch takes to fade back
const GRAIN = 0.6 // how much a patch's edge follows the leather's grain: 0 is a plain soft edge
// ------------------------------------------------------------------------
const CELLS = 160 // grid cells along the longer side

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// The plain photo, and the second one wherever the cursor has passed (the field: 0 is
// plain). Soft: the edge of each patch breaks along the second photo's lighter and darker
// grain. In pixels: each square cell shows whole or not at all, at its own level of the
// field, so a patch's edge (and its fading) comes and goes cell by cell
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uImage;
uniform sampler2D uTexture;
uniform sampler2D uField;
uniform float uGrain;
uniform float uPixels;
uniform vec2 uCells;
varying vec2 vUv;
void main() {
  vec4 plain = texture2D(uImage, vUv);
  vec4 second = texture2D(uTexture, vUv);
  float field = texture2D(uField, vUv).r;
  float shown;
  if (uPixels > 0.5) {
    vec3 h = fract(floor(vUv * uCells).xyx * 0.1031);
    h += dot(h, h.yzx + 33.33);
    float level = fract((h.x + h.y) * h.z);
    shown = step(0.08 + level * 0.84, field);
  } else {
    float grain = dot(second.rgb, vec3(0.333)) - 0.5;
    shown = smoothstep(0.35, 0.65, field + grain * uGrain);
  }
  gl_FragColor = mix(plain, second, shown);
}`

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// A full-screen photo with a second version of it underneath (`texture`: the same picture
// with a leather texture, or in color): where the cursor passes, the second one shows
// through in a patch that slowly fades back, softly, or in square cells `pixels` wide.
// Only over the wide photo, which the second one matches; drawn with WebGL over the plain
// photo, which stays as it is wherever that isn't available, or with reduced motion.
export default function TextureReveal({ wide, tall, texture, pixels = 0 }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    // Only with a mouse (not on phones and tablets), and not with reduced motion
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
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

    const makeTexture = (unit) => {
      const t = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const imageTex = makeTexture(0)
    const leatherTex = makeTexture(1)
    const fieldTex = makeTexture(2)
    // In pixels, each cell of the field is one hard-edged square
    if (pixels) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    }
    gl.uniform1i(u('uImage'), 0)
    gl.uniform1i(u('uTexture'), 1)
    gl.uniform1i(u('uField'), 2)
    gl.uniform1f(u('uGrain'), GRAIN)
    gl.uniform1f(u('uPixels'), pixels)

    // The field: how much of the texture shows in each cell (0 to 1), and the same as bytes
    // for the shader
    let gw = 0
    let gh = 0
    let field = new Float32Array(0)
    let bytes = new Uint8Array(0)
    let w = 0
    let h = 0
    let plainReady = false
    let leatherReady = false
    let wideShown = false

    // A photo goes up as a texture already cut and scaled to the canvas, like object-fit:
    // cover, centred (scaled by the browser, so the leather's fine grain stays crisp)
    const baked = document.createElement('canvas')
    const upload = (source, unit, tex) => {
      baked.width = canvas.width
      baked.height = canvas.height
      const ai = source.naturalWidth / source.naturalHeight
      const ac = baked.width / baked.height
      const sw = ac > ai ? source.naturalWidth : source.naturalHeight * ac
      const sh = ac > ai ? source.naturalWidth / ac : source.naturalHeight
      const ctx = baked.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(source, (source.naturalWidth - sw) / 2, (source.naturalHeight - sh) / 2, sw, sh, 0, 0, baked.width, baked.height)
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, baked)
    }
    const size = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gw = pixels ? Math.ceil(w / pixels) : w >= h ? CELLS : Math.round((CELLS * w) / h)
      gh = pixels ? Math.ceil(h / pixels) : w >= h ? Math.round((CELLS * h) / w) : CELLS
      gl.uniform2f(u('uCells'), gw, gh)
      field = new Float32Array(gw * gh)
      bytes = new Uint8Array(gw * gh)
      canvas.classList.remove('is-on')
    }
    // The photo the browser picked, and the leather; the leather only matches the wide
    // photo, so over the tall one nothing is revealed
    const leather = new Image()
    const load = () => {
      if (!img.naturalWidth) return
      wideShown = new URL(img.currentSrc || img.src).pathname === new URL(wide.src, location.href).pathname
      if (!wideShown) return
      upload(img, 0, imageTex)
      plainReady = true
    }
    const loadLeather = () => {
      if (!leather.naturalWidth) return
      upload(leather, 1, leatherTex)
      leatherReady = true
    }
    leather.onload = loadLeather
    leather.src = texture.src

    // Where the cursor passes, a soft round patch of texture
    let lx = null
    let ly = null
    const paint = (x, y) => {
      const ci = (x / w) * gw
      const cj = (y / h) * gh
      const r = (RADIUS / w) * gw
      for (let j = Math.max(0, Math.floor(cj - r)); j <= Math.min(gh - 1, Math.ceil(cj + r)); j++) {
        for (let i = Math.max(0, Math.floor(ci - r)); i <= Math.min(gw - 1, Math.ceil(ci + r)); i++) {
          const d = Math.hypot(i - ci, j - cj) / r
          if (d >= 1) continue
          const k = j * gw + i
          field[k] = Math.max(field[k], 1 - d * d)
        }
      }
    }
    const onMove = (e) => {
      if (!plainReady || !leatherReady || !wideShown) return
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        lx = null
        return
      }
      // A patch every few pixels along the way, so a quick sweep leaves an even trail
      const from = lx === null ? [x, y] : [lx, ly]
      const n = clamp(Math.ceil(Math.hypot(x - from[0], y - from[1]) / (RADIUS * 0.25)), 1, 40)
      for (let k = 1; k <= n; k++) paint(from[0] + ((x - from[0]) * k) / n, from[1] + ((y - from[1]) * k) / n)
      lx = x
      ly = y
      wake()
    }
    const onUp = (e) => {
      if (e.pointerType !== 'mouse') lx = null
    }

    let raf = 0
    let last = 0
    let running = false
    const frame = (t) => {
      const dt = Math.min((t - last) / 1000, 1 / 20)
      last = t
      let showing = false
      for (let k = 0; k < field.length; k++) {
        if (field[k] > 0) {
          field[k] = Math.max(0, field[k] - dt / FADE)
          if (field[k] > 0) showing = true
        }
        bytes[k] = Math.round(field[k] * 255)
      }
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, fieldTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gw, gh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      // Shown while any texture shows; at rest it steps aside for the plain photo, until
      // the cursor comes back
      canvas.classList.toggle('is-on', showing)
      if (showing) raf = requestAnimationFrame(frame)
      else running = false
    }
    const wake = () => {
      if (running || !visible) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    // Only while the photo is on screen
    let visible = false
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(canvas)

    size()
    if (img.complete) load()
    img.addEventListener('load', load)
    const onResize = () => {
      size()
      load()
      loadLeather()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      leather.onload = null
      img.removeEventListener('load', load)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [wide, texture, pixels])

  return (
    <div className="texture-reveal">
      <picture>
        {tall && <source media="(orientation: portrait)" srcSet={tall.src} />}
        <img ref={imgRef} src={wide.src} alt={wide.alt} />
      </picture>
      <canvas ref={canvasRef} className="texture-reveal__canvas" aria-hidden="true" />
    </div>
  )
}
