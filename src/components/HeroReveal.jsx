import { useEffect, useRef } from 'react'
import './HeroReveal.css'

// A black-and-white photo; moving the cursor paints the color version back in,
// as a soft trail that follows the cursor and slowly fades.
// On touch screens the trail drifts on its own; with reduced motion it stays still.

const FOLLOW = 0.16 // how quickly the trail catches up with the cursor (0–1)
const FADE = 0.045 // how quickly the color fades back out, per frame
const SIZE = 0.13 // brush radius, as a share of the larger side of the photo
const MAX_DPR = 1.5

// Draws the image into a canvas of size w×h, cropped like CSS object-fit: cover
function drawCover(ctx, img, w, h, posX, posY) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  ctx.drawImage(img, (w - dw) * posX, (h - dh) * posY, dw, dh)
}

// A soft round brush, drawn once and stamped along the cursor's path
function makeBrush() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d').createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(0.45, 'rgba(0,0,0,0.85)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  const ctx = c.getContext('2d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return c
}

export default function HeroReveal({ image }) {
  const [posX, posY] = image.position ?? [0.5, 0.5]
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    // Listen on the whole hero, so text laid over the photo doesn't block the cursor
    const area = wrap.parentElement
    const canvas = canvasRef.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    const trail = document.createElement('canvas')
    const tctx = trail.getContext('2d')
    const color = document.createElement('canvas')
    const brush = makeBrush()
    const img = new Image()
    img.src = image.src

    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let visible = true
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let active = false // cursor is over the photo
    let started = false // first move seen, so the trail doesn't streak in from a corner
    const autoDrift = window.matchMedia('(hover: none)').matches
    const t0 = performance.now()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      w = Math.round(wrap.clientWidth * dpr)
      h = Math.round(wrap.clientHeight * dpr)
      for (const c of [canvas, trail, color]) {
        c.width = w
        c.height = h
      }
      if (img.complete && img.naturalWidth) drawCover(color.getContext('2d'), img, w, h, posX, posY)
    }
    img.onload = resize

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect()
      target.x = (e.clientX - r.left) * dpr
      target.y = (e.clientY - r.top) * dpr
      if (!started) {
        pos.x = target.x
        pos.y = target.y
        started = true
      }
      active = true
    }
    const onLeave = () => {
      active = false
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || !w) return

      if (autoDrift) {
        // A slow, looping path across the photo
        const t = (now - t0) / 1000
        target.x = w * (0.5 + 0.32 * Math.sin(t * 0.45))
        target.y = h * (0.45 + 0.22 * Math.sin(t * 0.7 + 1))
        if (!started) Object.assign(pos, target)
        started = active = true
      }

      // Fade what's already painted
      tctx.globalCompositeOperation = 'destination-out'
      tctx.fillStyle = `rgba(0,0,0,${FADE})`
      tctx.fillRect(0, 0, w, h)
      tctx.globalCompositeOperation = 'source-over'

      // Ease toward the cursor and stamp the brush along the way
      const px = pos.x
      const py = pos.y
      pos.x += (target.x - pos.x) * FOLLOW
      pos.y += (target.y - pos.y) * FOLLOW
      if (active && started) {
        const dist = Math.hypot(pos.x - px, pos.y - py)
        // Faster moves make a slightly wider stroke
        const r = Math.max(w, h) * SIZE * (0.75 + Math.min(dist / (60 * dpr), 1) * 0.5)
        const steps = Math.max(1, Math.ceil(dist / (r * 0.2)))
        for (let i = 1; i <= steps; i++) {
          const x = px + ((pos.x - px) * i) / steps
          const y = py + ((pos.y - py) * i) / steps
          tctx.drawImage(brush, x - r, y - r, r * 2, r * 2)
        }
      }

      // Show the color photo only where the trail is
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(trail, 0, 0)
      ctx.globalCompositeOperation = 'source-in'
      ctx.drawImage(color, 0, 0)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(wrap)
    area.addEventListener('pointermove', onMove)
    area.addEventListener('pointerdown', onMove)
    area.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerdown', onMove)
      area.removeEventListener('pointerleave', onLeave)
    }
  }, [image.src, posX, posY])

  return (
    <div ref={wrapRef} className="reveal-photo">
      <img
        src={image.src}
        alt={image.alt}
        className="reveal-photo__bw"
        style={{ objectPosition: `${posX * 100}% ${posY * 100}%` }}
      />
      <canvas ref={canvasRef} className="reveal-photo__color" aria-hidden="true" />
    </div>
  )
}
