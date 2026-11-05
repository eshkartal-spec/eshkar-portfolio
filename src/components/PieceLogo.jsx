import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './PieceLogo.css'

const NUDGE = 10 // how far the other pieces move aside from the one under the cursor (logo units)
// How high each piece pops up under the cursor, like a 3D button (logo units, in the
// logo's order of pieces): each its own height
const LIFTS = [24, 8, 52, 14, 66, 44, 92]
// A topic's name, written along the front of its solid side (its longest lower edge)
// while it's popped up: this big on the screen (px), on wide and narrow screens
const NAME_SIZE = { wide: 11, narrow: 9 }
const LAYERS = 30 // the button's sides are drawn as this many outlines stacked up its height
// Opened, a piece turns into a window: a regular hexagon with rounded corners
const MORPH = 700 // how long it takes to turn into the window, or back (ms)
const POINTS = 160 // both outlines are followed through this many points, matched up
const WINDOW_DEPTH = 14 // the window's own 3D button height (px)
const WINDOW_SIDES = 14 // its sides drawn as this many stacked outlines
const ROUND = 0.07 // its corners' rounding, as a share of its width
const TRAIL = 0.38 // how closely the topic's photo follows the mouse over the window (0–1): lower trails more
const TRAIL_OFFSET = 16 // ...sitting this far below and to the right of the cursor (px)

// A piece's outline as points, and its bounding box and middle
const measure = (d) => {
  const pts = [...d.matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [+m[1], +m[2]])
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  // the front: its longest lower edge sloping down to the right (not steeper than 45°),
  // the same face on every piece, where its name goes. An edge is a run of nearly
  // straight steps (within a few degrees of each other: smoothing leaves slight kinks)
  const middle = [box.x + box.w / 2, box.y + box.h / 2]
  const slope = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  const runs = []
  pts.forEach((a, k) => {
    const b = pts[(k + 1) % pts.length]
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5) return
    const run = runs.at(-1)
    if (run && Math.abs(slope(a, b) - slope(run.from, b)) < 6 && Math.abs(slope(a, b) - run.first) < 8) run.to = b
    else runs.push({ from: a, to: b, first: slope(a, b) })
  })
  let front = null
  for (const { from, to } of runs) {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1])
    const at = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
    let angle = slope(from, to)
    if (angle > 90) angle -= 180
    if (angle < -90) angle += 180
    if (at[1] <= middle[1] || angle <= 2 || angle > 45) continue
    if (!front || len > front.len) front = { at, angle, len }
  }
  return { box, mid: middle, front }
}

