import { site } from '../data/site'
import './Contact.css'

const year = new Date().getFullYear()

// Closes every page
export default function Contact() {
  const { contact } = site
  return (
    <footer id="contact" className="contact wrap">
      <h2 className="display contact__title">Get in touch</h2>

      {/* Three columns, each a small label over its value, all starting on the same line */}
      <dl className="contact__details">
        <div>
          <dt className="label">Email</dt>
          <dd><a href={`mailto:${contact.email}`} className="contact__value">{contact.email}</a></dd>
        </div>
        <div>
          <dt className="label">Phone</dt>
          <dd><a href={contact.phoneLink} className="contact__value">{contact.phone}</a></dd>
        </div>
        <div>
          <dt className="label">Elsewhere</dt>
          <dd className="contact__pills">
            {/* Without a link yet the button shows but goes nowhere (see contact.instagram) */}
            <a href={contact.instagram ?? undefined} target="_blank" rel="noreferrer" className="pill">
              Instagram ↗
            </a>
            <a href={site.resume} target="_blank" rel="noreferrer" className="pill">Resume ↗</a>
          </dd>
        </div>
      </dl>

      <div className="contact__foot">
        <span className="label">{site.name} © {year}</span>
        <a href="#top" className="label" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
