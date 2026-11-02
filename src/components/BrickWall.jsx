import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WheelGallery from './WheelGallery'
import { shapeOf } from './photoShape'
import './BrickWall.css'

// ---- How the wall feels ----
const LEAN = 0.09 // how far the photos shift against one another with the cursor and the scroll (px per px of depth)
const EASE = 0.08 // how quickly the lean follows (0–1)
const GAP = 18 // px between the cursor and the tooltip
// How far each photo stands out (1), sits flush (0) or sinks in (-1), in turn; the
// highlighted ones always stand out
const DEPTHS = [1, -1, 0, -1, 1, 0, 1, 0, -1, 0, -1, 1]
const DEPTH = 34 // px of depth a photo that stands out (or sinks in) is drawn with
// Each column starts a little lower or higher, so the rows don't line up (in px)
const STAGGER = [0, 56, 18, 84, 34]
// -----------------------------

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const columnsFor = (w) => (w >= 1100 ? 4 : w >= 640 ? 3 : 2)

// Photos laid like a wall of uneven bricks: each whole, in its own shape, in columns
// that start at different heights, with even joints between them; some stand out of the
// wall, some sink into it, drawn with light and shadow. With the cursor (and the scroll)
// the photos shift a little against one another, the ones standing out the other way
// from the sunken ones, as if they really were at different depths. Photos with a
// `note` ({ title, text }) are highlighted, their words in a tooltip that follows the
// cursor (on touch screens, shown over the photo on a tap). Clicking a photo opens all
// of them in a gallery (WheelGallery.jsx).
export default function BrickWall({ items }) {
  const wallRef = useRef(null)
  const tipRef = useRef(null)
  const [cols, setCols] = useState(() => columnsFor(window.innerWidth))
  const [tip, setTip] = useState(null) // the note in the tooltip (kept while it fades out)
  const [tipOn, setTipOn] = useState(false)
  const [open, setOpen] = useState(null) // touch screens: the photo whose note is shown
  const [gallery, setGallery] = useState(null) // the photo the gallery opened on, and where it was
  const touch = useMemo(() => window.matchMedia('(hover: none)').matches, [])
  const closeGallery = useCallback(() => setGallery(null), [])

  useEffect(() => {
    const onResize = () => setCols(columnsFor(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // The photos dealt into columns, each into the shortest so far, so the columns end
  // near the same height
  const columns = useMemo(() => {
    const out = Array.from({ length: cols }, (_, c) => ({ height: STAGGER[c] / 300, items: [] }))
    items.forEach((item, n) => {
      const col = out.reduce((a, b) => (b.height < a.height ? b : a))
      col.items.push({ ...item, n, depth: item.note ? 1 : DEPTHS[n % DEPTHS.length] })
      col.height += 1 / shapeOf(item)
    })
    return out.map((c) => c.items)
  }, [items, cols])

  // The lean: toward the cursor while it's over the wall, and a slow tip from top to
  // bottom as the wall scrolls past (--lx, --ly: -1 to 1)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wall = wallRef.current
    let mx = 0
    let my = 0
    let lx = 0
    let ly = 0
    let raf = 0
    const onMove = (e) => {
      const r = wall.getBoundingClientRect()
      mx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
      my = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1)
    }
    const onLeave = () => {
      mx = 0
      my = 0
    }
    const frame = () => {
      const r = wall.getBoundingClientRect()
      const passing = clamp((window.innerHeight / 2 - (r.top + r.height / 2)) / (r.height / 2 + window.innerHeight / 2), -1, 1)
      lx += (mx - lx) * EASE
      ly += (clamp(my * 0.6 + passing * 0.8, -1, 1) - ly) * EASE
      wall.style.setProperty('--lx', lx.toFixed(3))
      wall.style.setProperty('--ly', ly.toFixed(3))
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) raf = requestAnimationFrame(frame)
    })
    io.observe(wall)
    wall.addEventListener('pointermove', onMove)
    wall.addEventListener('pointerleave', onLeave)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      wall.removeEventListener('pointermove', onMove)
      wall.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // The tooltip, beside the cursor, flipped to its other side near the screen's edges
  const follow = (e) => {
    const t = tipRef.current
    const x = e.clientX + GAP + t.offsetWidth > window.innerWidth ? e.clientX - GAP - t.offsetWidth : e.clientX + GAP
    const y = e.clientY + GAP + t.offsetHeight > window.innerHeight ? e.clientY - GAP - t.offsetHeight : e.clientY + GAP
    t.style.transform = `translate(${x}px, ${y}px)`
  }

  // A tap on a highlighted photo first shows its words; a tap on any other (or a second
  // tap) opens the gallery, the photo moving in from where it is. With a mouse, a click
  // always opens it
  const onPick = (item, e) => {
    if (touch && item.note && open !== item.src) return setOpen(item.src)
    setOpen(null)
    setTipOn(false)
    setGallery({ n: item.n, from: e.currentTarget.querySelector('img').getBoundingClientRect() })
  }

  return (
    <section ref={wallRef} className="wall" aria-label="Photos of STEP UP" style={{ '--lean': LEAN, '--depth': DEPTH }}>
      <div className="wall__plane">
        {columns.map((column, c) => (
          <div key={c} className="wall__column" style={{ marginTop: STAGGER[c] }}>
            {column.map((item) => (
              <figure
                key={item.src}
                className={`wall__brick wall__brick--${['in', 'flush', 'out'][item.depth + 1]}${item.note ? ' is-noted' : ''}${open === item.src ? ' is-open' : ''}`}
                style={{ '--z': item.depth }}
                onPointerEnter={(e) => {
                  if (!item.note || e.pointerType !== 'mouse') return
                  setTip(item.note)
                  setTipOn(true)
                  follow(e)
                }}
                onPointerMove={(e) => item.note && e.pointerType === 'mouse' && follow(e)}
                onPointerLeave={() => setTipOn(false)}
              >
                <button type="button" className="wall__open" onClick={(e) => onPick(item, e)} aria-label={`Open ${item.alt} in the gallery`}>
                  <img src={item.src} alt={item.alt} loading="lazy" style={{ aspectRatio: shapeOf(item) }} />
                </button>
                {item.note && (
                  <figcaption className="wall__note">
                    <span className="wall__title">{item.note.title}</span>
                    <span className="wall__text">{item.note.text}</span>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ))}
      </div>
      <div ref={tipRef} className={`wall__tip${tipOn ? ' is-on' : ''}`} aria-hidden="true">
        {tip && (
          <>
            <span className="wall__title">{tip.title}</span>
            <span className="wall__text">{tip.text}</span>
          </>
        )}
      </div>
      {gallery && <WheelGallery items={items} start={gallery.n} from={gallery.from} onClose={closeGallery} />}
    </section>
  )
}
