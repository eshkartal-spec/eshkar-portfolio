import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import './Library.css'

const PHONE = '(max-width: 760px)'
const OPEN_DELAY = 90 // rest on a spine this long before it opens, so sweeping across doesn't flicker
const CLOSE_DELAY = 180 // leaving the library closes the open spine after this long

// The Home page's project library: one full-height column per project, like book spines,
// with the name written down the spine over a sliver of the cover photo.
// Opening a spine widens it into the project's card while the others narrow in place,
// and its name turns, grows and glides down to its place in the card.
// Desktop: hover opens. Phones: the spines are horizontal strips; a tap opens one,
// a second tap goes into the project.
export default function Library() {
  const [open, setOpen] = useState(null)
  const listRef = useRef(null)
  const timer = useRef(0)

  const openLater = (i, delay) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(i), delay)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  // Where each name lands: the spot of the (invisible) title inside its card
  useLayoutEffect(() => {
    const list = listRef.current
    const measure = () => {
      for (const spine of list.children) {
        const slot = spine.querySelector('.spine__title')
        spine.style.setProperty('--land-y', `${slot.offsetTop}px`)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [])

  return (
    <section
      id="work"
      ref={listRef}
      className={`library${open !== null ? ' has-open' : ''}`}
      aria-label="Selected work"
      onPointerLeave={(e) => e.pointerType === 'mouse' && openLater(null, CLOSE_DELAY)}
    >
      {projects.map((p, i) => (
        <Link
          key={p.slug}
          to={`/projects/${p.slug}`}
          className={`spine${open === i ? ' is-open' : ''}`}
          style={{ '--i': i }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && openLater(i, OPEN_DELAY)}
          // Keyboard focus opens a spine too (but not the focus that comes with a tap)
          onFocus={(e) => e.currentTarget.matches(':focus-visible') && setOpen(i)}
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
          {/* The name that travels from the spine into the card */}
          <span className="display spine__name" aria-hidden="true">{p.title}</span>
          <span className="spine__card">
            <span className="label spine__field">{p.field}</span>
            <span className="spine__text">
              {/* Marks where the name lands (and is the name itself on phones) */}
              <span className="display spine__title">{p.title}</span>
              <span className="sub spine__summary">{p.summary}</span>
              <span className="label spine__go">View project →</span>
            </span>
          </span>
        </Link>
      ))}
    </section>
  )
}
