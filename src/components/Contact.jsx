import { site } from '../data/site'
import './Contact.css'

// Closes every page
export default function Contact() {
  const { contact } = site
  return (
    <footer id="contact" className="contact wrap">
      <div className="contact__top">
        <p className="label">Contact</p>
        <h2 className="display contact__title">Get in touch</h2>
      </div>

      <div className="contact__grid">
        <p className="contact__pitch">{contact.pitch}</p>
        <div className="contact__links">
          <a href={`mailto:${contact.email}`} className="contact__email">{contact.email}</a>
          <div className="contact__pills">
            <a href={`mailto:${contact.email}`} className="pill">Email</a>
            <a href={contact.phoneLink} className="pill">{contact.phone}</a>
            <a href={site.resume} target="_blank" rel="noreferrer" className="pill">Resume ↗</a>
          </div>
        </div>
      </div>

      <div className="contact__foot">
        <span className="label">{site.name} © {new Date().getFullYear()}</span>
        <a href="#top" className="label" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