// A piece as a 3D button: its sides, solid (outlines stacked from its base up to its top),
// and its top (outline, page-colored inside, or a photo cut to its shape)
function Button({ d, box, photo, clip }) {
  return (
    <>
      {Array.from({ length: LAYERS }, (_, k) => (
        <path key={k} className="pieces__side" d={d} style={{ '--k': k / LAYERS }} />
      ))}
      <g className="pieces__top">
        <path d={d} />
        {photo && (
          <image
            href={photo.src}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clip})`}
          />
        )}
      </g>
    </>
  )
}

// The project's logo, full screen, its pieces drawn in outline. With the cursor over a
// piece, it pops up like a 3D button (each piece to its own height: its top lifts off,
// its sides solid under it), while the others fade back and move aside a little. Some
// pieces stand for a topic (logo.topics: which piece, its name, a photo and words):
// popped up, its photo shows on its top and its name along the front of its solid
// side; clicked, it turns
// into a window in the middle of the screen with its name and words (Window), until
// closed. On touch screens, a first tap pops it up, a second opens it. Other pieces
// set the section's background (logo.backgrounds: which piece, its name and a photo):
// popped up, they show their photo the same way (but no name); clicked (or tapped), the
// photo fills the section behind the logo, the piece staying popped up, until another
// is chosen or it's clicked again. A popped-up piece is drawn over its neighbours.
// (The last spot the mouse clicked is kept, for the window's photo to start there.)
const lastClick = { x: null, y: null }
export default function PieceLogo({ logo, title }) {
  const uid = useId()
  const [active, setActive] = useState(null)
  const [open, setOpen] = useState(null) // the piece opened
  const pieceRefs = useRef([])
  const hitRefs = useRef([])
  const shapes = useMemo(() => logo.shape.pieces.map(measure), [logo])
  const topicOf = (i) => logo.topics.find((t) => t.piece === i)
  const backdropOf = (i) => logo.backgrounds?.find((b) => b.piece === i)
  const [backdrop, setBackdrop] = useState(null) // the piece whose background is showing
  const hovered = active == null ? null : shapes[active]
  // the name's size in the logo's own units, for its size on the screen
  const logoRef = useRef(null)
  const [nameSize, setNameSize] = useState(10)
  useEffect(() => {
    const el = logoRef.current
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      const px = window.innerWidth < 700 ? NAME_SIZE.narrow : NAME_SIZE.wide
      if (w) setNameSize((px * el.viewBox.baseVal.width) / w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // the pieces in drawing order: the chosen one, then the one under the cursor, last (on top)
  const order = useMemo(() => {
    const all = logo.shape.pieces.map((_, i) => i)
    return [...all.filter((i) => i !== backdrop && i !== active), ...[backdrop, active].filter((i, k, a) => i != null && a.indexOf(i) === k)]
  }, [logo, backdrop, active])

  // A name's size: as set, or smaller to fit along its edge (measured as drawn) and
  // within its side's height. It's written on the side as on an upright wall: along the
  // edge, its letters' uprights kept upright
  const nameRefs = useRef([])
  useLayoutEffect(() => {
    nameRefs.current.forEach((el, i) => {
      if (!el) return
      const { front } = shapes[i]
      el.setAttribute('font-size', nameSize)
      const room = front.len * Math.cos((front.angle * Math.PI) / 180) * 0.86
      const width = el.getComputedTextLength() || 1
      el.setAttribute('font-size', Math.min(nameSize, (nameSize * room) / width, LIFTS[i % LIFTS.length] * 0.6))
    })
  }, [nameSize, shapes])
  // aside: away from the piece under the cursor
  const shiftOf = (i) => {
    if (!hovered || active === i) return undefined
    const [mx, my] = shapes[i].mid
    const dx = mx - hovered.mid[0]
    const dy = my - hovered.mid[1]
    const len = Math.hypot(dx, dy) || 1
    return `translate(${(dx / len) * NUDGE}px, ${(dy / len) * NUDGE}px)`
  }

  // (a click doesn't always say whether it came from a finger, so that's noted as it
  // touches down)
  const touched = useRef(false)
  const onPick = (i) => {
    if (backdropOf(i)) return setBackdrop((b) => (b === i ? null : i))
    if (!topicOf(i)) return
    if (touched.current && active !== i) return setActive(i)
    setOpen(i)
  }
  return (
    <section className={`pieces${active != null ? ' is-showing' : ''}${backdrop != null ? ' has-backdrop' : ''}`}>
      {logo.backgrounds?.map((b) => (
        <div
          key={b.piece}
          className={`pieces__backdrop${backdrop === b.piece ? ' is-on' : ''}`}
          style={{ backgroundImage: `url("${b.image.src}")` }}
          aria-hidden="true"
        />
      ))}
      <svg
        ref={logoRef}
        className="pieces__logo"
        viewBox={logo.shape.viewBox}
        role="group"
        aria-label={`${title} logo`}
        style={{ '--shade': `url(#${uid}-shade)` }}
      >
        <defs>
          {/* each piece's top a touch lighter at its top left, shaded toward its bottom right */}
          <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8f7f5" />
            <stop offset="1" stopColor="#dedcd7" />
          </linearGradient>
          {[...logo.topics, ...(logo.backgrounds ?? [])].map((t) => (
            <clipPath key={t.piece} id={`${uid}-${t.piece}`}>
              <path d={logo.shape.pieces[t.piece]} />
            </clipPath>
          ))}
        </defs>
        {/* The pieces as drawn, the chosen one and the one under the cursor last (on top);
            they take no pointer: moving a piece the cursor is over would lose it */}
        {order.map((i) => {
          const d = logo.shape.pieces[i]
          const topic = topicOf(i)
          const { box, front } = shapes[i]
          return (
            <g
              key={i}
              ref={(el) => (pieceRefs.current[i] = el)}
              className={`pieces__piece${active === i ? ' is-active' : ''}${backdrop === i ? ' is-chosen' : ''}${open === i ? ' is-out' : ''}`}
              style={{ transform: shiftOf(i), '--lift': `${-LIFTS[i % LIFTS.length]}px` }}
              aria-hidden="true"
            >
              <Button d={d} box={box} photo={(topic ?? backdropOf(i))?.image} clip={`${uid}-${i}`} />
              {/* its name along the front of its side, halfway up it as it rises */}
              {topic && front && (
                <g className="pieces__name">
                  <text
                    ref={(el) => (nameRefs.current[i] = el)}
                    transform={`translate(${front.at[0]} ${front.at[1]}) skewY(${front.angle})`}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {topic.title}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        {/* ...and over them, in the logo's own order (never moved), the invisible shapes
            the cursor, taps and keys meet: each piece's outline, and up its side to its
            top while it's popped up */}
        {logo.shape.pieces.map((d, i) => {
          const topic = topicOf(i)
          const back = backdropOf(i)
          return (
            <g
              key={i}
              ref={(el) => (hitRefs.current[i] = el)}
              className={`pieces__hit${topic || back ? ' is-live' : ''}${active === i || backdrop === i ? ' is-up' : ''}`}
              style={{ transform: shiftOf(i), '--lift': `${-LIFTS[i % LIFTS.length]}px` }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
              onPointerDown={(e) => (touched.current = e.pointerType !== 'mouse')}
              onClick={(e) => {
                lastClick.x = e.clientX
                lastClick.y = e.clientY
                onPick(i)
              }}
              {...(topic && {
                role: 'button',
                tabIndex: 0,
                'aria-label': topic.title,
                'aria-haspopup': 'dialog',
                // (focus from the keyboard only: a tap focuses it too, before its click)
                onFocus: (e) => e.target.matches(':focus-visible') && setActive(i),
                onBlur: () => setActive(null),
                onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(i)),
              })}
              {...(back && {
                role: 'button',
                tabIndex: 0,
                'aria-label': `${back.title} background`,
                'aria-pressed': backdrop === i,
                onFocus: (e) => e.target.matches(':focus-visible') && setActive(i),
                onBlur: () => setActive(null),
                onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(i)),
              })}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((k) => (
                <path key={k} d={d} style={{ '--k': k }} />
              ))}
            </g>
          )
        })}
      </svg>
      {open != null && (
        <Window
          topic={topicOf(open)}
          pieceOf={() => pieceRefs.current[open]}
          lift={LIFTS[open % LIFTS.length]}
          onClosed={() => {
            hitRefs.current[open]?.focus({ preventScroll: true })
            setOpen(null)
            setActive(null)
          }}
        />
      )}
    </section>
  )
}

// ---------- The window: the piece's outline turning into a hexagon ----------

// An outline followed through POINTS points, evenly along it, on the screen
const sample = (path, matrix) => {
  const total = path.getTotalLength()
  return Array.from({ length: POINTS }, (_, k) => {
    const p = path.getPointAtLength((total * k) / POINTS)
    return matrix ? [matrix.a * p.x + matrix.c * p.y + matrix.e, matrix.b * p.x + matrix.d * p.y + matrix.f] : [p.x, p.y]
  })
}

const area = (pts) => pts.reduce((s, [x, y], i) => {
  const [x2, y2] = pts[(i + 1) % pts.length]
  return s + x * y2 - x2 * y
}, 0)
const middleOf = (pts) => pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0])

// The piece's points lined up with the window's: going round the same way, and starting
// where they best match (each shape around its own middle), so it turns rather than twists
const match = (from, to) => {
  const a = area(from) * area(to) < 0 ? [...from].reverse() : from
  const ma = middleOf(a)
  const mb = middleOf(to)
  let best = 0
  let bestCost = Infinity
  for (let s = 0; s < POINTS; s++) {
    let cost = 0
    for (let k = 0; k < POINTS; k += 4) {
      const p = a[(k + s) % POINTS]
      const q = to[k]
      cost += (p[0] - ma[0] - (q[0] - mb[0])) ** 2 + (p[1] - ma[1] - (q[1] - mb[1])) ** 2
    }
    if (cost < bestCost) [bestCost, best] = [cost, s]
  }
  return a.map((_, k) => a[(k + best) % POINTS])
}

// The window's place and outline: a regular hexagon in the middle of the screen, lying
// flat (wide) on wide screens and standing up (tall) on narrow ones, as big as fits
const windowShape = () => {
  const W = window.innerWidth
  const H = window.innerHeight
  const tall = W < 700
  const k = Math.sqrt(3) / 2
  // tall: pointy top, as wide as fits; wide: flat top, as tall as fits
  const w = tall ? Math.min(W * 0.96, (H * 0.86) * k) : Math.min(W * 0.92, 980, (H * 0.84) / k)
  const h = tall ? w / k : w * k
  const cx = W / 2
  const cy = H / 2 + 20
  const corners = tall
    ? [[cx, cy - h / 2], [cx + w / 2, cy - h / 4], [cx + w / 2, cy + h / 4], [cx, cy + h / 2], [cx - w / 2, cy + h / 4], [cx - w / 2, cy - h / 4]]
    : [[cx - w / 2, cy], [cx - w / 4, cy - h / 2], [cx + w / 4, cy - h / 2], [cx + w / 2, cy], [cx + w / 4, cy + h / 2], [cx - w / 4, cy + h / 2]]
  const r = Math.min(w, h) * ROUND
  const toward = (p, q, d) => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1])
    return [p[0] + ((q[0] - p[0]) * d) / l, p[1] + ((q[1] - p[1]) * d) / l]
  }
  const n = corners.length
  let d = ''
  corners.forEach((v, i) => {
    const a = toward(v, corners[(i - 1 + n) % n], r)
    const b = toward(v, corners[(i + 1) % n], r)
    d += `${i ? 'L' : 'M'} ${a[0]} ${a[1]} Q ${v[0]} ${v[1]} ${b[0]} ${b[1]} `
  })
  // the words fit in the hexagon's middle
  const inner = tall ? { w: w * 0.78, h: h * 0.56 } : { w: w * 0.56, h: h * 0.74 }
  return { d: d + 'Z', tall, cx, cy, w, h, inner }
}

