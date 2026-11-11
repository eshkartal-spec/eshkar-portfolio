import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { shapeOf } from './photoShape'
import './PhotoSlide.css'

// ---- Pace ----
const EVERY = 2600 // ms each photo stays before the next slides in
const SLIDE = 900 // ms a slide takes
const EASE = 'cubic-bezier(0.65, 0, 0.2, 1)'
const GAP = 16 // px between a photo and the next as they pass
// --------------

// Photos in a frame, one at a time, the next sliding in from the right as the last goes
// out to the left, every few seconds by itself, round and round. The arrows beside it
// (or the arrow keys, with it focused) go on or back by hand, and the timer starts over;
// it waits while the cursor is over it, or it's off screen. A row of short bars under it
// shows which photo it is, the current one filling with pink as its time runs.
export default function PhotoSlide({ photos }) {
  const n = photos.length
  const sectionRef = useRef(null)
  const photoRefs = useRef([])
  const [at, setAt] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [round, setRound] = useState(0) // a new number restarts the timer (and the bar)
  const moveRef = useRef(null) // the slide to play: { from, to, way }

  const go = (way) => {
    setAt((a) => {
      const to = (a + way + n) % n
      moveRef.current = { from: a, to, way }
      return to
    })
    setRound((r) => r + 1)
  }

  // The slide itself: the next photo in from one side as the last goes out the other
  useLayoutEffect(() => {
    const m = moveRef.current
    if (!m) return
    moveRef.current = null
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const off = (k) => `translateX(calc(${k * 100}% + ${k * GAP}px))`
    const opts = { duration: SLIDE, easing: EASE }
    photoRefs.current[m.to]?.animate([{ transform: off(m.way) }, { transform: 'none' }], opts)
    photoRefs.current[m.from]?.animate(
      [
        { transform: 'none', visibility: 'visible' },
        { transform: off(-m.way), visibility: 'visible' },
      ],
      opts,
    )
  }, [at])

  // On by itself, while it's on screen and not under the cursor
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 })
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const running = visible && !paused && !still
  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => go(1), EVERY)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, round])

  return (
    <section
      ref={sectionRef}
      className={`slide${running ? ' is-running' : ''}`}
      aria-label="Photos"
      aria-roledescription="carousel"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="slide__row">
        <button type="button" className="slide__arrow" aria-label="Last photo" onClick={() => go(-1)}>
          ←
        </button>
        <div
          className="slide__frame"
          style={{ '--shape': shapeOf(photos[0]) }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1)
            if (e.key === 'ArrowLeft') go(-1)
          }}
        >
          {photos.map((photo, i) => (
            <figure
              key={photo.src}
              ref={(el) => (photoRefs.current[i] = el)}
              className={`slide__photo${i === at ? ' is-on' : ''}`}
              aria-hidden={i !== at}
            >
              <img src={photo.src} alt={photo.alt} />
            </figure>
          ))}
        </div>
        <button type="button" className="slide__arrow" aria-label="Next photo" onClick={() => go(1)}>
          →
        </button>
      </div>
      <ol className="slide__bars" aria-hidden="true">
        {photos.map((photo, i) => (
          <li key={photo.src} className={i === at ? 'is-on' : ''}>
            {/* (started over whenever the timer is: on each photo, and on going again after
                waiting, as the timer then runs its whole time again) */}
            {i === at && <span key={`${round}-${running}`} style={{ '--every': `${EVERY}ms` }} />}
          </li>
        ))}
      </ol>
    </section>
  )
}
