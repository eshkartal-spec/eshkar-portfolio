import { site } from '../data/site'
import './Contact.css'

const year = new Date().getFullYear()

// Closes every page
export default function Contact() {
  const { contact } = site
  return (
    <footer id="contact" className="contact wrap">
      <h2 className="display contact__title">Get in touch</h2>

      {/* Email, phone and the buttons on one line */}
      <div className="contact__details">
        <a href={`mailto:${contact.email}`} className="contact__value">{contact.email}</a>
        <a href={contact.phoneLink} className="contact__value">{contact.phone}</a>
        <div className="contact__pills">
          {/* Without a link yet the button shows but goes nowhere (see contact.instagram) */}
          <a href={contact.instagram ?? undefined} target="_blank" rel="noreferrer" className="pill">
            Instagram ↗
          </a>
          <a href={site.resume} target="_blank" rel="noreferrer" className="pill">Resume ↗</a>
        </div>
      </div>

      <div className="contact__foot">
        <span className="label">{site.name} © {year}</span>
        <a href="#top" className="label" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
