import { useEffect, useRef } from 'react'
import { shapeOf } from './photoShape'
import './PhotoSlide.css'

// ---- Pace ----
const SLIDE = 520 // pixels of scrolling per photo
const SETTLE = 160 // ms after the scrolling stops, it settles on the nearest photo
const FOLLOW = 0.14 // how quickly the photos catch up with the scroll (0–1)
// --------------

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// Photos side by side in a frame that stays on screen while you scroll through the
// section: scrolling down slides them along to the side, one photo at a time, the next
// coming in from the right as the last goes out to the left.
export default function PhotoSlide({ photos }) {
  const trackRef = useRef(null)
  const stripRef = useRef(null)
  const countRef = useRef(null)
  const n = photos.length

  useEffect(() => {
    const track = trackRef.current
    const strip = stripRef.current
    let target = 0
    let pos = 0
    let raf = 0
    let settle = 0
    let shown = -1
    const scrolled = () => clamp(-track.getBoundingClientRect().top / SLIDE, 0, n - 1)
    const read = () => {
      target = scrolled()
      clearTimeout(settle)
      settle = setTimeout(() => (target = Math.round(scrolled())), SETTLE)
    }
    const draw = () => {
      pos += (target - pos) * FOLLOW
      if (Math.abs(target - pos) < 0.001) pos = target
      strip.style.setProperty('--pos', pos.toFixed(4))
      const on = Math.round(pos)
      if (on !== shown) {
        shown = on
        countRef.current.textContent = `${String(on + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`
      }
      raf = requestAnimationFrame(draw)
    }
    // Only while the section is on screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (!e.isIntersecting) return
      read()
      pos = target
      raf = requestAnimationFrame(draw)
    })
    io.observe(track)
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(settle)
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [n])

  return (
    <section ref={trackRef} className="slide" style={{ height: `calc(${(n - 1) * SLIDE}px + 100svh)` }} aria-label="Photos">
      <div className="slide__view">
        <div className="slide__frame" style={{ '--shape': shapeOf(photos[0]) }}>
          <div ref={stripRef} className="slide__strip">
            {photos.map((photo, i) => (
              <figure key={photo.src} className="slide__photo" style={{ '--i': i }}>
                <img src={photo.src} alt={photo.alt} loading={i < 2 ? 'eager' : 'lazy'} />
              </figure>
            ))}
          </div>
        </div>
        <p ref={countRef} className="label slide__count" aria-hidden="true" />
      </div>
    </section>
  )
}
