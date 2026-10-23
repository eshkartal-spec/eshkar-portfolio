import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../data/site'
import './Header.css'

// While the Home page's full-screen photo is behind it, the header is see-through with white text
function useOverHero() {
  const { pathname } = useLocation()
  // The photo is one screen tall, but never under 560px (see .hero)
  const nearTop = () => window.scrollY < Math.max(window.innerHeight, 560) - 80
  const [atTop, setAtTop] = useState(nearTop)
  useEffect(() => {
    const update = () => setAtTop(nearTop())
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return pathname === '/' && atTop
}

export default function Header() {
  const over = useOverHero()
  return (
    <header className={`header wrap${over ? ' header--over' : ''}`}>
      <Link to="/" className="header__name label label--ink">
        <span className="header__dot" aria-hidden="true" />
        {site.name}
      </Link>
      <nav className="header__nav">
        <Link to="/#work" className="label label--ink">Work</Link>
        <Link to="/#about" className="label label--ink">About</Link>
        <a href="#contact" className="label label--ink">Contact</a>
        <a href={site.resume} target="_blank" rel="noreferrer" className="pill header__resume">
          Resume ↗
        </a>
      </nav>
    </header>
  )
}