const lerp = (a, b, t) => a + (b - a) * t
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const toD = (pts, dy = 0) => 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${(y + dy).toFixed(1)}`).join(' L ') + ' Z'

// An opened piece: over the page, its outline turns into the window, a rounded hexagon
// in the middle of the screen (keeping a little of its 3D button height), its name and
// words fading in inside it, and the topic's photo: with a mouse, trailing the cursor;
// on touch screens, filling the screen behind the window, which lets it show through.
// A topic can also have a photo for the cursor of its own (topic.cursor, instead of its
// piece's), and one filling the screen behind the window (topic.behind), the window
// staying plain over it; on touch screens that one fills the screen instead.
// The X, Escape or a click beside it turns it back
function Window({ topic, pieceOf, lift, onClosed }) {
  const rootRef = useRef(null)
  const sidesRef = useRef(null)
  const topRef = useRef(null)
  const helperRef = useRef(null)
  const closeRef = useRef(null)
  const titleRef = useRef(null)
  const photoRef = useRef(null)
  const [shape, setShape] = useState(windowShape)
  const [mouse] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  const leaving = useRef(false)
  const anim = useRef(0)

  // The piece's outline on the screen now, and how high it stands (px)
  const pieceNow = () => {
    const piece = pieceOf()
    const top = piece.querySelector('.pieces__top')
    const path = top.querySelector('path')
    const m = top.getScreenCTM()
    const popped = piece.classList.contains('is-active')
    return { pts: sample(path, m), depth: popped ? lift * m.a : 0 }
  }
  // Drawn at a point between the two (t: 0 the piece, 1 the window)
  const draw = (from, to, t, depth) => {
    const pts = from.map((p, k) => [lerp(p[0], to[k][0], t), lerp(p[1], to[k][1], t)])
    // the top raised by the depth, the sides stacked under it down to the base
    topRef.current.setAttribute('d', toD(pts, -depth))
    ;[...sidesRef.current.children].forEach((el, k) => el.setAttribute('d', toD(pts, -depth * (k / WINDOW_SIDES))))
  }
  const run = (from, to, depthFrom, depthTo, done) => {
    cancelAnimationFrame(anim.current)
    const start = performance.now()
    const step = (now) => {
      const t = Math.min((now - start) / MORPH, 1)
      const e = ease(t)
      draw(from, to, e, lerp(depthFrom, depthTo, e))
      if (t < 1) anim.current = requestAnimationFrame(step)
      else done?.()
    }
    anim.current = requestAnimationFrame(step)
  }
  const target = () => {
    helperRef.current.setAttribute('d', shape.d)
    return sample(helperRef.current)
  }

  useLayoutEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const to = target()
    const { pts, depth } = pieceNow()
    const from = match(pts, to)
    if (still) draw(from, to, 1, WINDOW_DEPTH)
    else run(from, to, depth, WINDOW_DEPTH)
    rootRef.current.classList.add('is-open')
    closeRef.current.focus({ preventScroll: true })
    return () => cancelAnimationFrame(anim.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => {
    if (leaving.current) return
    leaving.current = true
    rootRef.current.classList.remove('is-open')
    const from = target()
    const { pts } = pieceNow()
    run(from, match(pts, from), WINDOW_DEPTH, 0, onClosed)
  }

  // Escape closes it; the page stays put under it; a new screen size moves it
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close()
    const onResize = () => setShape(windowShape())
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    const html = document.documentElement
    const was = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      html.style.overflow = was
    }
  })
  // The photo trailing the mouse: starting where it clicked (or the window's middle)
  useEffect(() => {
    if (!mouse) return
    const el = photoRef.current
    const at = { x: lastClick.x ?? window.innerWidth / 2, y: lastClick.y ?? window.innerHeight / 2 }
    const to = { ...at }
    let raf = 0
    const place = () => (el.style.transform = `translate(${at.x + TRAIL_OFFSET}px, ${at.y + TRAIL_OFFSET}px)`)
    const frame = () => {
      at.x += (to.x - at.x) * TRAIL
      at.y += (to.y - at.y) * TRAIL
      place()
      raf = requestAnimationFrame(frame)
    }
    const onMove = (e) => {
      to.x = e.clientX
      to.y = e.clientY
    }
    place()
    el.classList.add('is-on')
    raf = requestAnimationFrame(frame)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [mouse])

  useEffect(() => {
    if (leaving.current) return
    const to = target()
    draw(to, to, 1, WINDOW_DEPTH)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape])

  // The name on one line, as big as set but never wider than the words' room: shrunk to
  // fit if it's a long one (and again when the window changes size)
  useLayoutEffect(() => {
    const el = titleRef.current
    el.style.fontSize = ''
    const room = el.parentElement.clientWidth
    const fits = () => el.scrollWidth <= room
    if (fits()) return
    el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * (room / el.scrollWidth) * 0.97}px`
  }, [shape, topic.title])

  return createPortal(
    <div ref={rootRef} className={`window${mouse ? '' : ' is-touch'}`} role="dialog" aria-modal="true" aria-label={topic.title} style={{ '--morph': `${MORPH}ms` }}>
      <div className="window__backdrop" onClick={close} />
      {mouse && topic.behind && (
        <div className="window__behind" style={{ backgroundImage: `url("${topic.behind.src}")` }} aria-hidden="true" />
      )}
      <svg className="window__shape" aria-hidden="true">
        <path ref={helperRef} className="window__helper" />
        <g ref={sidesRef}>
          {Array.from({ length: WINDOW_SIDES }, (_, k) => (
            <path key={k} className="window__side" />
          ))}
        </g>
        <path ref={topRef} className="window__top" />
      </svg>
      <div
        className={`window__words${shape.tall ? ' is-tall' : ''}`}
        style={{
          left: shape.cx - shape.inner.w / 2,
          top: shape.cy - WINDOW_DEPTH - shape.inner.h / 2,
          width: shape.inner.w,
          height: shape.inner.h,
        }}
      >
        <button ref={closeRef} type="button" className="window__close" onClick={close} aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
        <h2 ref={titleRef} className="display window__title">{topic.title}</h2>
        {topic.text && <p className="window__text">{topic.text}</p>}
      </div>
      <img
        ref={photoRef}
        className="window__photo"
        src={(mouse ? topic.cursor ?? topic.image : topic.behind ?? topic.cursor ?? topic.image).src}
        alt=""
        aria-hidden="true"
      />
    </div>,
    document.body,
  )
}
