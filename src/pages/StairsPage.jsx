import { useEffect, useMemo, useRef } from 'react'
import NextProject from '../components/NextProject'
import PhotoPanel from '../components/PhotoPanel'
import './StairsPage.css'

// ---- Pace (in pixels of scrolling: one mouse-wheel tick is about 100) ----
const OPENING = 100 // walking into the opening photo: one tick
const STEP = 100 // climbing one step: one tick, one step
const ARRIVE = 400 // past the top step: the "More images" panel fades in over the stairs
const SETTLE = 140 // ms after the scrolling stops, the camera settles on the nearest step
const FOLLOW = 0.12 // how quickly the camera catches up (0–1): each step glides
const JUMP_FOLLOW = 0.22 // the same, after clicking a feature's name: a quicker climb to it
const ARRIVE_FOLLOW = 0.028 // the same, past the top step: the panel fades in (or out) a little slower
const FLICK_FRICTION = 0.95 // touch screens: how much of a flick's speed is kept each frame
// --------------------------------------------------------------------------
const AHEAD = 9 // steps visible ahead before they fade into the distance
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// The climb, bottom to top: one entry per step. The risers carry words, painted on the
// part of the flight clear of the climber. (The title and summary are on the opening
// photo's steps, before the climb.) It ends one step past the last feature.
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

  // One landing per feature: its description, with its name on the step above it, then
  // a bare step (after the last feature, the top of the flight)
  p.features.forEach((f) => {
    steps.push({ kind: 'feature-text', text: f.text }, { kind: 'feature-title', text: f.title }, {})
  })
  return steps
}

function Riser({ step, onJump }) {
  return (
    <div className={`riser${step.kind ? ` riser--${step.kind}` : ''}`}>
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
      {step.kind === 'feature-title' && (
        <span className="riser__left">
          <button type="button" className="riser__feature-title" onClick={onJump}>{step.text}</button>
        </span>
      )}
      {step.kind === 'feature-text' && <span className="riser__left riser__feature-text">{step.text}</span>}
    </div>
  )
}

// The opening: a full-screen photo of real stairs with the title and summary painted
// on its bottom steps (wide on landscape screens, tall on portrait ones). The words are
// in the photo, so they're also here, hidden, for screen readers and search engines.
// A dark gradient falls from the top, with a prompt in it that invites the climb.
function Opening({ project, touch }) {
  const { wide, tall } = project.stairs.opening
  return (
    <div className="opening">
      <picture>
        <source media="(orientation: portrait)" srcSet={tall.src} />
        <img className="opening__photo" src={wide.src} alt={wide.alt} />
      </picture>
      <div className="opening__shade" />
      <h1 className="visually-hidden">{project.title}</h1>
      <p className="visually-hidden">{project.summary}</p>
      <p className="label opening__prompt">
        {touch ? 'Swipe down to climb' : 'Scroll to climb'}
        <span className="opening__line" />
      </p>
    </div>
  )
}

