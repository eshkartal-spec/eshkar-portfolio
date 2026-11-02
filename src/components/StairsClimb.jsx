import { useEffect, useRef } from 'react'
import './StairsClimb.css'

// ---- Pace ----
const STEP = 100 // pixels of scrolling per step: one mouse-wheel tick, one step
const SETTLE = 140 // ms after the scrolling stops, the camera settles on the nearest step
const FOLLOW = 0.12 // how quickly the camera catches up (0–1): each step glides
// --------------
const AHEAD = 9 // steps visible ahead before they fade into the distance
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// A flight of stairs you climb by scrolling, with someone carrying the bike standing in
// the middle of it, seen through a window in the page with a line of words beside it
// (above it on phones), and a prompt to scroll on the window until the climb starts:
// the section is a screen tall plus one scroll tick per step, and the window stays on
// screen while you scroll through it, each tick climbing one step. `climb`: { steps,
// line, climber (a photo, cut out), backdrop (a photo of real stairs, shown muted behind) }.
export default function StairsClimb({ climb }) {
  const trackRef = useRef(null)
  const viewRef = useRef(null)
  const flightRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const view = viewRef.current
    const flight = flightRef.current
    const stepEls = [...flight.children]
    const top = stepEls.length - 1
    let target = 0
    let pos = 0
    let raf = 0
    let settle = 0
    const scrolled = () => clamp(-track.getBoundingClientRect().top, 0, top * STEP)
    const read = () => {
      target = scrolled()
      clearTimeout(settle)
      settle = setTimeout(() => (target = Math.round(scrolled() / STEP) * STEP), SETTLE)
    }
    const frame = () => {
      pos += (target - pos) * FOLLOW
      if (Math.abs(target - pos) < 0.05) pos = target
      const p = pos / STEP
      flight.style.setProperty('--p', p.toFixed(4))
      view.style.setProperty('--climb', (p / top).toFixed(4))
      // Steps below the camera drop away; far ones fade into the distance
      stepEls.forEach((el, i) => {
        const d = i - p
        const o = d < -0.6 ? 0 : d < 0 ? 1 + d / 0.6 : d > AHEAD ? 0 : d > AHEAD - 3 ? (AHEAD - d) / 3 : 1
        el.style.setProperty('--o', o.toFixed(3))
        el.style.visibility = o === 0 ? 'hidden' : 'visible'
      })
      raf = requestAnimationFrame(frame)
    }
    // Only while the section is on screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (!e.isIntersecting) return
      read()
      pos = target
      raf = requestAnimationFrame(frame)
    })
    io.observe(track)
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(settle)
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [climb.steps])

  return (
    <section
      ref={trackRef}
      className="climb"
      style={{ height: `calc(${(climb.steps - 1) * STEP}px + 100svh)` }}
      aria-label="Carrying STEP UP up the stairs"
    >
      <div ref={viewRef} className="climb__view">
        {climb.line && <p className="sub climb__line">{climb.line}</p>}
        <div className="climb__window" style={{ '--backdrop': `url("${climb.backdrop}")` }}>
          <div ref={flightRef} className="climb__flight">
            {Array.from({ length: climb.steps }, (_, i) => (
              <div key={i} className="climb__step" style={{ '--i': i }}>
                <div className="climb__riser" />
                <div className="climb__tread" />
              </div>
            ))}
          </div>
          <div className="climb__shade" />
          <img className="climb__climber" src={climb.climber.src} alt={climb.climber.alt} />
          {/* The invitation, gone once the climb starts */}
          <p className="label climb__prompt" aria-hidden="true">
            Scroll to climb
            <span className="climb__prompt-line" />
          </p>
        </div>
      </div>
    </section>
  )
}
