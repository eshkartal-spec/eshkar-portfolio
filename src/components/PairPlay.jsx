import { useEffect, useRef } from 'react'
import { createWater } from './stageWater'
import './PairPlay.css'

// ---- How the halves behave (distances in stage pixels, angles in degrees) ----
const SIZE = 0.5 // each half's height, as a share of the stage's...
const SPAN = 0.62 // ...or less, so the joined pair is at most this share of its width
const NARROW = 600 // on stages narrower than this (phones) the halves are a little smaller,
const NARROW_SPAN = 0.5 // ...so apart they leave room in the middle for the prompt
const REACH = 160 // how near its seat a half has to come before the magnet takes hold
const PULL = 0.55 // how hard it pulls once it has: lower pulls harder, sooner (0–1)
const SNAP = 120 // let go this near the seat and it clicks into place
const FOLLOW = 0.35 // how closely a dragged half follows the finger (0–1)
const SETTLE = 0.24 // how quickly a released half glides into place (0–1)
const TOUCH = 3 // this close, gliding together, the halves count as touching: they click
const BREAK = 70 // how far a joined half must be pulled before the magnet lets go
const STRETCH = 0.25 // how much a joined half gives while being pulled, before it lets go
const WOBBLE = 2.6 // the joined triangle's gentle rock either way...
const WOBBLE_TIME = 2.8 // ...and how long one rock takes, in seconds
const KICK = 7 // the bigger rock it gives as it clicks together, dying down to the gentle one
const FRICTION = 0.6 // how quickly a flicked ring slows down (share of its spin lost per second)
const TRAIL = 0.4 // how closely the soft cursor follows the mouse (0–1): lower trails more
// What plays when a pair meets, any of: 'ring' (one ring spreading out and fading),
// 'sand' (a burst of fine grains drifting apart and fading), 'water' (the stage behind
// the pair ripples like water, stageWater.js)
const BURST = ['ring', 'water']
const GRAINS = 1800 // how many grains of sand
const GRAIN_TIME = 1.5 // how long the sand takes to settle and fade, in seconds
// ----------------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// One pair of halves on a stage: white on the left, brown on the right. Each can be
// dragged around its own side; near the middle, where they meet, a magnet pulls a half
// onto its seat, and two seated halves click together along their seam. Joined, a
// triangle rocks gently on its bottom point; a circle spins when flicked. Pulled hard
// enough, a half comes away again.
//
// pair.join: where the right half sits against the left one when joined, and
// pair.seam: how far along the left half its seam runs (where the stage's middle goes),
// pair.pivot: the point the joined pair turns around; all in the left image's pixels.
function PairPlay({ pair }) {
  const stageRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const cursorRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    const els = [leftRef.current, rightRef.current]
    const halves = els.map(() => ({ x: 0, y: 0, tx: 0, ty: 0, w: 0, h: 0, drag: false, gx: 0, gy: 0 }))
    const [L, R] = halves
    let W = 0
    let H = 0
    let s = 1 // stage pixels per image pixel
    let joined = false
    let angle = 0 // the joined pair's turn, in degrees
    let spin = 0 // and how fast it's turning (circle), degrees per second
    let since = 0 // seconds since the halves clicked together
    let grab = null // what the pointer is doing: { half, mode, sx, sy, a }
    let raf = 0
    let last = 0
    // The soft cursor (with a mouse): where the pointer is on the screen (null: no mouse
    // seen yet), and where the circle has got to
    const cursor = cursorRef.current
    let aim = null
    const dot = { x: 0, y: 0 }

    // Where each half sits when the two are joined, the seam on the stage's middle line
    const seat = (i) => {
      const lx = W / 2 - pair.seam * s
      const ly = (H - L.h) / 2
      return i === 0 ? { x: lx, y: ly } : { x: lx + pair.join[0] * s, y: ly + pair.join[1] * s }
    }
    // ...and where the right half should be to meet the left one wherever it is (along
    // the seam line, so only up and down), and the other way round
    const partner = (i) =>
      i === 0 ? { x: seat(0).x, y: R.y - pair.join[1] * s } : { x: seat(1).x, y: L.y + pair.join[1] * s }
    const pivot = () => ({ x: L.x + pair.pivot[0] * s, y: L.y + pair.pivot[1] * s })

    const layout = () => {
      const r = stage.getBoundingClientRect()
      const first = !W
      W = r.width
      H = r.height
      const [li, ri] = els.map((el) => el.querySelector('img'))
      if (!li.naturalWidth || !ri.naturalWidth) return false
      const span = W < NARROW ? NARROW_SPAN : SPAN
      s = Math.min((H * SIZE) / li.naturalHeight, (W * span) / (pair.join[0] + ri.naturalWidth))
      L.w = li.naturalWidth * s
      L.h = li.naturalHeight * s
      R.w = ri.naturalWidth * s
      R.h = ri.naturalHeight * s
      els.forEach((el, i) => {
        el.style.width = `${halves[i].w}px`
        el.style.height = `${halves[i].h}px`
      })
      if (first || !L.placed) {
        // Starting apart, one on each side
        const edge = W < NARROW ? 0.02 : 0.06
        Object.assign(L, { x: W * edge, y: (H - L.h) / 2 + H * 0.06, placed: true })
        Object.assign(R, { x: W * (1 - edge) - R.w, y: (H - R.h) / 2 - H * 0.06 })
      } else if (joined) {
        Object.assign(L, seat(0))
        Object.assign(R, seat(1))
      }
      ;[L, R].forEach((h) => Object.assign(h, { tx: h.x, ty: h.y }))
      return true
    }

    // Keeps a half on its own side of the seam, and on the stage
    const keep = (i, p) => {
      const h = halves[i]
      const st = seat(i)
      const x = i === 0 ? clamp(p.x, -h.w * 0.25, st.x) : clamp(p.x, st.x, W - h.w * 0.75)
      return { x, y: clamp(p.y, -h.h * 0.25, H - h.h * 0.75) }
    }
    const seated = (i) => Math.abs(halves[i].x - seat(i).x) < 1.5

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      if (joined) {
        since += dt
        if (pair.motion === 'wobble') {
          // A gentle rock either way on the bottom point, bigger just after clicking together
          const w = (2 * Math.PI) / WOBBLE_TIME
          const target = WOBBLE * Math.sin(w * since) + KICK * Math.exp(-since * 1.6) * Math.sin(w * 1.7 * since)
          angle += (target - angle) * (grab?.mode === 'pull' ? 0.3 : 1)
          if (grab?.mode === 'pull') angle *= 0.7
        } else if (grab?.mode !== 'spin') {
          angle += spin * dt
          spin *= Math.pow(1 - FRICTION, dt)
          if (Math.abs(spin) < 2) spin = 0
          // Being pulled apart, the ring first turns back to how it was put together
          if (grab?.mode === 'pull') {
            const home = Math.round(angle / 360) * 360
            angle += (home - angle) * 0.25
            spin = 0
          }
        }
      }
      halves.forEach((h) => {
        const ease = h.drag ? FOLLOW : SETTLE
        h.x += (h.tx - h.x) * ease
        h.y += (h.ty - h.y) * ease
        if (Math.abs(h.tx - h.x) < 0.1) h.x = h.tx
        if (Math.abs(h.ty - h.y) < 0.1) h.y = h.ty
      })
      // Two halves headed for their seats, lined up, click together the moment their
      // edges touch: both land exactly in place and the rings burst out from the seam
      const headed = (i) => Math.abs(halves[i].tx - seat(i).x) < 0.5
      const lined = (a, b) => Math.abs(b - a - pair.join[1] * s) < 0.5
      if (!joined && !L.drag && !R.drag && headed(0) && headed(1) && lined(L.ty, R.ty)) {
        const near = (i) => Math.abs(halves[i].x - seat(i).x) < TOUCH
        if (near(0) && near(1) && Math.abs(R.y - L.y - pair.join[1] * s) < TOUCH) {
          ;[L, R].forEach((h) => Object.assign(h, { x: h.tx, y: h.ty }))
          joined = true
          since = 0
          stage.classList.add('is-joined')
          burst(L.x + pair.seam * s, L.y + L.h / 2)
        }
      }
      const pv = pivot()
      els.forEach((el, i) => {
        const h = halves[i]
        el.style.transformOrigin = `${pv.x - h.x}px ${pv.y - h.y}px`
        el.style.transform = `translate(${h.x}px, ${h.y}px) rotate(${joined ? angle : 0}deg)`
      })
      // Shown while the pointer is over the stage, checked every frame, so it stays right
      // even as the page scrolls under a still mouse
      if (aim) {
        const r = stage.getBoundingClientRect()
        const over = aim.x >= r.left && aim.x <= r.right && aim.y >= r.top && aim.y <= r.bottom
        stage.classList.toggle('is-pointing', over || !!grab)
        dot.x += (aim.x - dot.x) * TRAIL
        dot.y += (aim.y - dot.y) * TRAIL
        // (placed with translate, which its scale leaves alone, unlike transform)
        cursor.style.translate = `${dot.x}px ${dot.y}px`
      }
      raf = requestAnimationFrame(frame)
    }

    // The click of two halves meeting, sand: a burst of fine grains thrown out from all
    // along the seam in every direction, fast enough to clear the pair at once, slowing
    // quickly and settling a little as they fade. Drawn on a canvas behind the halves,
    // removed once the last grain has gone
    const sand = (x, y) => {
      const canvas = document.createElement('canvas')
      canvas.className = 'pair__sand'
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      const reach = Math.min(W, H)
      const grains = Array.from({ length: GRAINS }, () => {
        const a = Math.random() * Math.PI * 2
        // Most grains moderate, some fast: a dense cloud and a fine spray beyond it
        const v = reach * (1.3 + Math.pow(Math.random(), 1.6) * 3.6)
        const shade = 95 + Math.random() * 70
        return {
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * L.h * 0.8,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v * 0.8,
          r: 0.35 + Math.random() * 0.7,
          life: GRAIN_TIME * (0.45 + Math.random() * 0.55),
          color: `${shade}, ${shade + 8}, ${shade + 20}`,
        }
      })
      stage.querySelector('.pair__line').after(canvas)
      let t = 0
      let prev = performance.now()
      const draw = (now) => {
        const dt = Math.min((now - prev) / 1000, 1 / 30)
        prev = now
        t += dt
        ctx.clearRect(0, 0, W, H)
        const drag = Math.exp(-5 * dt)
        for (const g of grains) {
          if (t > g.life) continue
          g.vx *= drag
          g.vy = g.vy * drag + 40 * dt // a little settling, like sand
          g.x += g.vx * dt
          g.y += g.vy * dt
          const fade = 1 - t / g.life
          ctx.fillStyle = `rgba(${g.color}, ${(fade * fade * 0.85).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2)
          ctx.fill()
        }
        if (t < GRAIN_TIME) requestAnimationFrame(draw)
        else canvas.remove()
      }
      requestAnimationFrame(draw)
    }

    // The click of two halves meeting, ring: one ring spreads out from the seam and fades
    // (PairPlay.css); behind the halves, and cleared once it's gone
    const ring = (x, y) => {
      const b = document.createElement('span')
      b.className = 'pair__burst'
      b.style.setProperty('--x', `${x}px`)
      b.style.setProperty('--y', `${y}px`)
      // Spreading nearly across the stage, so the whole of its slowing down stays in view
      const reach = Math.min(W * 0.92, 2 * Math.hypot(Math.max(x, W - x), Math.max(y, H - y)))
      const circle = document.createElement('span')
      circle.className = 'pair__ring'
      circle.style.setProperty('--size', `${Math.round(reach)}px`)
      b.append(circle)
      // Just above the middle's glow, below the halves
      stage.querySelector('.pair__line').after(b)
      setTimeout(() => b.remove(), 3000)
    }
    // ...and water, made once the stage is ready (see start, below)
    let water = null
    const burst = (x, y) => {
      if (BURST.includes('ring')) ring(x, y)
      if (BURST.includes('sand')) sand(x, y)
      if (BURST.includes('water')) water?.drop(x, y)
    }

    // ---- The pointer ----
    const at = (e) => {
      const r = stage.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onDown = (e) => {
      const i = els.findIndex((el) => el.contains(e.target))
      if (i < 0) return
      e.preventDefault()
      stage.setPointerCapture(e.pointerId)
      const p = at(e)
      const h = halves[i]
      grab = { half: i, mode: joined ? 'undecided' : 'drag', sx: p.x, sy: p.y, gx: p.x - h.x, gy: p.y - h.y, t: performance.now() }
      if (joined) {
        const c = pivot()
        grab.a = Math.atan2(p.y - c.y, p.x - c.x)
        spin = 0
      } else {
        h.drag = true
      }
      stage.classList.add('is-grabbing')
    }
    // The soft cursor follows the mouse anywhere on the screen, and swells over a half
    const onPoint = (e) => {
      if (e.pointerType !== 'mouse') return
      if (!aim) Object.assign(dot, { x: e.clientX, y: e.clientY })
      aim = { x: e.clientX, y: e.clientY }
      if (!grab) stage.classList.toggle('is-over', els.some((el) => el.contains(e.target)))
    }

    const onMove = (e) => {
      if (!grab) return
      const p = at(e)
      const i = grab.half
      const h = halves[i]
      const dx = p.x - grab.sx
      const dy = p.y - grab.sy
      if (grab.mode === 'undecided' && Math.hypot(dx, dy) > 8) {
        // A joined triangle can only be pulled apart; a ring is spun by a drag around
        // it and pulled apart by a drag outward
        if (pair.motion !== 'spin') grab.mode = 'pull'
        else {
          const c = pivot()
          const rx = grab.sx - c.x
          const ry = grab.sy - c.y
          const radial = Math.abs(dx * rx + dy * ry) / (Math.hypot(dx, dy) * Math.hypot(rx, ry) || 1)
          grab.mode = radial > 0.75 ? 'pull' : 'spin'
        }
      }
      if (grab.mode === 'spin') {
        const c = pivot()
        const a = Math.atan2(p.y - c.y, p.x - c.x)
        let d = ((a - grab.a) * 180) / Math.PI
        if (d > 180) d -= 360
        if (d < -180) d += 360
        const now = performance.now()
        const dts = Math.max((now - grab.t) / 1000, 1 / 120)
        angle += d
        spin = spin * 0.5 + (d / dts) * 0.5
        grab.a = a
        grab.t = now
      } else if (grab.mode === 'pull') {
        const st = seat(i)
        const homeTurn = Math.abs(angle - Math.round(angle / 360) * 360) < 3
        if (Math.hypot(dx, dy) > BREAK && homeTurn) {
          // Comes away: the pair is two halves again, this one in hand
          joined = false
          angle = 0
          stage.classList.remove('is-joined')
          grab.mode = 'drag'
          h.drag = true
          grab.gx = p.x - h.x
          grab.gy = p.y - h.y
        } else {
          h.tx = st.x + dx * STRETCH
          h.ty = st.y + dy * STRETCH
        }
      }
      if (grab.mode === 'drag') {
        let t = keep(i, { x: p.x - grab.gx, y: p.y - grab.gy })
        // Near the middle, the magnet draws the half in along the seam
        const st = seat(i)
        const near = 1 - Math.abs(t.x - st.x) / REACH
        if (near > 0) {
          const pull = Math.pow(near, PULL)
          const other = 1 - i
          const goal = seated(other) ? partner(i) : st
          t = { x: t.x + (st.x - t.x) * pull, y: seated(other) ? t.y + (goal.y - t.y) * pull : t.y }
        }
        h.tx = t.x
        h.ty = t.y
      }
    }
    const onUp = () => {
      if (!grab) return
      const i = grab.half
      const h = halves[i]
      h.drag = false
      // A ring held still before letting go doesn't keep turning
      if (grab.mode === 'spin' && performance.now() - grab.t > 80) spin = 0
      if (grab.mode === 'pull') {
        // Not pulled far enough: back to its seat
        Object.assign(h, { tx: seat(i).x, ty: seat(i).y })
      } else if (grab.mode === 'drag') {
        const st = seat(i)
        if (Math.abs(h.tx - st.x) < SNAP) {
          h.tx = st.x
          // Lined up closely enough with a seated partner: clicks onto it
          const other = 1 - i
          const goal = partner(i)
          if (seated(other) && Math.abs(h.ty - goal.y) < SNAP) h.ty = goal.y
        }
      }
      grab = null
      stage.classList.remove('is-grabbing')
    }

    // Starts once both photos are in, and runs only while the stage is on screen
    let ready = false
    const start = () => {
      if (ready || !layout()) return
      ready = true
      stage.classList.add('is-ready')
      if (BURST.includes('water')) water = createWater(stage, stage.querySelector('.pair__line'))
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    els.forEach((el) => {
      const img = el.querySelector('img')
      if (img.complete) start()
      else img.addEventListener('load', start)
    })
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting && ready) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(stage)
    const ro = new ResizeObserver(() => {
      if (!ready) return
      layout()
      water?.resize()
    })
    ro.observe(stage)
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onUp)
    window.addEventListener('pointermove', onPoint, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      window.removeEventListener('pointermove', onPoint)
      water?.destroy()
    }
  }, [pair])

  return (
    <div ref={stageRef} className="pair">
      <span className="pair__line" aria-hidden="true" />
      <div ref={leftRef} className="pair__half">
        <img src={pair.left.src} alt={pair.left.alt} draggable="false" />
      </div>
      <div ref={rightRef} className="pair__half">
        <img src={pair.right.src} alt={pair.right.alt} draggable="false" />
      </div>
      <p className="label pair__hint">
        Bring them <span>together</span>
      </p>
      <span ref={cursorRef} className="pair__cursor" aria-hidden="true" />
    </div>
  )
}

// A pair's section: the pair's name and a short explainer, centred above the stage. A
// pair without its photos yet gets an empty stage.
export default function PairSection({ pair }) {
  return (
    <section className="pair-section wrap">
      <div className="pair-section__text">
        <h3 className="pair-section__title">{pair.title}</h3>
        <p className="pair-section__about">{pair.text}</p>
      </div>
      {pair.left && pair.right ? (
        <PairPlay pair={pair} />
      ) : (
        <div className="pair pair--empty">
          <p className="label">Photos to come</p>
        </div>
      )}
    </section>
  )
}
