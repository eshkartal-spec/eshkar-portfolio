import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.svg?raw'
import { site } from '../data/site'
import './Header.css'

const IDLE = 1000 // ms without scrolling before the header slips away
const ZONE = 90 // px from the top of the screen where the pointer brings it back

// How the header looks on the Home page's first screen:
// - with the project library there, it stays out of sight until the page scrolls past it
// - with the hero photo there, it's see-through over the photo's pale top until the page scrolls
function useHeaderMode() {
  const { pathname } = useLocation()
  const scrolled = () => window.scrollY
  const [y, setY] = useState(scrolled)
  useEffect(() => {
    const update = () => setY(scrolled())
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  if (pathname !== '/') return ''
  if (site.showHero) return y < 24 ? ' header--over' : ''
  return y < window.innerHeight - 120 ? ' header--hidden' : ''
}

// Everywhere: the header slips away after a second without scrolling, and comes back
// while scrolling, while the pointer is near the top of the screen, or while it has
// keyboard focus
function useAwake(headerRef) {
  const [awake, setAwake] = useState(true)
  useEffect(() => {
    let timer = 0
    let held = false // pointer in the top zone, or focus inside the header
    const sleepSoon = () => {
      clearTimeout(timer)
      timer = setTimeout(() => !held && setAwake(false), IDLE)
    }
    const wake = () => {
      setAwake(true)
      sleepSoon()
    }
    const onMove = (e) => {
      const inZone = e.clientY < ZONE
      if (inZone === held) return
      held = inZone
      if (held) setAwake(true)
      else sleepSoon()
    }
    const header = headerRef.current
    const onFocusIn = () => {
      held = true
      setAwake(true)
    }
    const onFocusOut = () => {
      held = false
      sleepSoon()
    }
    sleepSoon()
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    header.addEventListener('focusin', onFocusIn)
    header.addEventListener('focusout', onFocusOut)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('pointermove', onMove)
      header.removeEventListener('focusin', onFocusIn)
      header.removeEventListener('focusout', onFocusOut)
    }
  }, [headerRef])
  return awake
}

export default function Header() {
  const ref = useRef(null)
  const mode = useHeaderMode()
  const awake = useAwake(ref)
  return (
    <header ref={ref} className={`header wrap${mode}${awake ? '' : ' header--asleep'}`}>
      {/* Her wordmark, the same as in the intro (src/assets/logo.svg) */}
      <Link
        to="/"
        className="header__logo"
        aria-label={site.name}
        dangerouslySetInnerHTML={{ __html: logo }}
      />
      <nav className="header__nav">
        <Link to="/#work" className="label label--ink">Work</Link>
        <Link to="/#about" className="label label--ink">About</Link>
        <Link to="/#contact" className="label label--ink">Contact</Link>
        <a href={site.resume} target="_blank" rel="noreferrer" className="pill header__resume">
          Resume ↗
        </a>
      </nav>
    </header>
  )
}
