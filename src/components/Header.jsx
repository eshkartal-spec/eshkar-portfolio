import { Link } from 'react-router-dom'
import { site } from '../data/site'
import './Header.css'

export default function Header() {
  return (
    <header className="header wrap">
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
