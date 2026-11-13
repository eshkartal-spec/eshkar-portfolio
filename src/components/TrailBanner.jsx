import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './TrailBanner.css'

// ---- Placing the drawing ----
const LOGO_W = 0.42 // the logo's width, as a share of the banner's (0.8 on narrow screens)...
const LOGO_H = 0.5 // ...but no more than this share of its height
const LOGO_Y = 0.4 // where the logo's middle sits, down the banner (clear of the title)
const BLEED = 1.08 // the trail runs this much past the banner's top and bottom (if the logo
// still fits across: no more than this share of the banner's width)
const LOGO_MAX_W = 0.9
// ---- The logo's pieces as 3D buttons ----
const LAYERS = 16 // each button's sides drawn as this many outlines stacked up its height
const HIGH = [26, 12, 40, 18, 48, 32, 58] // how high each piece rises at most (drawing units)...
const LOW = 0.15 // ...and sinks back to, as a share of that
const TIME = [3.4, 5.6] // s for one rise (least, most)
// -----------------------------

// The drawing's paths: the trail's tiles and the logo's pieces (drawn in outline in the
// file), with each one's outline
const read = (svg) => {
  const paths = [...svg.matchAll(/<path\b[^>]*>/g)].map((m) => m[0])
  const d = (p) => p.match(/\sd="([^"]+)"/)[1]
  return {
    viewBox: svg.match(/viewBox="([^"]+)"/)[1],
    logo: paths.filter((p) => /cls-1/.test(p)).map(d),
    tiles: paths.filter((p) => !/cls-1/.test(p)).map(d),
  }
}

// A banner made from a drawing of a trail of tiles like the brand's logo, the logo's own
// seven pieces among them (art: the SVG's text; the logo's pieces are its outlined
// paths). All drawn in fine outline. The drawing is placed so the logo sits clearly in
// the middle, above the title, the trail running off the edges as it may. The logo's
// pieces rise and sink slowly as 3D buttons, each to its own height, on its own beat; the
// trail stays still. With a mouse, a tile under the cursor fills with the brand's blue,
// fading back as the cursor moves on; over the logo, its pieces all turn blue and settle
// together, raised.
// photo (optional): a photo laid under the drawing, its own path lined up with the tiles:
// { src, at: [x, y] a point on the photo's path (its pixels), to: [x, y] the point of the
// drawing it lands on, scale (drawing units per photo pixel), angle (degrees), mirror }
export default function TrailBanner({ art, color = '#5f8797', photo }) {
  const drawing = useMemo(() => read(art), [art])
  const ref = useRef(null)
  const allRef = useRef(null)
  const logoRef = useRef(null)
  const [size, setSize] = useState(null)
  const [box, setBox] = useState(null)

  useEffect(() => {
    const el = ref.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The extents of the logo and of the whole drawing, and the logo's pieces in order from
  // the back (highest on screen) to the front, so a piece in front, rising, always passes
  // over the ones behind it (measured once it's drawn)
  useLayoutEffect(() => {
    if (!box && logoRef.current) {
      const flat = (b) => ({ x: b.x, y: b.y, w: b.width, h: b.height })
      const pieces = [...logoRef.current.querySelectorAll('.trail__top')].map((el) => flat(el.getBBox()))
      setBox({
        logo: flat(logoRef.current.getBBox()),
        all: flat(allRef.current.getBBox()),
        order: pieces.map((b, i) => [b.y + b.h, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i),
      })
    }
  })

  // Scaled and moved so the logo sits where it should on the banner, and big enough that
  // the trail runs off its top and bottom (unless that would push the logo off its sides)
  let place = 'translate(-9999 -9999)'
  if (size && box) {
    const { logo, all } = box
    const cy = logo.y + logo.h / 2
    let s = Math.min((size.w * (size.w < 700 ? 0.8 : LOGO_W)) / logo.w, (size.h * LOGO_H) / logo.h)
    const bleed = BLEED * Math.max((LOGO_Y * size.h) / (cy - all.y), ((1 - LOGO_Y) * size.h) / (all.y + all.h - cy))
    s = Math.max(s, Math.min(bleed, (size.w * LOGO_MAX_W) / logo.w))
    const x = size.w / 2 - (logo.x + logo.w / 2) * s
    const y = size.h * LOGO_Y - cy * s
    place = `translate(${x} ${y}) scale(${s})`
  }
  const order = box?.order ?? drawing.logo.map((_, i) => i)

  const beats = useMemo(
    () =>
      drawing.logo.map((_, i) => ({
        '--high': `${-HIGH[i % HIGH.length]}px`,
        '--low': `${-HIGH[i % HIGH.length] * LOW}px`,
        '--time': `${TIME[0] + ((i * 0.61) % 1) * (TIME[1] - TIME[0])}s`,
        '--delay': `${-i * 0.9}s`,
      })),
    [drawing],
  )

  return (
    <div ref={ref} className="trail" style={{ '--trail-color': color }} aria-hidden="true">
      <svg className="trail__svg" width="100%" height="100%">
        <g transform={place}>
          {photo && (
            <defs>
              {/* (its edges fading softly into the page) */}
              <radialGradient id="trail-photo-fade" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.55" stopColor="#fff" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="trail-photo-mask" maskContentUnits="objectBoundingBox">
                <rect width="1" height="1" fill="url(#trail-photo-fade)" />
              </mask>
            </defs>
          )}
          {photo && (
            <image
              className="trail__photo"
              mask="url(#trail-photo-mask)"
              href={photo.src}
              width={photo.size[0]}
              height={photo.size[1]}
              transform={`translate(${photo.to[0]} ${photo.to[1]}) rotate(${photo.angle}) scale(${photo.mirror ? -photo.scale : photo.scale} ${photo.scale}) translate(${-photo.at[0]} ${-photo.at[1]})`}
            />
          )}
          <g ref={allRef}>
          {drawing.tiles.map((d, i) => (
            <path key={i} className="trail__tile" d={d} />
          ))}
          <g ref={logoRef} className="trail__logo">
            {order.map((i) => drawing.logo[i]).map((d, j) => (
              <g key={order[j]} className="trail__piece" style={beats[order[j]]}>
                {Array.from({ length: LAYERS }, (_, k) => (
                  <path key={k} className="trail__side" d={d} style={{ '--k': k / LAYERS }} />
                ))}
                <path className="trail__top" d={d} />
              </g>
            ))}
          </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
