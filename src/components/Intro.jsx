import { useCallback, useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.svg?raw'
import { INTRO_SEEN_KEY } from '../intro'
import './Intro.css'

// ---- Timing (ms) ---------------------------------------------------------
// The K is there from the first frame
const REST_AT = 700 // the other letters come softly into focus where they stand
const PINK_AT = 1350 // a soft pink sweep crosses the word, left to right, as it settles
const LEAVE_AT = 2750 // the word fades away and the white lifts like a curtain
const OUT = 1200 // how long the exit takes
// -------------------------------------------------------------------------

const SHAPES = 'path, line, polyline, polygon, rect, circle, ellipse'

// The logo split into three stacked copies: the leading letter (marked data-first,
// the K), the other letters, and the whole word in pink for the sweep
function layers() {
  const svg = new DOMParser().parseFromString(logo, 'image/svg+xml').documentElement
  const shapes = [...svg.querySelectorAll(SHAPES)]
  const first = Math.max(0, shapes.findIndex((el) => el.hasAttribute('data-first')))
  const only = (keep) => {
    const copy = svg.cloneNode(true)
    ;[...copy.querySelectorAll(SHAPES)].forEach((el, i) => !keep(i) && el.remove())
    return new XMLSerializer().serializeToString(copy)
  }
  return {
    first: only((i) => i === first),
    rest: only((i) => i !== first),
    pink: only(() => true),
  }
}
const LOGO = layers()

// A white screen, filmed: the whole word drifts slowly closer the entire time. The K
// is already there; the rest of the word comes softly into focus around it, in black.
// A pink sweep passes across it, then the word fades away and the white lifts off the
// site like a curtain. Click or press any key to skip.
export default function Intro({ onDone }) {
  const [phase, setPhase] = useState('wait')
  const leaving = useRef(false)

  const leave = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    setPhase('out')
    // Lets the page underneath start its entrance as the curtain lifts
    delete document.documentElement.dataset.intro
    setTimeout(onDone, OUT)
  }, [onDone])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      /* private mode: it will simply play again next time */
    }
    const timers = [
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
    <div className={`intro is-${phase}`} aria-hidden="true">
      <div className="intro__curtain" />
      <div className="intro__stage">
        {/* The black word; the sweep wipes it away exactly as the pink wipes in */}
        <div className="intro__black">
          <div className="intro__layer intro__layer--first" dangerouslySetInnerHTML={{ __html: LOGO.first }} />
          <div className="intro__layer intro__layer--rest" dangerouslySetInnerHTML={{ __html: LOGO.rest }} />
        </div>
        <div className="intro__layer intro__layer--pink" dangerouslySetInnerHTML={{ __html: LOGO.pink }} />
      </div>
    </div>
  )
}
