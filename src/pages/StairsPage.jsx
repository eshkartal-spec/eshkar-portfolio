import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import './StairsPage.css'

const SCROLL_PER_STEP = 0.2 // screen heights of scrolling to climb one step
const FOLLOW = 0.1 // how quickly the camera catches up with the scroll (0–1)
const AHEAD = 9 // steps visible ahead before they fade into the distance

// A photo painted across several risers, like an ad printed up a flight of stairs.
// Each riser shows its own band of the photo.
const photo = (image, count, side = 'full') =>
  Array.from({ length: count }, (_, j) => ({ slice: { image, j, count, side } }))

// The climb, bottom to top: one entry per step. Each riser can carry text on its
// left part and/or a band of a photo.
function buildSteps(p, next) {
  const steps = [
    { kind: 'title', text: p.title },
    { kind: 'summary', text: p.summary },
    { kind: 'specs', items: [['Type', p.type], ['Year', p.year], ['Duration', p.duration]] },
    { kind: 'specs', items: [['Tools', p.tools]] },
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
      {step.kind === 'title' && <span className="display riser__title">{step.text}</span>}
      {step.kind === 'summary' && <span className="sub riser__summary">{step.text}</span>}
      {step.kind === 'specs' && (
        <span className="riser__specs">
          {step.items.filter(([, v]) => v).map(([k, v]) => (
            <span key={k} className="riser__spec">
              <span className="label">{k}</span>
              <span className="riser__spec-value">{v}</span>
            </span>
          ))}
        </span>
      )}
      {step.kind === 'statement' && <span className="sub riser__statement">{step.text}</span>}
      {step.kind === 'feature-title' && <span className="riser__left riser__feature-title">{step.text}</span>}
      {step.kind === 'feature-text' && <span className="riser__left riser__feature-text">{step.text}</span>}
      {step.kind === 'heading' && <span className="display riser__heading">{step.text}</span>}
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

// Step Up's page: a staircase you climb by scrolling. The camera stands at the foot of
// the flight and rises one step per stretch of scroll; text and photos are painted on
// the risers (the steps' fronts). Plain stairs for now: a prototype to feel the climb.
export default function StairsPage({ project, next }) {
  const steps = useMemo(() => buildSteps(project, next), [project, next])
  const trackRef = useRef(null)
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

  // The camera: follows the scroll with a little easing, so the climb glides
  useEffect(() => {
    const track = trackRef.current
    const flight = flightRef.current
    const stepEls = [...flight.children]
    let target = 0
    let pos = 0
    let raf = 0
    const read = () => {
      const top = track.getBoundingClientRect().top
      target = Math.max(0, -top / (window.innerHeight * SCROLL_PER_STEP))
    }
    const frame = () => {
      pos += (target - pos) * FOLLOW
      if (Math.abs(target - pos) < 0.001) pos = target
      flight.style.setProperty('--p', pos.toFixed(4))
      // Steps below the camera drop away; far ones fade into the distance
      stepEls.forEach((el, i) => {
        const d = i - pos
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
    }
  }, [steps])

  return (
    <main className="stairs" aria-label={project.fullTitle ?? project.title}>
      {/* The scroll track: one stretch of scrolling per step */}
      <div ref={trackRef} className="stairs__track" style={{ '--steps': steps.length }}>
        <div className="stairs__view">
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
