import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './WheelSpokes.css'

const TURN = 140 // seconds for one turn by itself
const SCROLLED = 0.12 // how much the page's scroll turns it (degrees per px scrolled)
const LEAN = 3 // how far round each spoke leans, from the hub to the rim (in spoke gaps)
const SHOW_NUMBERS = import.meta.env.DEV // numbers on the photos, only while working locally

// A whole bicycle wheel seen from the front, drawn like the half wheel's (WheelSpin.jsx):
// fine, faint spokes laced from a small hub, every other one leaning the other way, so
// they cross, and a thin double rim. Two spokes for every photo. The lacing leaves long,
// thin gaps running from the rim down toward the hub, between two spokes that cross
// there; each photo shows in one of them, a sliver of it. The wheel turns slowly by
// itself (and a little with the page's scroll); it's a little taller than the screen,
// its left part out of sight (WheelSpokes.css). Over a photo (or tapping it), the wheel
// stops and the photo fills the whole section behind it, the other slivers going empty;
// leaving it, it goes. Clicking a photo (or tapping it again) opens it whole, full screen.

// One photo whole over the darkened page: ✕, Escape or a click outside it closes it; the
// arrows (or the arrow keys) go to the next or last one, round and round
function Viewer({ photos, at, onGo, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onGo(1)
      if (e.key === 'ArrowLeft') onGo(-1)
    }
    window.addEventListener('keydown', onKey)
    const html = document.documentElement
    const was = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = was
    }
  }, [onGo, onClose])
  const p = photos[at]
  return createPortal(
    <div className="viewer" role="dialog" aria-modal="true" aria-label={p.alt} onClick={onClose}>
      <img key={p.src} className="viewer__img" src={p.src} alt={p.alt} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="viewer__btn viewer__close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
      <button
        type="button"
        className="viewer__btn viewer__prev"
        aria-label="Last photo"
        onClick={(e) => {
          e.stopPropagation()
          onGo(-1)
        }}
      >
        ←
      </button>
      <button
        type="button"
        className="viewer__btn viewer__next"
        aria-label="Next photo"
        onClick={(e) => {
          e.stopPropagation()
          onGo(1)
        }}
      >
        →
      </button>
      <p className="viewer__count">
        {at + 1} / {photos.length}
      </p>
    </div>,
    document.body,
  )
}

export default function WheelSpokes({ photos }) {
  const n = photos.length
  const sectionRef = useRef(null)
  const wheelRef = useRef(null)
  const [active, setActive] = useState(null)
  const activeRef = useRef(null)
  activeRef.current = active
  const [open, setOpen] = useState(null) // the photo open full screen
  const openRef = useRef(null)
  openRef.current = open
  const touchRef = useRef(false) // whether the last press was a finger

  useEffect(() => {
    const section = sectionRef.current
    const wheel = wheelRef.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let turn = 0
    let last = performance.now()
    let raf = 0
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      if (!still && activeRef.current === null && openRef.current === null) turn += (360 / TURN) * dt
      const r = section.getBoundingClientRect()
      const scrolled = still ? 0 : (window.innerHeight / 2 - (r.top + r.height / 2)) * SCROLLED
      wheel.style.transform = `rotate(${turn + scrolled}deg)`
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(section)
    // (a tap anywhere else lets go of a tapped photo)
    const onDoc = (e) => !e.target.closest?.('.spokes__gap, .viewer') && setActive(null)
    document.addEventListener('pointerdown', onDoc)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerdown', onDoc)
    }
  }, [])

  // The wheel drawn on a 1000-wide square (as the half wheel: the rim 14 inside the
  // wheel's edge, the hub 7% of it)
  const edge = 484
  const rim = edge - 14
  const hub = edge * 0.07
  const g = (2 * Math.PI) / (2 * n) // the angle between spokes
  const at = (r, a) => [r * Math.sin(a), -r * Math.cos(a)]
  // Spoke k: from the hub at its own angle to the rim LEAN gaps round, the even ones
  // back, the odd ones on, so their rim ends fall one gap apart all the way round
  const spokes = Array.from({ length: 2 * n }, (_, k) => [at(hub, k * g), at(rim, (k + (k % 2 ? LEAN : -LEAN)) * g)])

  // One gap, standing straight up: between the spoke reaching the rim at -g/2 (from the
  // hub at -g/2 - LEAN g... mirrored) and its mirror at +g/2, from where they cross up to
  // the rim. Spoke A runs from the rim at -g/2 to the hub at (LEAN - 1/2) g; B mirrors it
  const [ax, ay] = at(rim, -g / 2)
  const [hx, hy] = at(hub, (LEAN - 0.5) * g)
  // where A meets the middle line (x = 0): the gap's bottom point
  const cy = ay + ((hy - ay) * (0 - ax)) / (hx - ax)
  const gap = `M 0 ${cy} L ${ax} ${ay} A ${rim} ${rim} 0 0 1 ${-ax} ${ay} Z`
  const deg = (a) => (a * 180) / Math.PI

  return (
    <section ref={sectionRef} className={`spokes${active !== null ? ' is-showing' : ''}`} aria-label="Photos of STEP UP">
      {/* The photos filling the section, one showing at a time */}
      <div className="spokes__bg" aria-hidden="true">
        {photos.map((p, i) => (
          <img key={p.src} src={p.src} alt="" className={i === active ? 'is-on' : ''} />
        ))}
        {SHOW_NUMBERS && active !== null && <span className="spokes__bg-no">{active + 1}</span>}
      </div>

      <p className="spokes__title">Picture gallery</p>

      <svg ref={wheelRef} className="spokes__wheel" viewBox="-500 -500 1000 1000">
        <defs>
          <clipPath id="spokes-gap">
            <path d={gap} />
          </clipPath>
        </defs>

        {/* The photos, each in the gap whose middle is at odd rim gap 2i + 1, plus half */}
        {photos.map((p, i) => (
          <g
            key={p.src}
            className={`spokes__gap${i === active ? ' is-on' : ''}`}
            transform={`rotate(${deg((2 * i + 1.5) * g)})`}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
            onPointerDown={(e) => (touchRef.current = e.pointerType !== 'mouse')}
            onClick={() => {
              // a finger's first tap shows it behind the wheel, the next opens it
              if (touchRef.current && activeRef.current !== i) setActive(i)
              else setOpen(i)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(i))}
            aria-label={`Open photo: ${p.alt}`}
          >
            <image
              href={p.src}
              x={ax}
              y={-rim}
              width={-2 * ax}
              height={rim + cy}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#spokes-gap)"
            />
            <path d={gap} className="spokes__hit" />
            {SHOW_NUMBERS && (
              <text y={-rim + 40} className="spokes__no">
                {i + 1}
              </text>
            )}
          </g>
        ))}

        {/* The spokes, the double rim and the hub, as the half wheel's */}
        <g className="spokes__lines" aria-hidden="true">
          {spokes.map(([[x1, y1], [x2, y2]], k) => (
            <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        <g aria-hidden="true">
          <circle r={rim} className="spokes__rim" />
          <circle r={rim - 10} className="spokes__rim spokes__rim--inner" />
          <circle r={hub} className="spokes__hub" />
          <circle r={hub * 0.45} className="spokes__hub spokes__hub--axle" />
        </g>
      </svg>
      {open !== null && (
        <Viewer
          photos={photos}
          at={open}
          onGo={(d) => setOpen((o) => (o + d + n) % n)}
          onClose={() => {
            setOpen(null)
            setActive(null)
          }}
        />
      )}
    </section>
  )
}
