import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import './Library.css'

const PHONE = '(max-width: 760px)'

// The Home page's project library: one narrow column per project, like book spines,
// with the name written down the spine over a sliver of the cover photo.
// Hovering a spine opens it into the project's card while the others narrow in place.
// On phones the spines become horizontal strips: a tap opens one, a second tap goes in.
export default function Library() {
  const [open, setOpen] = useState(null)

  return (
    <section id="work" className="library" aria-label="Selected work">
      {projects.map((p, i) => (
        <Link
          key={p.slug}
          to={`/projects/${p.slug}`}
          className={`spine${open === i ? ' is-open' : ''}`}
          style={{ '--i': i }}
          onClick={(e) => {
            if (open !== i && window.matchMedia(PHONE).matches) {
              e.preventDefault()
              setOpen(i)
            }
          }}
        >
          <img
            className="spine__photo"
            src={p.cover.src}
            alt=""
            style={p.cover.position && { objectPosition: p.cover.position }}
          />
          <span className="display spine__name">{p.title}</span>
          <span className="spine__card">
            <span className="label spine__field">{p.field}</span>
            <span className="spine__text">
              <span className="display spine__title">{p.title}</span>
              <span className="sub spine__summary">{p.summary}</span>
            </span>
            <span className="label spine__go">View project →</span>
          </span>
        </Link>
      ))}
    </section>
  )
}
