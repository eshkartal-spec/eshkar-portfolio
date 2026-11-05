import { useEffect, useRef } from 'react'
import './HexMosaic.css'

// ---- How the mosaic looks (sizes in CSS pixels, times in seconds) ----
const SIZE = 26 // the tiles' spacing: from one tile's middle to its neighbour's corner...
const TILE = [0.72, 0.97] // ...each tile a share of it, its own size between these (the
// plain photo showing between them)
const REACH = 180 // how far around the cursor the tiles rise
const FADE = 1.3 // how long a risen tile takes to settle back flat
const ZOOM = 0.07 // how much a fully risen tile magnifies its bit of the photo
const LIGHT = 0.18 // how strong the light and shade across a risen tile are (0–1)
const EDGE = 0.3 // how strong its lit and shaded edges are (0–1)
const BEVEL = 3 // ...and how wide (soft, blurred)
const SHADOW = 0.22 // how dark the soft shadow under a risen tile is (0–1)
// How a tile is shaped, its light coming from the upper left:
//   'stone': a matte stone tile, roughly hexagonal (its corners a little uneven and
//            rounded, each tile turned a touch its own way), grainy, a shade lighter or
//            darker than the next, its worn edges catching the light, sitting on a shadow
//   'facet': cut like a gem, a flat top inside a ring of six sloping faces, each as
//            light or dark as it faces the light
//   'dome':  rounded like a pillow, a soft highlight toward its upper left
//   'soft':  flat, with soft lit and shaded edges
const STYLE = 'stone'
const FACET = 0.42 // (facet) how wide its sloping ring is, as a share of the tile
const FACET_LIGHT = 0.5 // (facet) how light and dark its faces get (0–1)
const DOME = 1 // (dome) how strongly rounded it looks: its shine, and its shade (0–1)
const ROUGH = 0.1 // (stone) how uneven its outline is (0: a perfect hexagon)
const WORN = 0.18 // (stone) how worn round its corners are, as a share of the tile
const GRAIN = 0.25 // (stone) how grainy its face is (0–1)
const MATTE = 0.12 // (stone) how much of the photo's colour it dulls, toward stone grey (0–1)
// ------------------------------------------------------------------------

const SQRT3 = Math.sqrt(3)

// A number from 0 to 1 for a tile's place in the grid (and a salt for each use), the
// same each time: so a tile keeps its own size, shape and tone
const rand = (q, r, salt = 0) => {
  const h = Math.sin(q * 127.1 + r * 311.7 + salt * 74.7) * 43758.5453
  return h - Math.floor(h)
}
const sizeOf = (q, r) => TILE[0] + (TILE[1] - TILE[0]) * rand(q, r)

