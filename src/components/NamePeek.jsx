import { useEffect, useRef, useState } from 'react'
import './NamePeek.css'

// A word that turns pink on hover and brings up a full-color photo that follows the cursor.
// On touch screens a tap shows the photo where the finger is; another tap (or scrolling) hides it.
export default function NamePeek({ word, image }) {
  const [on, setOn] = useState(false)
  const photoRef = useRef(null)

  const moveTo = (e) => {
    const el = photoRef.current
    if (!el) return
    el.style.setProperty('--x', `${e.clientX}px`)
    el.style.setProperty('--y', `${e.clientY}px`)
  }

  useEffect(() => {
    if (!on) return
    const hide = () => setOn(false)
    window.addEventListener('scroll', hide, { passive: true })
    return () => window.removeEventListener('scroll', hide)
  }, [on])

  return (
    <span
      className={`name-peek${on ? ' is-on' : ''}`}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return
        moveTo(e)
        setOn(true)
      }}
      onPointerMove={(e) => e.pointerType === 'mouse' && moveTo(e)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOn(false)}
      onPointerUp={(e) => {
        if (e.pointerType === 'mouse') return
        moveTo(e)
        setOn((v) => !v)
      }}
    >
      {word}
      <span ref={photoRef} className="name-peek__photo" aria-hidden="true">
        <img src={image.src} alt="" />
      </span>
    </span>
  )
}
