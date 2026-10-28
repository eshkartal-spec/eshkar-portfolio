import { useEffect, useMemo, useState } from 'react'
import './SwapPhoto.css'

const TURN = 1400 // ms each photo stays

// Two photos in one frame, taking turns by themselves. With `hover`, the second instead
// fades in on hover where there's a cursor (and they still take turns without one).
export default function SwapPhoto({ images: [first, second], hover = false }) {
  const loops = useMemo(() => !hover || window.matchMedia('(hover: none)').matches, [hover])
  const [turned, setTurned] = useState(false)
  useEffect(() => {
    if (!loops) return
    const id = setInterval(() => setTurned((t) => !t), TURN)
    return () => clearInterval(id)
  }, [loops])

  return (
    <figure className={`swap${turned ? ' is-turned' : ''}${loops ? '' : ' swap--hover'}`}>
      <img src={first.src} alt={first.alt} loading="lazy" />
      <img className="swap__second" src={second.src} alt={second.alt} loading="lazy" />
    </figure>
  )
}
