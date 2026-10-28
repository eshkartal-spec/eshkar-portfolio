import { useEffect, useRef } from 'react'
import './ScrubVideo.css'

const EASE = 0.15 // how quickly the video catches up with the scroll (0–1), so it glides

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// A video played by scrolling: the section is a few screens tall and the video stays on
// screen while you scroll through it, each scroll position showing its moment of the
// video (forward scrolling down, backward scrolling up). `children` sit over it.
export default function ScrubVideo({ video, children }) {
  const trackRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const v = videoRef.current
    let raf = 0
    let shown = 0 // the moment on screen, 0–1, easing toward the scroll's
    const scrolled = () => {
      const r = track.getBoundingClientRect()
      const run = r.height - window.innerHeight
      return run > 0 ? clamp(-r.top / run, 0, 1) : 0
    }
    const frame = () => {
      shown += (scrolled() - shown) * EASE
      // One jump at a time: a new one only once the last has landed
      if (v.duration && !v.seeking) {
        const t = shown * (v.duration - 0.05)
        if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t
      }
      raf = requestAnimationFrame(frame)
    }
    // Phones only draw a video's frames once it has played: a silent play and pause
    const wake = () => v.play().then(() => v.pause()).catch(() => {})
    if (v.readyState >= 1) wake()
    else v.addEventListener('loadedmetadata', wake, { once: true })
    // Only while the section is on screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) {
        shown = scrolled()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(track)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={trackRef} className="scrub">
      <div className="scrub__view">
        <video
          ref={videoRef}
          className="scrub__video"
          src={video.src}
          poster={video.poster}
          muted
          playsInline
          preload="auto"
        />
        <div className="scrub__text wrap">{children}</div>
      </div>
    </section>
  )
}
