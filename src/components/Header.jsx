import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../data/site'
import './Header.css'

// At the very top of the Home page the header is see-through over the photo's pale top.
// It turns solid as soon as the page scrolls, so its black text never lands on a dark part.
function useOverHero() {
  const { pathname } = useLocation()
  const nearTop = () => window.scrollY < 24
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
  return site.showHero && pathname === '/' && atTop
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
