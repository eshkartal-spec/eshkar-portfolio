import { useCallback, useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.svg?raw'
import { INTRO_SEEN_KEY } from '../intro'
import './Intro.css'

// ---- Timing (ms) ---------------------------------------------------------
const START = 250 // short pause on the dark screen before the outline starts
const TRACE = 950 // each letter's outline is traced in this long
const STAGGER = 110 // each letter starts this much after the one before
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
    // Every shape is traced in the same time, whatever its real length, one after
    // another in the file's order; shapes that had no fill in the logo stay as lines
    const shapes = [...logoRef.current.querySelectorAll(SHAPES)]
    shapes.forEach((el, i) => {
      el.setAttribute('pathLength', '1')
      el.style.setProperty('--n', i)
      el.dataset.fill = getComputedStyle(el).fill === 'none' ? 'none' : 'solid'
    })
    const traced = START + (shapes.length - 1) * STAGGER + TRACE
    const timers = [
      setTimeout(() => setPhase('fill'), traced - 250), // fill in as the last letter finishes
      setTimeout(leave, traced + 650), // then the screen dissolves
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
    <div
      className={`intro is-${phase}`}
      style={{
        '--start': `${START}ms`,
        '--trace': `${TRACE}ms`,
        '--stagger': `${STAGGER}ms`,
        '--dissolve': `${DISSOLVE}ms`,
      }}
      aria-hidden="true"
    >
      <div ref={logoRef} className="intro__logo" dangerouslySetInnerHTML={{ __html: logo }} />
    </div>
  )
}
