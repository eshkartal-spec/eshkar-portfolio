import { useRef, useState } from 'react'
import './DetailRow.css'

const GAP = 18 // px between the cursor and the tooltip

// Photos in a row. Over a photo, its title and words follow the cursor in a tooltip; on
// touch screens (no cursor) they sit under the photo instead.
export default function DetailRow({ items }) {
  const tipRef = useRef(null)
  const [shown, setShown] = useState(0) // the item whose words are in the tooltip
  const [on, setOn] = useState(false)

  // Beside the cursor, flipped to its other side near the screen's right or bottom edge
  const follow = (e) => {
    const tip = tipRef.current
    const x = e.clientX + GAP + tip.offsetWidth > window.innerWidth ? e.clientX - GAP - tip.offsetWidth : e.clientX + GAP
    const y = e.clientY + GAP + tip.offsetHeight > window.innerHeight ? e.clientY - GAP - tip.offsetHeight : e.clientY + GAP
    tip.style.transform = `translate(${x}px, ${y}px)`
  }

  return (
    <section className="details wrap">
      <div className="details__row">
        {items.map((d, n) => (
          <figure
            key={d.image.src}
            className="details__item"
            onMouseEnter={(e) => {
              setShown(n)
              setOn(true)
              follow(e)
            }}
            onMouseMove={follow}
            onMouseLeave={() => setOn(false)}
          >
            <img src={d.image.src} alt={d.image.alt} loading="lazy" />
            <figcaption className="details__caption">
              <span className="details__title">{d.title}</span>
              <span className="details__text">{d.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div ref={tipRef} className={`details__tip${on ? ' is-on' : ''}`} aria-hidden="true">
        <span className="details__title">{items[shown].title}</span>
        <span className="details__text">{items[shown].text}</span>
      </div>
    </section>
  )
}
