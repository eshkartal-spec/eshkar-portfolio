import { useCallback, useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.svg?raw'
import { INTRO_SEEN_KEY } from '../intro'
import './Intro.css'

// ---- Timing (ms) ---------------------------------------------------------
const FIRST_AT = 250 // the K fades in alone
const REST_AT = 1250 // then the other letters unfold out from it
const INK_AT = 2700 // the pink word deepens to black
const LEAVE_AT = 3700 // and the screen dissolves into the site
const DISSOLVE = 900
// -------------------------------------------------------------------------

const SHAPES = 'path, line, polyline, polygon, rect, circle, ellipse'

// A white screen where the logo (src/assets/logo.svg) appears in pink: first the
// letter marked data-first (the K), then the others, each drifting out from it into
// place. The word then turns black and the screen dissolves into the site.
// Click or press any key to skip.
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
    // Each letter knows which side of the first letter it sits on (--side: -1 left,
    // 1 right) and how far away it is (--away), so the others unfold outward from it
    const shapes = [...logoRef.current.querySelectorAll(SHAPES)]
    const first = Math.max(0, shapes.findIndex((el) => el.hasAttribute('data-first')))
    shapes.forEach((el, i) => {
      el.classList.add(i === first ? 'is-first' : 'is-rest')
      el.style.setProperty('--side', Math.sign(i - first))
      el.style.setProperty('--away', Math.abs(i - first))
    })
    const timers = [
      setTimeout(() => setPhase('first'), FIRST_AT),
      setTimeout(() => setPhase('rest'), REST_AT),
      setTimeout(() => setPhase('ink'), INK_AT),
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
