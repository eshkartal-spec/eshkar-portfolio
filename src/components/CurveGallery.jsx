import { useEffect, useMemo, useRef, useState } from 'react'
import { shapeOf } from './photoShape'
import './CurveGallery.css'

const HEIGHT = 0.58 // each photo's height, as a share of the screen's height...
const HEIGHT_MAX = 0.55 // ...but at most this share of its width (wide screens)
const GAP = 0.03 // the space between photos, as a share of the screen's width
const RADIUS = 0.7 // the drum's radius (share of the width): smaller bends it more
const DEPTH = 0.2 // how far behind the screen the middle photo sits (share of the width)
const VIEW = 0.9 // how far back you stand (share of the width): nearer bends the edges more
// On narrow screens (phones), a gentler drum, wide photos a little narrower than the screen
const NARROW = 700
const NARROW_SET = { HEIGHT_MAX: 0.72, GAP: 0.04, RADIUS: 1.3, DEPTH: 0.12, VIEW: 1.2 }
const DRIFT = 30 // how fast it turns by itself (px per second, along the drum)
const SCROLLED = 0.5 // how much the page's scroll turns it (px along it per px scrolled)
const FRICTION = 2.2 // how quickly a flick slows down to the drift (per second)
const START = 0.04 // with the gallery in the middle of the screen, the first photo's left
// edge this share of the width in from the left
// Near the screen's edges, a photo leaving or coming in curls like a page being turned,
// its outer side toward you: each photo is cut into upright strips, hinged together
const STRIP = 36 // a strip's width, in px (about)
const CURL = 0.85 // how much it curls, in degrees per px of photo past where it starts...
const CURL_FROM = 0.5 // ...which is this share of the way out to the screen's edge...
const CURL_FULL = 1.05 // ...curling fully from this share on
const CURL_MAX = 110 // the most it curls in all, in degrees (more would fold it over)
const CAPTION = 130 // room under a photo for its words, in px

// The photos in their order, the features (photos with a note) dealt in among them: one
// of them first, each of the others somewhere random in its own stretch of the rest, so
// they're spread around the loop (a new deal each visit)
const deal = (photos) => {
  const features = photos.filter((p) => p.note).sort(() => Math.random() - 0.5)
  const rest = photos.filter((p) => !p.note)
  if (!features.length) return photos
  const [first, ...others] = features
  // each of the others after a random photo in its stretch (short of the stretch's end,
  // so two features never meet, not even across the loop's ends)
  const stretch = rest.length / Math.max(others.length, 1)
  const after = others.map((_, k) => Math.floor(k * stretch + Math.random() * Math.max(stretch - 1, 0)))
  const out = [first]
  rest.forEach((p, i) => {
    out.push(p)
    others.forEach((f, k) => after[k] === i && out.push(f))
  })
  return out
}

const smooth = (a, b, v) => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

// One side of a photo, from its middle out: a strip showing its slice of the photo (and
// of the words under it), with the next strip hinged to its outer edge, and so on
function Strips({ item, w, h, side, n, k = 0 }) {
  if (k === n) return null
  const sw = w / 2 / n
  const x = side === 'right' ? w / 2 + k * sw : w / 2 - (k + 1) * sw
  return (
    <div className={`curve__strip curve__strip--${side}${k ? '' : ' is-root'}`} style={{ width: sw }}>
      <div className="curve__clip" style={{ height: h + (item.note ? CAPTION : 0) }}>
        <div className="curve__face" style={{ width: w, left: -x }}>
          <img src={item.src} alt="" draggable="false" style={{ height: h }} />
          {item.note && (
            <p className="curve__note">
              <span className="curve__title">{item.note.title}</span>
              <span className="curve__text">{item.note.text}</span>
            </p>
          )}
        </div>
      </div>
      <Strips item={item} w={w} h={h} side={side} n={n} k={k + 1} />
    </div>
  )
}

