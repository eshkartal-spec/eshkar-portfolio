import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import './StairsPage.css'

const OPENING = 1.1 // screen heights of scrolling through the opening photo
const SCROLL_PER_STEP = 0.2 // screen heights of scrolling to climb one step
const FOLLOW = 0.1 // how quickly the camera catches up with the scroll (0–1)
const AHEAD = 9 // steps visible ahead before they fade into the distance
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

// A photo painted across several risers, like an ad printed up a flight of stairs.
// Each riser shows its own band of the photo.
const photo = (image, count, side = 'full') =>
  Array.from({ length: count }, (_, j) => ({ slice: { image, j, count, side } }))

// The climb, bottom to top: one entry per step. Each riser can carry text on its
// left part and/or a band of a photo. (The title and details are painted on the
// opening photo's steps, before the climb.)
function buildSteps(p, next) {
  const steps = [
    {},
    // The problem
    ...photo(p.heroAlt, 4),
    { kind: 'statement', text: p.pull },
    {},
  ]

  // One landing per feature: its name, then its description, on the left; its photo
  // painted up the right of the same risers
  p.features.forEach((f) => {
    const [a, b, c] = photo(f.image, 3, 'right')
    steps.push(
      { ...a, kind: 'feature-title', text: f.title },
      { ...b, kind: 'feature-text', text: f.text },
      c,
      {},
    )
  })

  // The finished bike: details side by side
  steps.push({ kind: 'heading', text: 'Details & in use' })
  const gallery = p.gallery.slice(0, 3)
  for (let j = 0; j < 4; j++) steps.push({ row: gallery.map((image) => ({ image, j, count: 4 })) })
  steps.push({})

  // Behind the product
  steps.push({ kind: 'heading', text: 'Behind the product' })
  for (let j = 0; j < 4; j++) steps.push({ row: p.process.map((s) => ({ image: s.image, j, count: 4 })) })
  steps.push({ kind: 'captions', items: p.process.map((s) => s.label) })
  steps.push({})

  // The top landing
  steps.push({ kind: 'next', next })
  return steps
}

// One band of a photo spread over `count` risers (index j from the bottom-most riser
// of the group, so the photo reads the right way up as you climb)
function Slice({ image, j, count, side = 'full' }) {
  return (
    <span
      className={`riser__slice riser__slice--${side}`}
      style={{ '--n': count, '--j': count - 1 - j }}
    >
      <span className="riser__photo" style={{ backgroundImage: `url("${image.src}")` }} data-src={image.src} />
    </span>
  )
}

function Riser({ step }) {
  return (
    <div className={`riser${step.kind ? ` riser--${step.kind}` : ''}`}>
      {step.slice && <Slice {...step.slice} />}
      {step.row && (
        <span className="riser__row">
          {step.row.map((s) => <Slice key={s.image.src} {...s} />)}
        </span>
      )}
      {step.kind === 'statement' && <span className="sub riser__statement">{step.text}</span>}
      {step.kind === 'feature-title' && <span className="riser__left riser__feature-title">{step.text}</span>}
      {step.kind === 'feature-text' && <span className="riser__left riser__feature-text">{step.text}</span>}
      {step.kind === 'heading' && <span className="display painted riser__heading">{step.text}</span>}
      {step.kind === 'captions' && (
        <span className="riser__captions">
          {step.items.map((c) => <span key={c} className="label">{c}</span>)}
        </span>
      )}
      {step.kind === 'next' && (
        <Link to={`/projects/${step.next.slug}`} className="riser__next">
          <span className="label">Next project</span>
          <span className="display riser__next-title">{step.next.title} →</span>
        </Link>
      )}
    </div>
  )
}

// The opening: a full-screen photo of real stairs, with the title and details painted
// on its bottom steps and someone carrying the bike climbing away up the flight.
// The photo is sized like object-fit: cover and kept anchored to its bottom steps, so
// the paint (placed in the photo's own pixels) stays on its steps at any screen size.
function Opening({ project }) {
  const { photo: ph, climber } = project.stairs
  const at = (r) => ({
    left: `${(r.x / ph.width) * 100}%`,
    top: `${(r.y / ph.height) * 100}%`,
    width: `${(r.w / ph.width) * 100}%`,
    height: `${(r.h / ph.height) * 100}%`,
  })
  const [title, summary, specs, tools] = ph.risers
  return (
    <div className="opening" style={{ '--pw': ph.width, '--ph': ph.height }}>
      <div className="opening__frame">
        <img className="opening__photo" src={ph.src} alt={ph.alt} />
        <img className="opening__climber" src={climber.src} alt={climber.alt} />
        <h1 className="paint" style={at(title)}>
          <span className="display painted paint__title">{project.title}</span>
        </h1>
        <p className="paint" style={at(summary)}>
          <span className="sub painted paint__summary">{project.summary}</span>
        </p>
        <div className="paint paint--specs" style={at(specs)}>
          {[['Type', project.type], ['Year', project.year], ['Duration', project.duration]].map(([k, v]) => (
            <span key={k} className="paint__spec">
              <span className="label painted">{k}</span>
              <span className="painted paint__value">{v}</span>
            </span>
          ))}
        </div>
        <div className="paint paint--specs" style={at(tools)}>
          <span className="paint__spec">
            <span className="label painted">Tools</span>
            <span className="painted paint__value">{project.tools}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// Step Up's page: a staircase you climb by scrolling. It opens on a full-screen photo
// of real stairs with the title painted on them; scrolling walks into the photo, which
// gives way to a 3D concrete flight. The camera then rises one step per stretch of
// scroll, with text and photos painted on the risers (the steps' fronts).
export default function StairsPage({ project, next }) {
  const steps = useMemo(() => buildSteps(project, next), [project, next])
  const trackRef = useRef(null)
  const viewRef = useRef(null)
  const flightRef = useRef(null)

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

  // The camera: follows the scroll with a little easing, so the walk and climb glide.
  // The first stretch of scroll walks into the opening photo (--q, 0–1); after that,
  // each stretch climbs one step (--p).
  useEffect(() => {
    const track = trackRef.current
    const view = viewRef.current
    const flight = flightRef.current
    const stepEls = [...flight.children]
    const html = document.documentElement
    let target = 0
    let pos = 0
    let raf = 0
    const read = () => {
      target = Math.max(0, -track.getBoundingClientRect().top / window.innerHeight)
    }
    const frame = () => {
      pos += (target - pos) * FOLLOW
      if (Math.abs(target - pos) < 0.0005) pos = target
      const q = clamp01(pos / OPENING)
      // (never past the top step, so it stays in view until the page moves on)
      const p = Math.min(Math.max(0, (pos - OPENING) / SCROLL_PER_STEP), stepEls.length - 1)
      view.style.setProperty('--q', q.toFixed(4))
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
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
      delete html.dataset.headerHidden
    }
  }, [steps])

  return (
    <main className="stairs" aria-label={project.fullTitle ?? project.title}>
      {/* The scroll track: the walk into the photo, then one stretch of scrolling per step */}
      <div
        ref={trackRef}
        className="stairs__track"
        style={{ '--steps': steps.length, '--opening': OPENING, '--per-step': SCROLL_PER_STEP }}
      >
        <div
          ref={viewRef}
          className="stairs__view"
          style={{ '--texture': `url("${project.stairs.texture}")` }}
        >
          <Opening project={project} />
          <div ref={flightRef} className="stairs__flight">
            {steps.map((step, i) => (
              <div key={i} className="step" style={{ '--i': i }}>
                <Riser step={step} />
                <div className="tread" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
