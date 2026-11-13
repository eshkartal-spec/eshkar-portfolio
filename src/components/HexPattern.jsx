import { useEffect, useMemo, useRef, useState } from 'react'
import './HexPattern.css'

// ---- The pattern ----
const LOGO_WIDTH = 0.4 // the logo's width, as a share of the banner's (0.8 on narrow screens)...
const LOGO_HEIGHT = 0.5 // ...but no more than this share of its height
const LOGO_Y = 0.42 // where the logo's middle sits, down the banner
const CELL = 210 // how far apart the tiles are, in the logo's own units (its smallest pieces' size)
const SQUASH = 0.8 // rows closer together than across, as the logo's pieces are wider than tall
const JITTER = 0.17 // how far each tile is nudged off the even grid, as a share of the spacing
const GAP = 15 // the gap between tiles, in the logo's units (as between its pieces)
const ROUND = 16 // the tiles' rounded corners, in the logo's units
const BOB = [1.5, 4] // px: how far each tile drifts up and down (least, most)...
const BOB_TIME = [2.6, 5.2] // ...and how slowly (s, one way)
// ---------------------

// A seeded random, so the pattern is the same at every visit
const random = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// The logo's pieces as points (their outlines' corners and curve points), from its paths
const piecePoints = (d) => {
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number)
  const pts = []
  for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]])
  return pts
}

const inside = ([x, y], poly) => {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

// The outline round a set of points (its convex hull), clockwise on screen
const hull = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const q of p) {
    while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop()
    lower.push(q)
  }
  const upper = []
  for (const q of [...p].reverse()) {
    while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop()
    upper.push(q)
  }
  const h = lower.slice(0, -1).concat(upper.slice(0, -1))
  return area(h) < 0 ? h.reverse() : h
}