// A soft mosaic of hexagon tiles over a full-screen photo, following the mouse: around
// the cursor small hexagons lift out of the photo, spaced apart and each its own size,
// each raised a touch
// (shaped by STYLE, lit from the upper left, a soft shadow under it) and magnifying its own
// bit of the photo; behind the cursor they settle back flat. Drawn on a canvas exactly
// over the photo, which it draws from: image (cut like the photo, object-fit: cover, at
// focus: its object-position, e.g. '0% 50%'). Mouse only, on wide screens.
export default function HexMosaic({ image, focus = '50% 50%' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas.parentElement
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    const photo = new Image()
    photo.src = image.src
    const [fx, fy] = focus.split(' ').map((v) => parseFloat(v) / 100)

    let W = 0
    let H = 0
    let dpr = 1
    let cut = null // where the photo sits on the canvas (as object-fit: cover)
    const size = () => {
      const r = host.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = r.width
      H = r.height
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      if (photo.naturalWidth) {
        const s = Math.max(W / photo.naturalWidth, H / photo.naturalHeight)
        cut = { s, x: (W - photo.naturalWidth * s) * fx, y: (H - photo.naturalHeight * s) * fy }
      }
    }

    // The tiles that have risen: by grid place, how far risen (0–1)
    const risen = new Map()
    const mouse = { x: -9999, y: -9999, in: false }
    // pointy-top hexagons in offset rows: the tile under a point, and a tile's middle
    const middleOf = (q, r) => [SIZE * SQRT3 * (q + r / 2), SIZE * 1.5 * r]
    const tilesNear = (x, y, reach) => {
      const out = []
      const r0 = Math.floor((y - reach) / (SIZE * 1.5)) - 1
      const r1 = Math.ceil((y + reach) / (SIZE * 1.5)) + 1
      for (let r = r0; r <= r1; r++) {
        const q0 = Math.floor((x - reach) / (SIZE * SQRT3) - r / 2) - 1
        const q1 = Math.ceil((x + reach) / (SIZE * SQRT3) - r / 2) + 1
        for (let q = q0; q <= q1; q++) out.push([q, r])
      }
      return out
    }
    // A tile's outline: a hexagon, or (stone) a rough one, its corners uneven and rounded
    const tilePath = (cx, cy, rad, q, r) => {
      if (STYLE !== 'stone') return hexPath(cx, cy, rad)
      const turn = (rand(q, r, 7) - 0.5) * 0.3
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k - Math.PI / 2 + turn + (rand(q, r, k + 1) - 0.5) * ROUGH * 2
        const rr = rad * (1 - ROUGH * rand(q, r, k + 11))
        return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]
      })
      // straight sides, each corner worn round over a short stretch
      const toward = (p, o, d) => {
        const l = Math.hypot(o[0] - p[0], o[1] - p[1])
        return [p[0] + ((o[0] - p[0]) * d) / l, p[1] + ((o[1] - p[1]) * d) / l]
      }
      const wear = rad * WORN
      ctx.beginPath()
      pts.forEach((p, k) => {
        const a1 = toward(p, pts[(k + 5) % 6], wear)
        const b1 = toward(p, pts[(k + 1) % 6], wear)
        if (k) ctx.lineTo(...a1)
        else ctx.moveTo(...a1)
        ctx.quadraticCurveTo(p[0], p[1], ...b1)
      })
      ctx.closePath()
    }
    // fine grain, for a stone's face
    const grain = (() => {
      const g = document.createElement('canvas')
      g.width = g.height = 96
      const gc = g.getContext('2d')
      const img = gc.createImageData(96, 96)
      for (let i = 0; i < img.data.length; i += 4) {
        const n = 128 + (Math.random() - 0.5) * 160
        img.data[i] = img.data[i + 1] = img.data[i + 2] = n
        img.data[i + 3] = 255
      }
      gc.putImageData(img, 0, 0)
      return ctx.createPattern(g, 'repeat')
    })()
    const hexPath = (cx, cy, rad) => {
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 2
        const px = cx + rad * Math.cos(a)
        const py = cy + rad * Math.sin(a)
        if (k) ctx.lineTo(px, py)
        else ctx.moveTo(px, py)
      }
      ctx.closePath()
    }

    let raf = 0
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      // rise toward the cursor's reach, settle back behind it
      const settle = dt / FADE
      for (const [key, v] of risen) {
        const next = v - settle
        if (next <= 0) risen.delete(key)
        else risen.set(key, next)
      }
      if (mouse.in) {
        for (const [q, r] of tilesNear(mouse.x, mouse.y, REACH)) {
          const [cx, cy] = middleOf(q, r)
          const d = Math.hypot(cx - mouse.x, cy - mouse.y)
          if (d > REACH) continue
          const t = 1 - d / REACH
          const want = t * t * (3 - 2 * t)
          const key = q + ',' + r
          if ((risen.get(key) ?? 0) < want) risen.set(key, want)
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (cut) {
        for (const [key, v] of risen) {
          const [q, r] = key.split(',').map(Number)
          const [cx, cy] = middleOf(q, r)
          if (cx < -SIZE || cy < -SIZE || cx > W + SIZE || cy > H + SIZE) continue
          const rad = SIZE * sizeOf(q, r)
          const stone = STYLE === 'stone'
          // a shadow under it, a little down and right, as if raised (a stone's closer
          // and firmer, as if resting on the ground)
          ctx.save()
          ctx.shadowColor = `rgba(0,0,0,${(stone ? SHADOW * 1.6 : SHADOW) * v})`
          ctx.shadowBlur = (stone ? 5 : 10) * v
          ctx.shadowOffsetX = 2 * v
          ctx.shadowOffsetY = (stone ? 3 : 4) * v
          tilePath(cx, cy, rad, q, r)
          ctx.fillStyle = 'rgba(0,0,0,0.01)'
          ctx.fill()
          ctx.restore()
          ctx.save()
          tilePath(cx, cy, rad, q, r)
          ctx.clip()
          // its bit of the photo, magnified around its middle (a stone barely)
          const z = 1 + (STYLE === 'dome' ? ZOOM * 1.8 : stone ? ZOOM * 0.3 : ZOOM) * v
          ctx.translate(cx, cy)
          ctx.scale(z, z)
          ctx.translate(-cx, -cy)
          ctx.drawImage(photo, cut.x, cut.y, photo.naturalWidth * cut.s, photo.naturalHeight * cut.s)
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          if (stone) {
            // dulled toward stone grey...
            ctx.globalCompositeOperation = 'saturation'
            ctx.fillStyle = `rgba(128,128,128,${MATTE * v})`
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            // ...grainy...
            ctx.globalCompositeOperation = 'overlay'
            ctx.globalAlpha = GRAIN * v
            ctx.fillStyle = grain
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            ctx.globalAlpha = 1
            ctx.globalCompositeOperation = 'source-over'
            // ...each a shade lighter or darker than the next...
            const tone = rand(q, r, 21) - 0.5
            ctx.fillStyle = tone > 0 ? `rgba(255,250,240,${tone * 0.24 * v})` : `rgba(40,30,20,${-tone * 0.3 * v})`
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            // ...lit a little across its face, and its worn edges catching the light on the
            // upper left, falling into shade on the lower right (inside its outline)
            const tilt = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad)
            tilt.addColorStop(0, `rgba(255,255,255,${0.12 * v})`)
            tilt.addColorStop(1, `rgba(0,0,0,${0.16 * v})`)
            ctx.fillStyle = tilt
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            ctx.filter = 'blur(1.5px)'
            ctx.lineWidth = 4
            ctx.save()
            ctx.translate(1.2, 1.2)
            tilePath(cx, cy, rad, q, r)
            ctx.restore()
            ctx.strokeStyle = `rgba(255,255,255,${0.32 * v})`
            ctx.stroke()
            ctx.save()
            ctx.translate(-1.2, -1.2)
            tilePath(cx, cy, rad, q, r)
            ctx.restore()
            ctx.strokeStyle = `rgba(0,0,0,${0.32 * v})`
            ctx.stroke()
            ctx.filter = 'none'
            ctx.restore()
            continue
          }
          if (STYLE === 'facet') {
            // six sloping faces from its rim in to a flat top, each lit by how much it
            // faces the light (from the upper left)
            const inner = rad * (1 - FACET)
            const at = (k, rr) => {
              const a = (Math.PI / 3) * k - Math.PI / 2
              return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]
            }
            for (let k = 0; k < 6; k++) {
              const a0 = at(k, rad)
              const a1 = at(k + 1, rad)
              const b1 = at(k + 1, inner)
              const b0 = at(k, inner)
              // how much the face turns toward the light (up and to the left): -1 to 1
              const mid = (Math.PI / 3) * (k + 0.5) - Math.PI / 2
              const lit = -(Math.cos(mid) + Math.sin(mid)) * Math.SQRT1_2
              ctx.beginPath()
              ctx.moveTo(...a0)
              ctx.lineTo(...a1)
              ctx.lineTo(...b1)
              ctx.lineTo(...b0)
              ctx.closePath()
              ctx.fillStyle = lit > 0 ? `rgba(255,255,255,${FACET_LIGHT * lit * v})` : `rgba(0,0,0,${FACET_LIGHT * -lit * v * 0.85})`
              ctx.fill()
            }
            // the crisp ridge where the slopes meet the top
            hexPath(cx, cy, inner)
            ctx.strokeStyle = `rgba(255,255,255,${0.25 * v})`
            ctx.lineWidth = 0.75
            ctx.stroke()
            ctx.restore()
            continue
          }
          if (STYLE === 'dome') {
            const k = DOME * v
            // the whole of it lighter toward the light, darker away from it...
            const tilt = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad)
            tilt.addColorStop(0, `rgba(255,255,255,${0.3 * k})`)
            tilt.addColorStop(0.5, 'rgba(255,255,255,0)')
            tilt.addColorStop(1, `rgba(0,0,0,${0.4 * k})`)
            ctx.fillStyle = tilt
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            // ...its rim curving away, darker all round...
            const rim = ctx.createRadialGradient(cx, cy, rad * 0.45, cx, cy, rad)
            rim.addColorStop(0, 'rgba(0,0,0,0)')
            rim.addColorStop(1, `rgba(0,0,0,${0.45 * k})`)
            ctx.fillStyle = rim
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            // ...and a soft round shine toward its upper left
            const sx = cx - rad * 0.32
            const sy = cy - rad * 0.36
            const shine = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * 0.6)
            shine.addColorStop(0, `rgba(255,255,255,${0.75 * k})`)
            shine.addColorStop(0.35, `rgba(255,255,255,${0.3 * k})`)
            shine.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.fillStyle = shine
            ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
            ctx.restore()
            continue
          }
          // lit along its upper left, shaded along its lower right
          const g = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad)
          g.addColorStop(0, `rgba(255,255,255,${LIGHT * v})`)
          g.addColorStop(0.5, 'rgba(255,255,255,0)')
          g.addColorStop(1, `rgba(0,0,0,${LIGHT * v})`)
          ctx.fillStyle = g
          ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
          // and softly bevelled: a blurred bright edge along its upper-left sides, a
          // blurred dark one along its lower-right sides, just inside it
          const corner = (k) => {
            const a = (Math.PI / 3) * k - Math.PI / 2
            return [cx + (rad - 1.5) * Math.cos(a), cy + (rad - 1.5) * Math.sin(a)]
          }
          ctx.lineWidth = BEVEL
          ctx.lineJoin = 'round'
          ctx.filter = 'blur(1.5px)'
          for (const [from, to, colour] of [[4, 7, `rgba(255,255,255,${EDGE * 1.4 * v})`], [1, 4, `rgba(0,0,0,${EDGE * v})`]]) {
            ctx.beginPath()
            for (let k = from; k <= to; k++) {
              const [px, py] = corner(k % 6)
              if (k === from) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.strokeStyle = colour
            ctx.stroke()
          }
          ctx.filter = 'none'
          ctx.restore()
        }
      }
      if (risen.size || mouse.in) raf = requestAnimationFrame(frame)
      else raf = 0
    }
    const wake = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      const r = host.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
      mouse.in = true
      wake()
    }
    const onLeave = () => (mouse.in = false)
    size()
    photo.onload = size
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
  }, [image, focus])

  return <canvas ref={canvasRef} className="hex-mosaic" aria-hidden="true" />
}
