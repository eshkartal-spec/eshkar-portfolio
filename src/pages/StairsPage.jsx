import { useEffect, useMemo, useRef } from 'react'
import NextProject from '../components/NextProject'
import './StairsPage.css'

// ---- Pace (in pixels of scrolling: one mouse-wheel tick is about 100) ----
const OPENING = 400 // walking into the opening photo
const STEP = 100 // climbing one step: one tick, one step
const ARRIVE = 400 // past the top step: the next project fades in over the stairs
const SETTLE = 140 // ms after the scrolling stops, the camera settles on the nearest step
const FOLLOW = 0.12 // how quickly the camera catches up (0–1): each step glides
// --------------------------------------------------------------------------
const AHEAD = 9 // steps visible ahead before they fade into the distance
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// The climb, bottom to top: one entry per step. The risers carry words, painted on the
// part of the flight clear of the climber; only "Behind the product" has photos, painted
// across several risers like an ad printed up a flight of stairs. (The title and summary
// are on the opening photo's steps, before the climb.)
function buildSteps(p) {
  const steps = [
    // The details, on the first steps
    { kind: 'specs', items: [['Type', p.type], ['Year', p.year], ['Duration', p.duration]] },
    { kind: 'specs', items: [['Tools', p.tools]] },
    {},
    // The problem
    { kind: 'statement', text: p.pull },
    {},
  ]

  // One landing per feature: its name, then its description
  p.features.forEach((f) => {
    steps.push({ kind: 'feature-title', text: f.title }, { kind: 'feature-text', text: f.text }, {})
  })

  // Behind the product: its photos side by side across four risers
  steps.push({ kind: 'heading', text: 'Behind the product' })
  for (let j = 0; j < 4; j++) steps.push({ row: p.process.map((s) => ({ image: s.image, j, count: 4 })) })
  steps.push({ kind: 'captions', items: p.process.map((s) => s.label) })
  steps.push({}) // the top landing
  return steps
}

// One band of a photo spread over `count` risers (index j from the bottom-most riser
// of the group, so the photo reads the right way up as you climb)
function Slice({ image, j, count }) {
  return (
    <span className="riser__slice" style={{ '--n': count, '--j': count - 1 - j }}>
      <span className="riser__photo" style={{ backgroundImage: `url("${image.src}")` }} data-src={image.src} />
    </span>
  )
}

function Riser({ step }) {
  return (
    <div className={`riser${step.kind ? ` riser--${step.kind}` : ''}`}>
      {step.row && (
        <span className="riser__row">
          {step.row.map((s) => <Slice key={s.image.src} {...s} />)}
        </span>
      )}
      {step.kind === 'specs' && (
        <span className="riser__specs">
          {step.items.map(([k, v]) => (
            <span key={k} className="riser__spec">
              <span className="label">{k}</span>
              <span className="riser__value">{v}</span>
            </span>
          ))}
        </span>
      )}
      {step.kind === 'statement' &&<span className="sub riser__statement">{step.text}</span>}
      {step.kind === 'feature-title' && <span className="riser__left riser__feature-title">{step.text}</span>}
      {step.kind === 'feature-text' && <span className="riser__left riser__feature-text">{step.text}</span>}
      {step.kind === 'heading' && <span className="display painted riser__heading">{step.text}</span>}
      {step.kind === 'captions' && (
        <span className="riser__captions">
          {step.items.map((c) => <span key={c} className="label">{c}</span>)}
        </span>
      )}
    </div>
  )
}

// The opening: a full-screen photo of real stairs with the title and summary painted
// on its bottom steps (wide on landscape screens, tall on portrait ones). The words are
// in the photo, so they're also here, hidden, for screen readers and search engines.
function Opening({ project }) {
  const { wide, tall } = project.stairs.opening
  return (
    <div className="opening">
      <picture>
        <source media="(orientation: portrait)" srcSet={tall.src} />
        <img className="opening__photo" src={wide.src} alt={wide.alt} />
      </picture>
      <h1 className="visually-hidden">{project.title}</h1>
      <p className="visually-hidden">{project.summary}</p>
    </div>
  )
}

