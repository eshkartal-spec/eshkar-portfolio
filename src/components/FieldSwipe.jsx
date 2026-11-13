import { useEffect, useRef, useState } from 'react'
import './FieldSwipe.css'

const SWIPE = 40 // px a finger must move sideways to swipe
const SLIDE = 1000 // ms a slide takes (as in FieldSwipe.css)

// The project's fields side by side in a strip: the one shown fills most of the section,
// the next peeks in at the right edge, its name showing. Pointing at the peek opens it a
// little wider; clicking it (or swiping, or the arrow keys) slides the strip along: the
// one shown goes out to the left as the next opens out to fill its place and the one
// after comes in to peek, round and round. Each shows its photo, its name and its words.
export default function FieldSwipe({ fields }) {
  const n = fields.length
  const [at, setAt] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const lastRoles = useRef([])
  const sectionRef = useRef(null)

  // (while a slide is under way, pointing at the peek doesn't widen it: changing the
  // strip's proportions mid-slide would throw its edges out of step, leaving a gap)
  const slidingRef = useRef(false)
  const go = (way) => {
    setPeeking(false)
    slidingRef.current = true
    setTimeout(() => (slidingRef.current = false), SLIDE)
    setAt((a) => (a + way + n) % n)
  }
  const peek = (e) => e.pointerType === 'mouse' && !slidingRef.current && setPeeking(true)

  // Where each sits: 0 shown, 1 peeking, n - 1 just gone (off to the left), the rest
  // waiting off to the right
  const roles = fields.map((_, i) => (i - at + n) % n)
  // (one going from just gone to waiting, or back, jumps there unseen rather than
  // sweeping across the section)
  const jumps = roles.map((r, i) => {
    const was = lastRoles.current[i]
    if (was === undefined) return true
    const far = (k) => k >= 2 && k <= n - 2
    return (was === n - 1 && far(r)) || (far(was) && r === n - 1)
  })
  useEffect(() => {
    lastRoles.current = roles
  })

  // Arrow keys while the section is on screen
  useEffect(() => {
    let on = false
    const io = new IntersectionObserver(([e]) => (on = e.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] })
    io.observe(sectionRef.current)
    const onKey = (e) => {
      if (!on || e.target.closest?.('input, textarea')) return
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A sideways swipe on touch screens
  const touch = useRef(null)
  const onDown = (e) => {
    if (e.pointerType !== 'mouse') touch.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.clientX - t.x
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - t.y)) go(dx < 0 ? 1 : -1)
  }

  return (
    <section
      ref={sectionRef}
      className={`fields${peeking ? ' is-peeking' : ''}`}
      aria-label="Fields"
      aria-roledescription="carousel"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => (touch.current = null)}
    >
      {fields.map((f, i) => {
        const role = roles[i]
        const place = role === 0 ? 'shown' : role === 1 ? 'next' : role === n - 1 ? 'gone' : 'waiting'
        return (
          <article
            key={f.title}
            className={`fields__panel is-${place}${jumps[i] ? ' is-jumping' : ''}`}
            aria-hidden={role !== 0}
            onClick={role === 1 ? () => go(1) : undefined}
            onPointerEnter={role === 1 ? peek : undefined}
            onPointerMove={role === 1 && !peeking ? peek : undefined}
            onPointerLeave={role === 1 ? () => setPeeking(false) : undefined}
          >
            <div className="fields__inner">
              <img src={f.image.src} alt={f.image.alt} draggable="false" />
              <div className="fields__words">
                <h3 className="display fields__title">{f.title}</h3>
                <p className="fields__text">{f.text}</p>
              </div>
            </div>
            {role === 1 && (
              <button
                type="button"
                className="fields__next"
                aria-label={`Next: ${f.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
              />
            )}
          </article>
        )
      })}
    </section>
  )
}
