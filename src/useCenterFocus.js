import { useEffect } from 'react'

const CLEAR = 0.12 // within this share of the screen height from the middle: fully clear
const RAMP = 0.33 // then fully frosted this much further out

// Sets --frost (0–1) on every element matching `selector`, by how far its middle
// is from the middle of the screen: 0 at the middle, 1 further away.
export function useCenterFocus(selector) {
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const mid = window.innerHeight / 2
      for (const el of document.querySelectorAll(selector)) {
        const r = el.getBoundingClientRect()
        if (r.bottom < 0 || r.top > window.innerHeight) continue
        const d = Math.abs(r.top + r.height / 2 - mid) / window.innerHeight
        const frost = Math.min(Math.max((d - CLEAR) / RAMP, 0), 1)
        el.style.setProperty('--frost', frost.toFixed(3))
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [selector])
}
