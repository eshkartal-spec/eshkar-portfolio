import { useEffect, useMemo, useRef, useState } from 'react'
import './BounceVideo.css'

const GAP = 18 // px between the cursor and the prompt

// A short clip of the piece being nudged and rocking until it settles, as a full-screen
// banner, played from the start at each click (or tap) on it (its slowing to a stop at
// the end is in the clip itself: scripts/optimize-images.mjs). On entering the page it
// waits under a soft grey veil with a grey dot pulsing in its middle; the first click
// lifts it and plays. The prompt to nudge it follows the cursor throughout (on touch
// screens it sits on the floor in front of the piece, once the veil is lifted), whenever
// it's still. Until it plays it shows its last
// frame, at rest (`video.poster`). Optionally the clip's bottom is softly blurred
// (`video.blurBottom`: how much of its height), to hide specks on the piece there.
export default function BounceVideo({ video }) {
  const ref = useRef(null)
  const tipRef = useRef(null)
  const [moving, setMoving] = useState(false)
  const [over, setOver] = useState(false)
  const [veiled, setVeiled] = useState(true) // until the first click
  const touch = useMemo(() => window.matchMedia('(hover: none)').matches, [])

  const play = () => {
    const v = ref.current
    setVeiled(false)
    v.currentTime = 0
    v.play()
      .then(() => setMoving(true))
      .catch(() => {})
  }

  useEffect(() => {
    const v = ref.current
    const onEnd = () => setMoving(false)
    v.addEventListener('ended', onEnd)
    return () => v.removeEventListener('ended', onEnd)
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
      className={`bounce${moving ? ' is-moving' : ''}${veiled ? ' is-veiled' : ''}`}
      style={{ '--blur-h': video.blurBottom }}
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
      {video.blurBottom && <span className="bounce__blur" aria-hidden="true" />}
      {/* (on entering: the veil and its pulsing dot, until the first click) */}
      <span className="bounce__veil" aria-hidden="true">
        <span className="bounce__dot" />
      </span>
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
