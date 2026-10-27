import { site } from '../data/site'
import './Footer.css'

const year = new Date().getFullYear()

// Back to the top of the page, smoothly. Pages that move without scrolling (the Step Up
// climb on touch screens) hear about it first, as a "back-to-top" event.
function backToTop() {
  window.dispatchEvent(new Event('back-to-top'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// The last line of every page: her name and the year, and a way back up. The Home page
// has it at the bottom of its contact section (Contact.jsx); other pages, on its own.
export function FootLine() {
  return (
    <div className="foot-line">
      <span className="label">{site.name} © {year}</span>
      <button type="button" className="label foot-line__top" onClick={backToTop}>
        Back to top ↑
      </button>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="footer wrap">
      <FootLine />
    </footer>
  )
}
