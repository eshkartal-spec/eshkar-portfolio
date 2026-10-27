import { useCallback, useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.svg?raw'
import { INTRO_SEEN_KEY } from '../intro'
import './Intro.css'

// ---- Timing (ms) ---------------------------------------------------------
const FIRST_AT = 250 // the K fades in alone
const REST_AT = 1250 // then the other letters fade in, in place
const PINK_AT = 2600 // the black word turns pink
const LEAVE_AT = 3350 // and the screen dissolves into the site
const DISSOLVE = 900
// -------------------------------------------------------------------------

const SHAPES = 'path, line, polyline, polygon, rect, circle, ellipse'

// A white screen where the logo (src/assets/logo.svg) appears in black: first the
// letter marked data-first (the K), then the others in their places. The word then
// turns pink and the screen dissolves into the site. Click or press any key to skip.
export default function Intro({ onDone }) {
  const [phase, setPhase] = useState('wait')
  const logoRef = useRef(null)
  const leaving = useRef(false)

  const leave = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    setPhase('out')
    // Lets the page underneath start its entrance while the screen dissolves
    delete document.documentElement.dataset.intro
    setTimeout(onDone, DISSOLVE)
  }, [onDone])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      /* private mode: it will simply play again next time */
    }
    // The letter marked data-first (or the first shape) leads; the others follow together
    const shapes = [...logoRef.current.querySelectorAll(SHAPES)]
    const first = Math.max(0, shapes.findIndex((el) => el.hasAttribute('data-first')))
    shapes.forEach((el, i) => el.classList.add(i === first ? 'is-first' : 'is-rest'))
    const timers = [
      setTimeout(() => setPhase('first'), FIRST_AT),
      setTimeout(() => setPhase('rest'), REST_AT),
      setTimeout(() => setPhase('pink'), PINK_AT),
      setTimeout(leave, LEAVE_AT),
    ]
    window.addEventListener('pointerdown', leave)
    window.addEventListener('keydown', leave)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('pointerdown', leave)
      window.removeEventListener('keydown', leave)
    }
  }, [leave])

  return (
    <div className={`intro is-${phase}`} style={{ '--dissolve': `${DISSOLVE}ms` }} aria-hidden="true">
      <div ref={logoRef} className="intro__logo" dangerouslySetInnerHTML={{ __html: logo }} />
    </div>
  )
}