// Step Up's page: a staircase you climb by scrolling. It opens on a full-screen photo
// of real stairs with the title on them; the first few scroll ticks walk into the photo,
// which gives way to a 3D concrete flight. From there each tick climbs one step, with
// text painted on the risers (the steps' fronts), while someone carrying the bike stands
// on the flight in front of them. Past the top step a full-screen "More images" panel
// fades in over the stairs, and from there the page scrolls on as usual, to the next
// project. On touch screens the page is swiped instead of scrolled, the other way round:
// swiping down pulls the stairs down toward you (and, past them, the page up).
export default function StairsPage({ project, next }) {
  const steps = useMemo(() => buildSteps(project), [project])
  const touch = useMemo(() => window.matchMedia('(pointer: coarse)').matches, [])
  const trackRef = useRef(null)
  const viewRef = useRef(null)
  const flightRef = useRef(null)
  const moreRef = useRef(null)
  const climberRef = useRef(null)
  const jumpRef = useRef(() => {})

  // The camera: follows the scroll with easing, so each step glides, and settles on
  // the nearest step once the scrolling stops. --q is the walk into the opening photo
  // (0–1), --p the position on the flight in steps, --climb how far up the flight
  // (0–1), --arrive how far the "More images" panel has faded in (0–1) and --leave how far
  // the climber has faded out (0–1: from the last feature's step, ahead of the panel).
  useEffect(() => {
    const track = trackRef.current
    const view = viewRef.current
    const flight = flightRef.current
    const moreEl = moreRef.current
    const stepEls = [...flight.children]
    const frameEls = [...climberRef.current.querySelectorAll('.stairs__frame')]
    const nameEls = [...flight.querySelectorAll('.riser__feature-title')]
    // Each feature's name lights its frame on the climber, and turns pink itself, from
    // when it reaches the second step from the bottom until it drops away
    const titleSteps = steps.flatMap((s, i) => (s.kind === 'feature-title' ? [i] : []))
    let lit = -1
    let jumping = -1 // the feature clicked: its frame alone is lit until the camera arrives
    const html = document.documentElement
    const top = stepEls.length - 1
    const topY = OPENING + top * STEP // scroll position at the top step
    const end = topY + ARRIVE // the panel is in: from here the page scrolls on as usual
    let target = 0
    let pos = 0
    let raf = 0
    let settle = 0
    let lastY = 0
    let goingUp = false // scrolling back toward the top of the page
    // Touch screens: the page itself doesn't scroll; swipes move this instead (see below)
    let swiped = 0
    const scrolled = () => (touch ? swiped : Math.max(0, -track.getBoundingClientRect().top))
    const nearestStep = (y) => {
      if (y <= OPENING) return y
      if (y >= end) return end
      // Past the top step the panel finishes fading in, or fades back out, depending on
      // which way the page was last scrolled
      if (y > topY) return goingUp ? topY : end
      return OPENING + Math.round((y - OPENING) / STEP) * STEP
    }
    const read = () => {
      const y = scrolled()
      if (y !== lastY) goingUp = y < lastY
      lastY = y
      target = y > topY && !goingUp ? end : Math.min(y, end)
      clearTimeout(settle)
      settle = setTimeout(() => {
        const at = scrolled()
        target = nearestStep(at)
        if (touch && at < end) swiped = target // the next swipe starts from the step it settled on
      }, SETTLE)
    }
    const frame = () => {
      const follow = jumping >= 0 ? JUMP_FOLLOW : pos > topY || target > topY ? ARRIVE_FOLLOW : FOLLOW
      pos += (target - pos) * follow
      if (Math.abs(target - pos) < 0.05) {
        pos = target
        jumping = -1
      }
      const q = clamp(pos / OPENING, 0, 1)
      const p = clamp((pos - OPENING) / STEP, 0, top)
      view.style.setProperty('--q', q.toFixed(4))
      view.style.setProperty('--climb', (p / top).toFixed(4))
      const arrive = clamp((pos - topY) / ARRIVE, 0, 1)
      view.style.setProperty('--arrive', arrive.toFixed(4))
      view.style.setProperty('--leave', clamp((pos - topY + STEP) / (STEP + ARRIVE / 2), 0, 1).toFixed(4))
      moreEl.style.visibility = arrive > 0 ? 'visible' : 'hidden'
      flight.style.setProperty('--p', p.toFixed(4))
      // The top bar stays out of the way over the opening photo
      if (q < 0.9) html.dataset.headerHidden = ''
      else delete html.dataset.headerHidden
      // Steps below the camera drop away; far ones fade into the distance
      stepEls.forEach((el, i) => {
        const d = i - p
        const o = d < -0.6 ? 0 : d < 0 ? 1 + d / 0.6 : d > AHEAD ? 0 : d > AHEAD - 3 ? (AHEAD - d) / 3 : 1
        el.style.setProperty('--o', o.toFixed(3))
        el.style.visibility = o === 0 ? 'hidden' : 'visible'
      })
      const on = jumping >= 0 ? jumping : titleSteps.findIndex((t) => p >= t - 1.5 && p < t + 0.5)
      if (on !== lit) {
        frameEls.forEach((el, n) => el.classList.toggle('is-on', n === on))
        nameEls.forEach((el, n) => el.classList.toggle('is-on', n === on))
        lit = on
      }
      raf = requestAnimationFrame(frame)
    }
    // Clicking a feature's name climbs quickly to the step where it's lit
    jumpRef.current = (i) => {
      const y = OPENING + (i - 1) * STEP
      if (touch) {
        cancelAnimationFrame(flick)
        swiped = y
      } else {
        window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top + y, behavior: 'instant' })
      }
      target = y
      jumping = titleSteps.indexOf(i)
    }

    // Touch screens: a finger moving down climbs, one pixel of swipe for one of scroll,
    // and a flick keeps coasting and slows down, like the phone's own scrolling. Past the
    // panel, swipes scroll the rest of the page the same way round. Each move is
    // announced as a scroll, which the camera reads (and which wakes the header).
    let flick = 0
    let fingerY = 0
    let fingerT = 0
    let speed = 0 // px per ms
    const moveTo = (y) => {
      swiped = clamp(y, 0, end + html.scrollHeight - window.innerHeight)
      const pageY = Math.max(0, swiped - end)
      if (window.scrollY !== pageY) window.scrollTo(0, pageY)
      window.dispatchEvent(new Event('scroll'))
    }
    const onTouchStart = (e) => {
      cancelAnimationFrame(flick)
      fingerY = e.touches[0].clientY
      fingerT = e.timeStamp
      speed = 0
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      const y = e.touches[0].clientY
      const dt = Math.max(1, e.timeStamp - fingerT)
      speed = 0.8 * ((y - fingerY) / dt) + 0.2 * speed
      moveTo(swiped + y - fingerY)
      fingerY = y
      fingerT = e.timeStamp
    }
    const onTouchEnd = (e) => {
      if (e.timeStamp - fingerT > 80) speed = 0 // the finger had stopped before lifting
      let last = performance.now()
      const coast = (now) => {
        const dt = now - last
        last = now
        speed *= FLICK_FRICTION ** (dt / 16.7)
        if (Math.abs(speed) < 0.05) return
        moveTo(swiped + speed * dt)
        flick = requestAnimationFrame(coast)
      }
      flick = requestAnimationFrame(coast)
    }
    // The footer's "Back to top": on touch screens the climb goes back to the opening too
    const onBackToTop = () => {
      if (!touch) return
      cancelAnimationFrame(flick)
      moveTo(0)
    }
    window.addEventListener('back-to-top', onBackToTop)
    if (touch) {
      html.dataset.touchClimb = ''
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', onTouchEnd, { passive: true })
    }

    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(flick)
      clearTimeout(settle)
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('back-to-top', onBackToTop)
      delete html.dataset.headerHidden
      delete html.dataset.touchClimb
    }
  }, [steps, touch])

  const { climber, backdrop } = project.stairs
  return (
    <main className="stairs" aria-label={project.fullTitle ?? project.title}>
      {/* The scroll track: the walk in, one tick of scrolling per step, the panel fading
          in (on touch screens, just the screen: the climb is swiped) */}
      <div
        ref={trackRef}
        className="stairs__track"
        style={{ height: touch ? '100dvh' : `calc(${OPENING + (steps.length - 1) * STEP + ARRIVE}px + 100dvh)` }}
      >
        <div ref={viewRef} className="stairs__view" style={{ '--backdrop': `url("${backdrop}")` }}>
          <Opening project={project} touch={touch} />
          <div ref={flightRef} className="stairs__flight">
            {steps.map((step, i) => (
              <div key={i} className="step" style={{ '--i': i }}>
                <Riser step={step} onJump={() => jumpRef.current(i)} />
                <div className="tread" />
              </div>
            ))}
          </div>
          <div className="stairs__shade" />
          <div ref={climberRef} className="stairs__climber">
            <img src={climber.src} alt={climber.alt} />
            {project.features.map(({ title, frame }) => (
              <span
                key={title}
                className="stairs__frame"
                style={{ left: `${frame.x}%`, top: `${frame.y}%` }}
              />
            ))}
          </div>
          <div ref={moreRef} className="stairs__more" style={{ visibility: 'hidden' }}>
            <PhotoPanel
              to={`/projects/${project.slug}/images`}
              photo={project.more.cover}
              label={project.title}
              title="More images"
              subtitle="The bike, details & process"
              go="View images →"
              eager
            />
          </div>
        </div>
      </div>
      <NextProject project={next} />
    </main>
  )
}
