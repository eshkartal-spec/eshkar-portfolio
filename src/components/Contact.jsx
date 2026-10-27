import { site } from '../data/site'
import { FootLine } from './Footer'
import './Contact.css'

// Closes every page
export default function Contact() {
  const { contact } = site
  return (
    <footer id="contact" className="contact wrap">
      <h2 className="display contact__title">Get in touch</h2>

      {/* Email, phone and the buttons on one line */}
      <div className="contact__details">
        <p className="contact__value">{contact.email}</p>
        <p className="contact__value">{contact.phone}</p>
        <div className="contact__pills">
          {/* Without a link yet the button shows but goes nowhere (see contact.instagram) */}
          <a href={contact.instagram ?? undefined} target="_blank" rel="noreferrer" className="pill">
            Instagram ↗
          </a>
          <a href={site.resume} target="_blank" rel="noreferrer" className="pill">Resume ↗</a>
        </div>
      </div>

      <div className="contact__foot">
        <FootLine />
      </div>
    </footer>
  )
}
