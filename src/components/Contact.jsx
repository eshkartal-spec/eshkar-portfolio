import { site } from '../data/site'
import './Contact.css'

const year = new Date().getFullYear()

// Closes every page
export default function Contact() {
  const { contact } = site
  return (
    <footer id="contact" className="contact wrap">
      <h2 className="display contact__title">Get in touch</h2>

      <div className="contact__links">
        <div className="contact__direct">
          <a href={`mailto:${contact.email}`} className="contact__email">{contact.email}</a>
          <a href={contact.phoneLink} className="contact__phone">{contact.phone}</a>
        </div>
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
