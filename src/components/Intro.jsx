import { useCallback, useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.svg?raw'
import { INTRO_SEEN_KEY } from '../intro'
import './Intro.css'

// ---- Timing (ms) ---------------------------------------------------------
const START = 250 // short pause on the dark screen before the outline starts
const DRAW = 1400 // the logo's outline is traced
const FILL_AT = START + DRAW - 250 // the shapes fill in as the tracing finishes
const LEAVE_AT = START + DRAW + 650 // screen starts dissolving
const DISSOLVE = 800
// -------------------------------------------------------------------------

const SHAPES = 'path, line, polyline, polygon, rect, circle, ellipse'

// A dark screen where the logo (src/assets/logo.svg) is traced in pink, filled in,
// then dissolves to reveal the site. Works with any SVG logo made of shapes.
// Click or press any key to skip.
export default function Intro({ onDone }) {
  const [phase, setPhase] = useState('draw')
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
    // Every shape is traced with the same speed, whatever its real length;
    // shapes that had no fill in the logo stay as lines
    for (const el of logoRef.current.querySelectorAll(SHAPES)) {
      el.setAttribute('pathLength', '1')
      el.dataset.fill = getComputedStyle(el).fill === 'none' ? 'none' : 'solid'
    }
    const timers = [setTimeout(() => setPhase('fill'), FILL_AT), setTimeout(leave, LEAVE_AT)]
    window.addEventListener('pointerdown', leave)
    window.addEventListener('keydown', leave)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('pointerdown', leave)
      window.removeEventListener('keydown', leave)
    }
  }, [leave])

  return (
    <div
      className={`intro is-${phase}`}
      style={{ '--start': `${START}ms`, '--draw': `${DRAW}ms`, '--dissolve': `${DISSOLVE}ms` }}
      aria-hidden="true"
    >
      <div ref={logoRef} className="intro__logo" dangerouslySetInnerHTML={{ __html: logo }} />
    </div>
  )
}
