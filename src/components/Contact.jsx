import { useEffect, useRef } from 'react'
import { site } from '../data/site'
import { FootLine } from './Footer'
import './Contact.css'

const TITLE = 'Get in touch'

// Closes every page. As the footer comes into view, its title's letters, drawn first as
// pink outlines, fill in one after another from the left (each from the bottom up); once
// the footer has gone back below the screen they empty again, so it plays each time.
export default function Contact() {
  const { contact } = site
  const titleRef = useRef(null)

  useEffect(() => {
    const title = titleRef.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      title.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) title.classList.add('is-in')
        // (only reset once it's below the screen again, not when scrolled past above)
        else if (e.boundingClientRect.top > 0) title.classList.remove('is-in')
      },
      { threshold: 0.6 },
    )
    io.observe(title)
    return () => io.disconnect()
  }, [])

  let n = 0
  return (
    <footer id="contact" className="contact wrap">
      <h2 ref={titleRef} className="display contact__title" aria-label={TITLE}>
        {TITLE.split(' ').map((word, w) => (
          <span key={w} aria-hidden="true">
            {w > 0 && ' '}
            <span className="contact__word">
              {[...word].map((c) => (
                <span key={n} className="contact__letter" style={{ '--i': n++ }}>
                  {c}
                </span>
              ))}
            </span>
          </span>
        ))}
      </h2>

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
