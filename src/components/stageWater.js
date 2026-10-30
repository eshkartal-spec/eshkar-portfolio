// A water surface over a stage (PairPlay.jsx), still and invisible until something drops
// into it: then ripples spread out, catching a little light on one side of each crest and
// a little shade on the other, and slowly calm. Drawn with WebGL on a see-through canvas;
// without WebGL, or with reduced motion, there's simply no water.

// ---- How the water moves ----
const CALM = 0.93 // how much of a ripple is left after each step: lower dies out sooner (and nearer)
const STEPS = 45 // steps of the water per second: fewer spread more slowly
const DROP = 1.1 // how deep a drop goes in
const DROP_SIZE = 4 // and how wide it is, in cells
const LIGHT = 0.6 // how bright the lit side of a ripple...
const SHADE = 0.22 // ...and how dark the shaded side
// --------------------------------
const CELLS = 170 // grid cells along the stage's width

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// The water's slope at each point: facing the light (up and to the left) it shows as a
// touch of white, facing away as a touch of blue-grey shade
const FRAGMENT = `
precision mediump float;
uniform sampler2D uField;
uniform vec2 uTexel;
uniform float uLight;
uniform float uShade;
varying vec2 vUv;
float height(vec2 p) { return (texture2D(uField, p).r - 0.5) * 2.0; }
void main() {
  float sx = height(vUv + vec2(uTexel.x, 0.0)) - height(vUv - vec2(uTexel.x, 0.0));
  float sy = height(vUv + vec2(0.0, uTexel.y)) - height(vUv - vec2(0.0, uTexel.y));
  float lit = -(sx + sy);
  gl_FragColor = lit > 0.0
    ? vec4(1.0, 1.0, 1.0, min(lit * uLight, 1.0))
    : vec4(0.36, 0.39, 0.45, min(-lit * uShade, 1.0));
}`

export function createWater(stage, before) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const canvas = document.createElement('canvas')
  canvas.className = 'pair__water'
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false })
  if (!gl) return null

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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
  const u = (name) => gl.getUniformLocation(prog, name)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.uniform1i(u('uField'), 0)
  gl.uniform1f(u('uLight'), LIGHT)
  gl.uniform1f(u('uShade'), SHADE)
  before.after(canvas)

  // The water: its height in each cell now and a step ago (ripples spread by comparing
  // the two), and the same heights as bytes for the shader
  let gw = 0
  let gh = 0
  let w = 0
  let h = 0
  let now = new Float32Array(0)
  let then = new Float32Array(0)
  let bytes = new Uint8Array(0)
  const size = () => {
    const r = stage.getBoundingClientRect()
    w = r.width
    h = r.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gw = CELLS
    gh = Math.max(8, Math.round((CELLS * h) / w))
    now = new Float32Array(gw * gh)
    then = new Float32Array(gw * gh)
    bytes = new Uint8Array(gw * gh).fill(128)
    gl.uniform2f(u('uTexel'), 1 / gw, 1 / gh)
  }
  size()

  let raf = 0
  let last = 0
  let owed = 0
  let running = false
  const flow = () => {
    for (let j = 1; j < gh - 1; j++) {
      for (let i = 1; i < gw - 1; i++) {
        const k = j * gw + i
        const next = (now[k - 1] + now[k + 1] + now[k - gw] + now[k + gw]) / 2 - then[k]
        then[k] = next * CALM
      }
    }
    ;[now, then] = [then, now]
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
      const v = Math.min(Math.max(now[k], -1), 1)
      bytes[k] = Math.round(128 + v * 127)
      if (Math.abs(now[k]) > 0.004) moving = true
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gw, gh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    // Rests, cleared, once the water is calm again
    if (moving) raf = requestAnimationFrame(frame)
    else {
      running = false
      now.fill(0)
      then.fill(0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
  }

  return {
    // Something drops in at (x, y), in stage pixels
    drop(x, y) {
      const ci = Math.round((x / w) * gw)
      const cj = Math.round((y / h) * gh)
      const r = DROP_SIZE * 2
      for (let j = cj - r; j <= cj + r; j++) {
        for (let i = ci - r; i <= ci + r; i++) {
          if (i < 1 || j < 1 || i >= gw - 1 || j >= gh - 1) continue
          const d2 = (i - ci) ** 2 + (j - cj) ** 2
          now[j * gw + i] -= DROP * Math.exp(-d2 / (2 * DROP_SIZE * DROP_SIZE))
        }
      }
      if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    },
    resize: size,
    destroy() {
      cancelAnimationFrame(raf)
      canvas.remove()
    },
  }
}
