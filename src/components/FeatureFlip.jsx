import { useEffect, useRef, useState } from 'react'
import './FeatureFlip.css'

const STEP = 0.6 // how much scrolling moves on to the next feature, in screen heights
const SWIPE = 900 // ms: one swipe across
const LAG = 90 // ms the words trail the photo by, as if dragged along behind it
// a push that gathers speed, then settles into place with a little give at the end
const EASE = 'cubic-bezier(0.76, 0, 0.18, 1.06)'

// One feature: the photo on one side, its words on the other (traded on every other
// feature; on phones, the photo always above the words)
function Stage({ f, i, refs, className = '', style }) {
  return (
    <div className={`features__stage${i % 2 ? ' is-swapped' : ''} ${className}`} style={style} aria-hidden={!!className}>
      <figure ref={refs?.[0]} className="features__photo">
        <img src={f.src} alt={f.alt} />
      </figure>
      <div ref={refs?.[1]} className="features__text">
        <h3 className="display features__title">{f.note.title}</h3>
        <p className="features__body">{f.note.text}</p>
      </div>
    </div>
  )
}

// The project's features, one at a time, held on screen while the page scrolls past.
// Scrolling on to the next one swipes it across like a page pushed aside by hand: the
// next feature slides in from the right edge as the one shown is pushed off to the left,
// both moving together, the words trailing their photo a little; it gathers speed, then
// settles into place. Scrolling back swipes the other way. A row of short bars along the
// bottom shows which it is.
export default function FeatureFlip({ features, photoHeight }) {
  const n = features.length
  const trackRef = useRef(null)
  const inRefs = [useRef(null), useRef(null)]
  const outRefs = [useRef(null), useRef(null)]
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(null) // { i, way } while a swipe is under way

  useEffect(() => {
    const track = trackRef.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let current = 0
    let target = 0
    let busy = false
    let raf = 0

    // One swipe, from the feature shown to the one the scroll is at (again, if the scroll
    // moved on meanwhile)
    const swipe = async () => {
      if (busy || target === current) return
      const next = target
      if (still) {
        current = next
        setShown(next)
        return
      }
      busy = true
      const way = next > current ? 1 : -1
      setLeaving({ i: current, way })
      current = next
      setShown(next)
      // (once both are on the page: the new one waiting off to the side)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const across = window.innerWidth
      const move = (el, k, from, to) =>
        el?.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], {
          duration: SWIPE,
          delay: k * LAG,
          easing: EASE,
          fill: 'both',
        }).finished
      await Promise.all([
        ...inRefs.map((r, k) => move(r.current, k, way * across, 0)),
        ...outRefs.map((r, k) => move(r.current, k, 0, -way * across)),
      ])
      setLeaving(null)
      // (once it's rendered in place, its swipe's end held till then)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      inRefs.forEach((r) => r.current?.getAnimations().forEach((x) => x.cancel()))
      busy = false
      swipe()
    }

    const update = () => {
      raf = 0
      const r = track.getBoundingClientRect()
      const run = r.height - window.innerHeight
      const p = Math.min(Math.max(-r.top / Math.max(run, 1), 0), 0.9999)
      target = Math.floor(p * n)
      swipe()
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  return (
    <section
      ref={trackRef}
      className="features"
      // (photoHeight: how tall the photos may be, as a share of the screen under the top bar)
      style={{ height: `calc(100svh + ${n * STEP * 100}svh)`, '--photo-h': photoHeight }}
      aria-label="Features"
    >
      <div className="features__view">
        {leaving && <Stage key={`out-${leaving.i}`} f={features[leaving.i]} i={leaving.i} refs={outRefs} className="is-leaving" />}
        <Stage
          key={`in-${shown}`}
          f={features[shown]}
          i={shown}
          refs={inRefs}
          // (waiting off to the side until its swipe starts)
          style={leaving ? { '--from': `${leaving.way * 100}vw` } : undefined}
          className={leaving ? 'is-entering' : ''}
        />
        <p className="features__sr" aria-live="polite">
          {features[shown].note.title}
        </p>
        <ol className="features__dots" aria-hidden="true">
          {features.map((x, i) => (
            <li key={x.src} className={i === shown ? 'is-on' : ''} />
          ))}
        </ol>
      </div>
      {/* (all the photos loaded up front, so each is ready when it turns up) */}
      <div hidden>
        {features.map((x) => (
          <img key={x.src} src={x.src} alt="" />
        ))}
      </div>
    </section>
  )
}