// Step Up's page: a staircase you climb by scrolling. It opens on a full-screen photo
// of real stairs with the title on them; the first few scroll ticks walk into the photo,
// which gives way to a 3D concrete flight. From there each tick climbs one step, with
// text and photos painted on the risers (the steps' fronts), while someone carrying the
// bike stands on the flight in front of them. Past the top step the next project fades
// in over the stairs.
export default function StairsPage({ project, next }) {
  const steps = useMemo(() => buildSteps(project), [project])
  const trackRef = useRef(null)
  const viewRef = useRef(null)
  const flightRef = useRef(null)
  const nextRef = useRef(null)

  // Each photo's shape, so its bands can be cropped like object-fit: cover
  useEffect(() => {
    const seen = new Map()
    for (const el of flightRef.current.querySelectorAll('.riser__photo')) {
      const src = el.dataset.src
      if (!seen.has(src)) {
        seen.set(src, new Promise((resolve) => {
          const im = new Image()
          im.onload = () => resolve(im.naturalWidth / im.naturalHeight)
          im.onerror = () => resolve(1.5)
          im.src = src
        }))
      }
      seen.get(src).then((ar) => el.style.setProperty('--ar', ar))
    }
  }, [steps])

  // The camera: follows the scroll with easing, so each step glides, and settles on
  // the nearest step once the scrolling stops. --q is the walk into the opening photo
  // (0–1), --p the position on the flight in steps, --climb how far up the flight
  // (0–1) and --arrive how far the next project has faded in (0–1).
  useEffect(() => {
    const track = trackRef.current
    const view = viewRef.current
    const flight = flightRef.current
    const nextEl = nextRef.current
    const stepEls = [...flight.children]
    const html = document.documentElement
    const top = stepEls.length - 1
    const topY = OPENING + top * STEP // scroll position at the top step
    let target = 0
    let pos = 0
    let raf = 0
    let settle = 0
    let lastY = 0
    let goingUp = false // scrolling back toward the top of the page
    const scrolled = () => Math.max(0, -track.getBoundingClientRect().top)
    const nearestStep = (y) => {
      if (y <= OPENING) return y
      // Past the top step the next project finishes fading in, or fades back out,
      // depending on which way the page was last scrolled
      if (y > topY) return goingUp ? topY : topY + ARRIVE
      return OPENING + Math.round((y - OPENING) / STEP) * STEP
    }
    const read = () => {
      const y = scrolled()
      if (y !== lastY) goingUp = y < lastY
      lastY = y
      target = y > topY && !goingUp ? topY + ARRIVE : y
      clearTimeout(settle)
      settle = setTimeout(() => (target = nearestStep(scrolled())), SETTLE)
    }
    const frame = () => {
      pos += (target - pos) * FOLLOW
      if (Math.abs(target - pos) < 0.05) pos = target
      const q = clamp(pos / OPENING, 0, 1)
      const p = clamp((pos - OPENING) / STEP, 0, top)
      view.style.setProperty('--q', q.toFixed(4))
      view.style.setProperty('--climb', (p / top).toFixed(4))
      const arrive = clamp((pos - topY) / ARRIVE, 0, 1)
      view.style.setProperty('--arrive', arrive.toFixed(4))
      nextEl.style.visibility = arrive > 0 ? 'visible' : 'hidden'
      flight.style.setProperty('--p', p.toFixed(4))
      // The top bar stays out of the way over the opening photo
      if (q < 0.9) html.dataset.headerHidden = ''
      else delete html.dataset.headerHidden
      // Steps below the camera drop away; far ones fade into the distance
      stepEls.forEach((el, i) => {
        const d = i - p
        const o = d < -0.6 ? 0 : d < 0 ? 1 + d / 0.6 : d > AHEAD ? 0 : d > AHEAD - 3 ? (AHEAD - d) / 3 : 1
        el.style.opacity = o.toFixed(3)
        el.style.visibility = o === 0 ? 'hidden' : 'visible'
      })
      raf = requestAnimationFrame(frame)
    }
    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
      delete html.dataset.headerHidden
    }
  }, [steps])

  const { climber, texture } = project.stairs
  return (
    <main className="stairs" aria-label={project.fullTitle ?? project.title}>
      {/* The scroll track: the walk in, one tick of scrolling per step, the arrival */}
      <div
        ref={trackRef}
        className="stairs__track"
        style={{ height: `calc(${OPENING + (steps.length - 1) * STEP + ARRIVE}px + 100vh)` }}
      >
        <div ref={viewRef} className="stairs__view" style={{ '--texture': `url("${texture}")` }}>
          <Opening project={project} />
          <div ref={flightRef} className="stairs__flight">
            {steps.map((step, i) => (
              <div key={i} className="step" style={{ '--i': i }}>
                <Riser step={step} />
                <div className="tread" />
              </div>
            ))}
          </div>
          <div className="stairs__shade" />
          <img className="stairs__climber" src={climber.src} alt={climber.alt} />
          <div ref={nextRef} className="stairs__next" style={{ visibility: 'hidden' }}>
            <NextProject project={next} />
          </div>
        </div>
      </div>
    </main>
  )
}
