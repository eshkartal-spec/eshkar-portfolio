import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../data/site'
import './Header.css'

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

export default function Header() {
  const mode = useHeaderMode()
  return (
    <header className={`header wrap${mode}`}>
      <Link to="/" className="header__name label label--ink">
        <span className="header__dot" aria-hidden="true" />
        {site.name}
      </Link>
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