// Photos on the inside of a drum, seen from inside it, turning slowly sideways: the
// middle ones farther away, the ones at the edges nearer and turned toward you, like the
// opening of anfalova.art. The photos go round in a loop, longer than the drum, each
// placed on it as it comes into view. Drag (or swipe) to turn it, and the page's scroll
// turns it a little too (the first photos in place when the gallery is in the middle of
// the screen); it drifts on by itself, slowing while the cursor rests on a photo. Photos
// with a note (the bike's features: one first, the rest spread around) have their words
// under them. With a mouse, the cursor over it is a small black circle saying "Drag".
export default function CurveGallery({ photos }) {
  const [items] = useState(() => deal(photos))
  const viewRef = useRef(null)
  const pointerRef = useRef(null)
  const cardRefs = useRef([])
  const [size, setSize] = useState({ w: 1440, h: 900 })

  useEffect(() => {
    const view = viewRef.current
    const ro = new ResizeObserver(() => setSize({ w: view.clientWidth, h: window.innerHeight }))
    ro.observe(view)
    return () => ro.disconnect()
  }, [])

  // Each photo's width and where its middle sits along the loop, and the loop's length
  const geo = useMemo(() => {
    const set = size.w < NARROW ? NARROW_SET : { HEIGHT_MAX, GAP }
    const h = Math.min(size.h * HEIGHT, size.w * set.HEIGHT_MAX)
    const gap = size.w * set.GAP
    const cards = []
    let at = 0
    for (const item of items) {
      const w = h * shapeOf(item)
      cards.push({ w, mid: at + w / 2, n: Math.max(2, Math.round(w / 2 / STRIP)) })
      at += w + gap
    }
    return { h, cards, length: at }
  }, [items, size])

  useEffect(() => {
    const view = viewRef.current
    const { cards, length } = geo
    const W = size.w
    const set = W < NARROW ? NARROW_SET : { RADIUS, DEPTH, VIEW }
    const radius = W * set.RADIUS
    const persp = W * set.VIEW
    // The drum's middle, in front of the middle photo by the radius (z toward you)
    const z0 = radius - W * set.DEPTH
    view.style.perspective = `${persp}px`
    // Where on the screen a point at this angle around the drum shows (from the middle)
    const onScreen = (a) => (radius * Math.sin(a) * persp) / (persp - (z0 - radius * Math.cos(a)))
    // The angle at which the drum meets the screen's edges
    let edge = 0
    while (edge < Math.PI / 2 && onScreen(edge) < W / 2) edge += 0.002
    // Where the first photo's left edge starts
    let lead = 0
    while (lead < edge && onScreen(-lead) > -W / 2 + W * START) lead += 0.002
    let pos = cards[0].mid - cards[0].w / 2 + lead * radius
    let speed = 0
    let drag = null
    let hover = false
    let last = performance.now()
    let raf = 0
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // The page's scroll, as a turn: none with the gallery in the middle of the screen (or
    // with the page scrolled to its end, if it can't get there)
    const scrolled = () => {
      if (still) return 0
      const r = view.getBoundingClientRect()
      const toMiddle = r.top + r.height / 2 - window.innerHeight / 2
      const toEnd = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      return -Math.min(toMiddle, toEnd) * SCROLLED
    }
    // each photo's strips, middle out (a strip comes before the one hinged to it)
    const strips = cards.map((c, i) => ({
      right: [...cardRefs.current[i].querySelectorAll('.curve__strip--right')],
      left: [...cardRefs.current[i].querySelectorAll('.curve__strip--left')],
    }))
    const place = () => {
      const at = pos + scrolled()
      cards.forEach((c, i) => {
        // along the loop from the middle of the screen, the nearer way round
        let s = c.mid - at
        s -= Math.round(s / length) * length
        const a = s / radius
        const el = cardRefs.current[i]
        if (Math.abs(a) > edge + c.w / radius) {
          el.style.visibility = 'hidden'
          return
        }
        el.style.visibility = 'visible'
        el.style.transform = `translateZ(${z0}px) rotateY(${-a}rad) translateZ(${-radius}px)`
        // the curl: each hinge on the photo's outer side turned by how far out it is
        const sw = c.w / 2 / c.n
        for (const [list, dir] of [[strips[i].right, 1], [strips[i].left, -1]]) {
          let total = 0
          list.forEach((strip, k) => {
            const out = (dir * (s + dir * k * sw)) / radius / edge
            const bend = k ? Math.min(CURL * sw * smooth(CURL_FROM, CURL_FULL, out), CURL_MAX - total) : 0
            total += bend
            strip.style.transform = bend ? `rotateY(${-dir * bend}deg)` : ''
          })
        }
      })
    }
    place()

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      if (!drag) {
        const drift = still ? 0 : hover ? DRIFT * 0.15 : DRIFT
        // a flick slows down to the drift
        speed = drift + (speed - drift) * Math.exp(-FRICTION * dt)
        pos += speed * dt
      }
      place()
      raf = requestAnimationFrame(frame)
    }

    const onDown = (e) => {
      if (e.button !== 0) return
      drag = { x: e.clientX, pos, t: performance.now(), v: 0 }
      view.setPointerCapture(e.pointerId)
      view.classList.add('is-dragging')
    }
    const pointer = pointerRef.current
    const onMove = (e) => {
      if (e.pointerType === 'mouse') {
        pointer.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
        pointer.classList.add('is-on')
      }
      if (!drag) return
      const now = performance.now()
      const next = drag.pos - (e.clientX - drag.x)
      drag.v = ((next - pos) / Math.max(now - drag.t, 1)) * 1000 * 0.6 + drag.v * 0.4
      drag.t = now
      pos = next
    }
    const onUp = () => {
      if (!drag) return
      speed = performance.now() - drag.t < 80 ? Math.max(-3000, Math.min(3000, drag.v)) : 0
      drag = null
      view.classList.remove('is-dragging')
    }
    const onOver = (e) => (hover = e.pointerType === 'mouse' && !!e.target.closest('.curve__card'))
    const onLeave = () => {
      hover = false
      pointer.classList.remove('is-on')
    }

    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(view)
    view.addEventListener('pointerdown', onDown)
    view.addEventListener('pointermove', onMove)
    view.addEventListener('pointerup', onUp)
    view.addEventListener('pointercancel', onUp)
    view.addEventListener('pointerover', onOver)
    view.addEventListener('pointerleave', onLeave)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      view.removeEventListener('pointerdown', onDown)
      view.removeEventListener('pointermove', onMove)
      view.removeEventListener('pointerup', onUp)
      view.removeEventListener('pointercancel', onUp)
      view.removeEventListener('pointerover', onOver)
      view.removeEventListener('pointerleave', onLeave)
    }
  }, [geo, size])

  return (
    <section className="curve" aria-label="Photos of STEP UP">
      <div ref={viewRef} className="curve__view" style={{ '--h': `${geo.h}px` }}>
        {items.map((item, i) => (
          <figure
            key={item.src}
            ref={(el) => (cardRefs.current[i] = el)}
            className={`curve__card${item.note ? ' is-noted' : ''}`}
            style={{ width: geo.cards[i].w, marginLeft: -geo.cards[i].w / 2 }}
            role="img"
            aria-label={item.note ? `${item.alt}. ${item.note.title}: ${item.note.text}` : item.alt}
          >
            {['right', 'left'].map((side) => (
              <Strips key={side} item={item} w={geo.cards[i].w} h={geo.h} side={side} n={geo.cards[i].n} />
            ))}
          </figure>
        ))}
      </div>
      <div ref={pointerRef} className="curve__pointer" aria-hidden="true">
        <span>Drag</span>
      </div>
    </section>
  )
}