// Keep the part of a polygon where (x - point) · normal <= limit
const cut = (poly, [px, py], [nx, ny], limit = 0) => {
  const side = ([x, y]) => (x - px) * nx + (y - py) * ny - limit
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = side(p)
    const sq = side(q)
    if (sp <= 0) out.push(p)
    if (sp * sq < 0) {
      const t = sp / (sp - sq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

// Keep the part of a polygon on the near side of the line halfway between two points
const clip = (poly, a, b) => cut(poly, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [b[0] - a[0], b[1] - a[1]])

// Keep the part of a polygon clear of a (convex, clockwise) shape by a margin: cut along
// the side of the shape the polygon lies most beyond
const clear = (poly, shape, centre, margin) => {
  let best = null
  shape.forEach((p, i) => {
    const q = shape[(i + 1) % shape.length]
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len = Math.hypot(dx, dy) || 1
    const n = [dy / len, -dx / len] // (outward, for a clockwise shape)
    const d = (centre[0] - p[0]) * n[0] + (centre[1] - p[1]) * n[1]
    if (!best || d > best.d) best = { d, p, n }
  })
  return cut(poly, best.p, [-best.n[0], -best.n[1]], -margin)
}

// A polygon drawn in by an even margin all round (each side moved in, the corners where
// the moved sides meet)
const inset = (poly, m) => {
  const n = poly.length
  const lines = poly.map((p, i) => {
    const q = poly[(i + 1) % n]
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len = Math.hypot(dx, dy) || 1
    // (the polygon runs clockwise on screen: inward is to the right of each side)
    const nx = -dy / len
    const ny = dx / len
    return [p[0] + nx * m, p[1] + ny * m, dx, dy]
  })
  return lines.map((l, i) => {
    const k = lines[(i + n - 1) % n]
    const den = k[2] * l[3] - k[3] * l[2]
    if (Math.abs(den) < 1e-9) return [l[0], l[1]]
    const t = ((l[0] - k[0]) * l[3] - (l[1] - k[1]) * l[2]) / den
    return [k[0] + k[2] * t, k[1] + k[3] * t]
  })
}

const area = (poly) => poly.reduce((a, p, i) => {
  const q = poly[(i + 1) % poly.length]
  return a + p[0] * q[1] - q[0] * p[1]
}, 0) / 2

// A closed outline with its corners rounded
const rounded = (poly, r) =>
  poly
    .map((v, i) => {
      const p = poly[(i + poly.length - 1) % poly.length]
      const q = poly[(i + 1) % poly.length]
      const toward = (a, k) => {
        const d = Math.hypot(a[0] - v[0], a[1] - v[1]) || 1
        const t = Math.min(k / d, 0.45)
        return [v[0] + (a[0] - v[0]) * t, v[1] + (a[1] - v[1]) * t]
      }
      const a = toward(p, r)
      const b = toward(q, r)
      return `${i ? 'L' : 'M'} ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${v[0].toFixed(1)} ${v[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
    })
    .join(' ') + ' Z'

// A banner of hexagon tiles like the brand's logo: uneven, rounded, a little wider than
// tall, each drifting up and down a touch on its own slow beat, with the logo's own seven
// pieces set in among them in the middle, hidden in plain sight. Over a tile (with a
// mouse) it fills with the brand's blue, fading back once the cursor moves on; over any
// of the logo's pieces, all seven fill at once and the logo shows itself.
export default function HexPattern({ logo, color = '#5f8797' }) {
  const ref = useRef(null)
  const [size, setSize] = useState(null)

  useEffect(() => {
    const el = ref.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const drawn = useMemo(() => {
    if (!size?.w || !size?.h) return null
    const { w, h } = size
    const [vx, vy, vw, vh] = logo.viewBox.split(/\s+/).map(Number)
    // the logo's size and place on the banner, and so the scale of everything
    const s = Math.min((w * (w < 700 ? 0.8 : LOGO_WIDTH)) / vw, (h * LOGO_HEIGHT) / vh)
    const ox = w / 2 - (vw * s) / 2 - vx * s
    const oy = h * LOGO_Y - (vh * s) / 2 - vy * s
    const pieces = logo.pieces.map((d) => hull(piecePoints(d).map(([x, y]) => [ox + x * s, oy + y * s])))
    const pieceD = logo.pieces.map((d) =>
      d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(ox + x * s).toFixed(1)} ${(oy + y * s).toFixed(1)}`),
    )

    // the tiles' centres: an even honeycomb, each nudged a little
    const rand = random(7)
    const dx = CELL * s
    const dy = dx * 0.866 * SQUASH
    const seeds = []
    for (let row = -2, y = -dy * 2; y < h + dy * 2; row++, y += dy) {
      for (let x = -dx * 2 + (row & 1 ? dx / 2 : 0); x < w + dx * 2; x += dx) {
        seeds.push([x + (rand() - 0.5) * 2 * JITTER * dx, y + (rand() - 0.5) * 2 * JITTER * dy])
      }
    }
    // each tile the space nearer its centre than any other's, trimmed clear of the logo's
    // pieces (so the tiles round it fit snugly, the logo one patch among them), drawn in
    // by half the gap, its corners rounded; none whose centre falls on the logo, nor
    // scraps too small to read as a tile
    const tiles = []
    const full = dx * dy
    seeds.forEach((c) => {
      if (c[0] < -dx || c[0] > w + dx || c[1] < -dy || c[1] > h + dy) return
      if (pieces.some((pp) => inside(c, pp))) return
      let poly = [
        [c[0] - dx * 2, c[1] - dx * 2],
        [c[0] + dx * 2, c[1] - dx * 2],
        [c[0] + dx * 2, c[1] + dx * 2],
        [c[0] - dx * 2, c[1] + dx * 2],
      ]
      for (const o of seeds) {
        if (o === c || Math.abs(o[0] - c[0]) > dx * 2.2 || Math.abs(o[1] - c[1]) > dx * 2.2) continue
        poly = clip(poly, c, o)
      }
      for (const pp of pieces) {
        if (poly.length < 3) break
        const far = pp.every((p) => Math.abs(p[0] - c[0]) > dx * 1.6 || Math.abs(p[1] - c[1]) > dx * 1.6)
        if (!far) poly = clear(poly, pp, c, (GAP * s) / 2)
      }
      if (poly.length < 3) return
      if (area(poly) < 0) poly.reverse()
      if (Math.abs(area(poly)) < full * 0.2) return
      poly = inset(poly, (GAP * s) / 2)
      tiles.push({
        d: rounded(poly, ROUND * s),
        bob: (BOB[0] + rand() * (BOB[1] - BOB[0])).toFixed(1),
        time: (BOB_TIME[0] + rand() * (BOB_TIME[1] - BOB_TIME[0])).toFixed(2),
        delay: (-rand() * BOB_TIME[1] * 2).toFixed(2),
      })
    })
    return { tiles, pieceD, logoBob: { bob: 2.5, time: 3.8 } }
  }, [size, logo])

  return (
    <div ref={ref} className="hexes" style={{ '--hex-color': color }} aria-hidden="true">
      {drawn && (
        <svg className="hexes__svg" viewBox={`0 0 ${size.w} ${size.h}`}>
          {drawn.tiles.map((t, i) => (
            <path
              key={i}
              className="hexes__tile"
              d={t.d}
              style={{ '--bob': `${t.bob}px`, '--time': `${t.time}s`, '--delay': `${t.delay}s` }}
            />
          ))}
          <g className="hexes__logo">
            {drawn.pieceD.map((d, i) => (
              <path
                key={i}
                className="hexes__tile"
                d={d}
                style={{ '--bob': `${drawn.logoBob.bob}px`, '--time': `${drawn.logoBob.time}s`, '--delay': `${-i * 0.35}s` }}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}
