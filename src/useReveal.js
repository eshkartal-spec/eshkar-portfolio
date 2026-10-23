import { useEffect } from 'react'

// Adds .is-in to every .reveal element as it scrolls into view, once.
// Runs again whenever `key` changes (a new page).
export function useReveal(key) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-in)')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
}
