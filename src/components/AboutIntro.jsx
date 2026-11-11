import { useEffect, useRef, useState } from 'react'
import './AboutIntro.css'

const SETTLED = 350 // how long after the title's last letter has changed the portrait flies in (ms)
const FROM = 0.88 // the title starts changing when its top is this far down the screen...
const TO = 0.42 // ...and has changed its last letter by the time its top is this far down
// (both moved up, keeping the same distance, where the page starts with it on screen)

// The About section's words. As it scrolls up into view, its title changes letter by
// letter, from a thin, wide, black subtitle style into the heavy pink title font (going
// back as it scrolls away); once the last letter has changed, the paragraphs and then the skills panel rise in (those once), and her portrait
// flies into the empty space on the right like a tossed sheet of paper, and stays (wide
// screens; on phones, between the title and the words).
export default function AboutIntro({ about, skills }) {
  const titleRef = useRef(null)
  const photoRef = useRef(null)
  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [told, setTold] = useState(still)

  // The title's letters, words kept whole (and "I'm Eshkar." on one line)
  const words = about.titleBefore.split(/[\s\u00a0]+/).filter(Boolean)
  const last = words.pop()
  let n = 0
  const letters = (text) =>
    [...text].map((c) => (
      <span key={n} className="intro__letter" style={{ '--k': n++ }}>
        {c}
      </span>
    ))

  useEffect(() => {
    const title = titleRef.current
    const all = [...title.querySelectorAll('.intro__letter')]
    const photo = photoRef.current
    if (still()) {
      all.forEach((el) => el.classList.add('is-set'))
      title.classList.add('is-done')
      photo.classList.add('is-in')
      return
    }
    let raf = 0
    let toldAt = 0
    let landing = 0
    // The portrait flies in just after the title's last letter has changed, while its spot
    // is on screen
    const land = () => {
      if (photo.classList.contains('is-in') || !toldAt || performance.now() - toldAt < SETTLED) return
      const slot = photo.getBoundingClientRect()
      if (slot.bottom > 0 && slot.top < window.innerHeight) photo.classList.add('is-in')
    }
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const r = title.getBoundingClientRect()
      const top = r.top / vh
      // (where the page starts with the title already on screen, as on phones, the
      // change starts from there, so it still happens as you scroll)
      const atStart = (r.top + window.scrollY) / vh - 0.02
      const from = Math.min(FROM, atStart)
      // (and it finishes by the page's end, even if that comes before)
      const atEnd = (r.top + window.scrollY - (document.documentElement.scrollHeight - vh)) / vh + 0.02
      const to = Math.max(0.08, atEnd, from - (FROM - TO))
      const p = Math.min(Math.max((from - top) / (from - to), 0), 1)
      const set = Math.round(p * all.length)
      all.forEach((el, k) => el.classList.toggle('is-set', k < set))
      title.classList.toggle('is-done', set === all.length)
      if (set === all.length) {
        setTold(true)
        if (!toldAt) {
          toldAt = performance.now()
          landing = setTimeout(land, SETTLED + 50)
        }
      }
      land()
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(landing)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className={`about__grid${told ? ' is-told' : ''}`}>
      <h2 ref={titleRef} className="display about__title" aria-label={`${about.titleBefore}${about.titleName}${about.titleAfter}`}>
        <span aria-hidden="true">
          {words.map((w) => (
            <span key={w}>
              <span className="intro__word">{letters(w)}</span>{' '}
            </span>
          ))}
          <span className="intro__word">
            {letters(last)}
            {'\u00a0'}
            {letters(about.titleName)}
            {letters(about.titleAfter)}
          </span>
        </span>
      </h2>
      <figure ref={photoRef} className="intro__photo" aria-hidden="true">
        <img src={about.photo.src} alt="" loading="lazy" />
      </figure>
      <div className="about__text">
        {about.paragraphs.map((t, i) => (
          <p key={t} className="intro__rise" style={{ '--d': i }}>
            {t}
          </p>
        ))}
      </div>

      {/* Full width, under both columns */}
      <details className="skills intro__rise" style={{ '--d': about.paragraphs.length }}>
        <summary className="skills__toggle">
          <span className="label label--ink">Skills & tools</span>
          <span className="skills__icon" aria-hidden="true" />
        </summary>
        <div className="skills__groups">
          {skills.map(({ group, items }) => (
            <div key={group} className="skills__group">
              <p className="label">{group}</p>
              <ul className="skills__list">
                {items.map((s) => (
                  <li key={s} className="pill">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
