import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { shapeOf } from './photoShape'
import './WheelGallery.css'

// ---- How the wheel turns ----
const SPACING = 0.8 // how far apart the photos sit on the rim, in photo widths: the next and last peek in at the sides
const SPACING_NARROW = 1.08 // ...on phones, where the photo takes most of the width
const FLY = 950 // ms: opening, the photo picked moves from its place on the page into the middle
const ARRIVE = 520 // ms: ...and the rest of the wheel appears around it from about here
const TURN = 800 // ms: turning to the next or last photo
const SWIPE = 40 // px a finger must move sideways to turn the wheel
// -----------------------------

const mod = (a, n) => ((a % n) + n) % n

// All the photos in a full-screen gallery, set around the rim of a big wheel whose
// centre sits far below the screen, so the photo on top stands upright in the middle and
// its neighbours lean away along the rim at either side. Opening, the photo picked moves
// from where it was on the page (`from`: its place on screen) into the middle as the
// screen darkens, and the rest of the wheel appears around it. The arrows (or the arrow
// keys, or a swipe) turn the wheel one photo on or back, round and round. ✕ (or Escape)
// closes it, back to where it was opened. Photos with a `note` show its words under them.
export default function WheelGallery({ items, start, from, onClose }) {
  const n = items.length
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // The turn the wheel is at, in photos: counted on past the last one and back, so it
  // always turns the short way
  const [at, setAt] = useState(start)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [arriving, setArriving] = useState(!still && !!from)
  const closeRef = useRef(null)
  const flyRef = useRef(null)
  const shown = mod(at, n)

  // The photos' frame: as large as fits, leaving room for the controls and the words
  useLayoutEffect(() => {
    const measure = () => {
      const h = Math.min(window.innerHeight * 0.66, 860)
      setSize({ w: Math.min(window.innerWidth * 0.78, h * 1.5), h })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // In: the photo picked starts exactly over where it was on the page (moved and scaled
  // there), then glides to its place in the middle; the rest come in a moment later
  const flown = useRef(false)
  useLayoutEffect(() => {
    const img = flyRef.current
    if (flown.current || !size.w || !img) return
    flown.current = true
    if (!arriving) return
    const slot = img.getBoundingClientRect()
    const shape = shapeOf(items[start])
    const w = shape > slot.width / slot.height ? slot.width : slot.height * shape
    const dx = from.left + from.width / 2 - (slot.left + slot.width / 2)
    const dy = from.top + from.height / 2 - (slot.top + slot.height / 2)
    img.style.transition = 'none'
    img.style.transform = `translate(${dx}px, ${dy}px) scale(${from.width / w})`
    img.getBoundingClientRect()
    img.style.transition = `transform ${FLY}ms cubic-bezier(0.5, 0, 0.12, 1)`
    img.style.transform = ''
  }, [size.w, from, items, start, arriving])

  useEffect(() => {
    if (!arriving) return
    const t = setTimeout(() => setArriving(false), ARRIVE)
    return () => clearTimeout(t)
  }, [arriving])

  // The page stays put behind it; focus goes to ✕, and back to the photo after
  useEffect(() => {
    const before = document.activeElement
    const html = document.documentElement
    html.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setAt((a) => a + 1)
      if (e.key === 'ArrowLeft') setAt((a) => a - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      before?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  // A sideways swipe turns it
  const swipe = useRef(null)
  const onDown = (e) => (swipe.current = e.clientX)
  const onUp = (e) => {
    if (swipe.current === null) return
    const d = e.clientX - swipe.current
    swipe.current = null
    if (Math.abs(d) > SWIPE) setAt((a) => a + (d < 0 ? 1 : -1))
  }

  // The wheel: one photo every `step` degrees, all the way round, on a rim big enough
  // to fit them SPACING photo widths apart
  const step = 360 / n
  const radius = (n * size.w * (window.innerWidth < 640 ? SPACING_NARROW : SPACING)) / (2 * Math.PI)
  const note = items[shown].note

  return createPortal(
    <div
      className={`wheel${arriving ? ' is-arriving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Photos of STEP UP"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => (swipe.current = null)}
      style={{ '--w': `${size.w}px`, '--h': `${size.h}px`, '--time': `${still ? 0 : TURN}ms` }}
    >
      <div className="wheel__hub" style={{ '--r': `${radius}px`, transform: `rotate(${-at * step}deg)` }}>
        {items.map((item, i) => {
          // How far round from the photo on top, either way (0 is on top)
          const off = Math.abs(mod(i - at + n / 2, n) - n / 2)
          return (
            <figure
              key={item.src}
              className={`wheel__photo${off < 0.5 ? ' is-on' : ''}`}
              style={{ transform: `rotate(${i * step}deg) translateY(calc(var(--r) * -1))`, '--off': Math.min(off, 3) }}
              aria-hidden={off >= 0.5}
            >
              <span ref={i === start ? flyRef : undefined} className="wheel__fly">
                <img src={item.src} alt={item.alt} decoding="async" />
              </span>
            </figure>
          )
        })}
      </div>

      <div className="wheel__words" aria-live="polite">
        <p className="label wheel__count">
          {String(shown + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </p>
        {note && (
          <p className="wheel__note">
            <span className="wheel__title">{note.title}</span> {note.text}
          </p>
        )}
      </div>

      <button type="button" className="wheel__arrow wheel__arrow--back" onClick={() => setAt((a) => a - 1)} aria-label="Last photo" />
      <button type="button" className="wheel__arrow wheel__arrow--on" onClick={() => setAt((a) => a + 1)} aria-label="Next photo" />
      <button ref={closeRef} type="button" className="wheel__close" onClick={onClose} aria-label="Close the gallery" />
    </div>,
    document.body,
  )
}
