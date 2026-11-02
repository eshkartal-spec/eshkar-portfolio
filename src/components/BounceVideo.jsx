import { useEffect, useMemo, useRef, useState } from 'react'
import './BounceVideo.css'

const GAP = 18 // px between the cursor and the prompt

// A short clip of the piece being nudged and rocking until it settles, as a full-screen
// banner: it plays once when it first comes into view, then again from the start at each
// click (or tap) on it. The prompt to nudge it follows the cursor (on touch screens it
// sits on the floor in front of the piece), whenever it's still. Until it first plays it
// shows its last frame, at rest (`video.poster`). With reduced motion it only plays when
// clicked.
export default function BounceVideo({ video }) {
  const ref = useRef(null)
  const tipRef = useRef(null)
  const [moving, setMoving] = useState(false)
  const [over, setOver] = useState(false)
  const touch = useMemo(() => window.matchMedia('(hover: none)').matches, [])

  const play = () => {
    const v = ref.current
    v.currentTime = 0
    v.play()
      .then(() => setMoving(true))
      .catch(() => {})
  }

  useEffect(() => {
    const v = ref.current
    const onEnd = () => setMoving(false)
    v.addEventListener('ended', onEnd)
    // Once, as it first comes into view
    let io
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.intersectionRatio < 0.5) return
          io.disconnect()
          v.currentTime = 0
          v.play()
            .then(() => setMoving(true))
            .catch(() => {})
        },
        { threshold: [0, 0.5] },
      )
      io.observe(v)
    }
    return () => {
      io?.disconnect()
      v.removeEventListener('ended', onEnd)
    }
  }, [])

  // The prompt beside the cursor, flipped to its other side near the screen's edges
  const follow = (e) => {
    const t = tipRef.current
    if (!t) return
    const x = e.clientX + GAP + t.offsetWidth > window.innerWidth ? e.clientX - GAP - t.offsetWidth : e.clientX + GAP
    const y = e.clientY + GAP + t.offsetHeight > window.innerHeight ? e.clientY - GAP - t.offsetHeight : e.clientY + GAP
    t.style.transform = `translate(${x}px, ${y}px)`
  }

  return (
    <button
      type="button"
      className={`bounce${moving ? ' is-moving' : ''}`}
      onClick={play}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return
        setOver(true)
        follow(e)
      }}
      onPointerMove={(e) => e.pointerType === 'mouse' && follow(e)}
      onPointerLeave={() => setOver(false)}
      aria-label={`${video.alt}: play it again`}
    >
      <video ref={ref} className="bounce__video" src={video.src} poster={video.poster} muted playsInline preload="auto" />
      {touch ? (
        <span className="label bounce__prompt" aria-hidden="true">
          <span className="bounce__ring" />
          Tap to nudge it
        </span>
      ) : (
        <span ref={tipRef} className={`label bounce__tip${over ? ' is-on' : ''}`} aria-hidden="true">
          <span className="bounce__blink">Click</span> to nudge it
        </span>
      )}
    </button>
  )
}
