import { useEffect, useRef } from 'react'
import './Footsteps.css'

// ---- How the steps look (sizes in CSS pixels on a 1440px-wide screen, times in seconds) ----
const LENGTH = 80 // a print's length, heel to toe
const WIDTH = 31 // ...and its width across the ball of the foot
const STRIDE = 86 // how far the cursor moves between one print and the next
const GAUGE = 19 // how far each print sits to its side of the cursor's path
const LIFE = 2.6 // how long a print stays before it has faded away
const DARK = 0.32 // how deep a fresh print is (0–1)
const SHADE = 0.32 // how dark the shadow along its pressed-in upper-left edge is (0–1)
const EDGE = 2 // ...and how wide
// ------------------------------------------------------------------------

// A sandal's sole, pointing up (toe at -y), its outer side to +x (a right foot): the
// points it's drawn smoothly through, as shares of its width (x) and length (y)
const SOLE = [
  [0.2, -0.5],
  [0.47, -0.36],
  [0.5, -0.16],
  [0.4, 0.1],
  [0.37, 0.36],
  [0, 0.5],
  [-0.35, 0.36],
  [-0.26, 0.08],
  [-0.48, -0.16],
  [-0.44, -0.36],
  [-0.18, -0.5],
]

// Footprints over a full-screen photo, following the mouse: as the cursor moves, sandal
// prints are pressed into the photo one after another (darkening its own colour, a
// shadow along each one's pressed-in edge), left and right of its path and turned the
// way it goes, fading away a few seconds later. Drawn on a canvas exactly over the
// photo. Mouse only, on wide screens.
// (life, dark: how long a print lasts and how deep it is; stride: how far apart they
// are; ink, edge: its colour and its edge's, as r,g,b, for photos other than the default
// warm stone)
export default function Footsteps({ life = LIFE, dark = DARK, stride = STRIDE, ink = '120,78,56', edge = '70,40,26' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas.parentElement
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')

    let W = 0
    let H = 0
    let dpr = 1
    let k = 1 // sizes scaled with the screen's width
    const size = () => {
      const r = host.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = r.width
      H = r.height
      k = Math.min(Math.max(W / 1440, 0.75), 1.5)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
    }

    // A sole's outline, smoothly through its points (curving through the middles between them)
    const solePath = (side) => {
      const pts = SOLE.map(([x, y]) => [x * WIDTH * k * side, y * LENGTH * k])
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      ctx.beginPath()
      ctx.moveTo(...mid(pts.at(-1), pts[0]))
      pts.forEach((p, i) => ctx.quadraticCurveTo(p[0], p[1], ...mid(p, pts[(i + 1) % pts.length])))
      ctx.closePath()
    }

    const steps = [] // { x, y, turn, side, born }
    let walked = 0
    let side = 1
    let last = null // where the cursor was
    let heading = 0 // the way it's going, smoothed

    let raf = 0
    const frame = (now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      while (steps.length && now - steps[0].born > life * 1000) steps.shift()
      for (const s of steps) {
        const age = (now - s.born) / 1000
        // pressed in quickly, then fading slowly
        const a = Math.min(age / 0.12, 1) * (1 - Math.max(0, (age - 0.4) / (life - 0.4)))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.translate(s.x, s.y)
        ctx.rotate(s.turn)
        ctx.filter = 'blur(0.6px)'
        // the print, deepening the stone's own colour (the canvas multiplies with the photo)...
        solePath(s.side)
        ctx.fillStyle = `rgba(${ink},${dark * a})`
        ctx.fill()
        // ...and its pressed-in edge in shadow along its upper left, inside it
        ctx.save()
        solePath(s.side)
        ctx.clip()
        ctx.translate(EDGE * k, EDGE * k)
        solePath(s.side)
        ctx.lineWidth = EDGE * 2 * k
        ctx.strokeStyle = `rgba(${edge},${SHADE * (dark / DARK) * a})`
        ctx.stroke()
        ctx.restore()
      }
      ctx.filter = 'none'
      if (steps.length) raf = requestAnimationFrame(frame)
      else raf = 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      const r = host.getBoundingClientRect()
      const at = [e.clientX - r.left, e.clientY - r.top]
      if (!last) {
        last = at
        return
      }
      const dx = at[0] - last[0]
      const dy = at[1] - last[1]
      const d = Math.hypot(dx, dy)
      if (d < 0.5) return
      // the heading eases toward the way it's moving, so a wobble doesn't twist the prints
      const want = Math.atan2(dy, dx)
      let turn = want - heading
      turn -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI
      heading += turn * Math.min(1, d / 30)
      walked += d
      last = at
      if (walked < stride * k) return
      walked = 0
      side = -side
      // to its side of the path: right foot to the right of the way it's going
      const off = GAUGE * k * side
      steps.push({
        x: at[0] - Math.sin(heading) * off,
        y: at[1] + Math.cos(heading) * off,
        turn: heading + Math.PI / 2,
        side,
        born: performance.now(),
      })
      wake()
    }
    const onLeave = () => (last = null)

    size()
    const ro = new ResizeObserver(size)
    ro.observe(host)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="footsteps" aria-hidden="true" />
}
