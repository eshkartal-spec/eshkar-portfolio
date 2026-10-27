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
        {/* Her R mark (src/assets/R_logo.svg) */}
        <svg className="header__mark" viewBox="0 0 353 484" aria-hidden="true">
          <path d="M236.936 252.371L353 484H271.961L124.119 205.472L130.952 203.189C130.952 203.189 135.506 206.613 147.656 210.886C159.805 215.158 171.006 215.726 180.621 215.726C230.068 215.726 256.165 179.771 256.165 140.36C255.479 100.257 227.321 64.3028 166.885 64.3028H74.1712V484H0V0H183.368C278.829 0 331.023 62.2286 331.023 133.446C331.023 189.451 296.685 236.469 236.936 252.371Z" />
        </svg>
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
