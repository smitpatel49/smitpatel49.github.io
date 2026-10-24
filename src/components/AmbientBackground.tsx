
import React, { useEffect, useRef } from 'react'

// Sitewide ambient backdrop, used on every page (home + all project pages).
// Two things live here:
//   1. A faint dot/link particle network, with a cursor tether that only
//      lights up once the pointer is out past the text column.
//   2. A soft dark wash on the gutters themselves, fading to nothing right
//      at the content edge, so wide screens read as "framed" rather than
//      blank on the sides.
// On a wide screen (a real gutter on both sides of the content column),
// particles are only ever placed in those gutters, so the content column
// stays completely clear and the cursor tether only shows out there. On a
// narrow/mobile viewport, where there's no gutter to speak of, this instead
// falls back to the low-density, full-width sprinkle the site always had on
// phones (no tether there, since it's a touch device anyway) so the motif
// stays consistent everywhere rather than disappearing on mobile.
// Width of the clear band kept free of particles in the middle of the screen. The text column
// itself is narrower (.section / .container-narrow are max-w-4xl, 896px), so this leaves
// about 64px of extra clearance on each side of it.
const CONTENT_MAX_WIDTH = 1024
const GUTTER_FEATHER = 90 // px of soft fade between the content edge and full tether effect
const MIN_GUTTER = 40 // px; below this, a side gutter is too narrow to bother placing dots in
const GUTTER_DENSITY = 8500 // px^2 of gutter area per particle (wide screens)
const NARROW_DENSITY = 27000 // px^2 of viewport area per particle (narrow/mobile fallback)

export default function AmbientBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!

    type P = { x: number; y: number; vx: number; vy: number; r: number; minX: number; maxX: number }
    let contentLeft = 0, contentRight = 0, hasGutter = false

    const makePts = (w: number, h: number) => {
      const half = Math.min(CONTENT_MAX_WIDTH, w) / 2
      contentLeft = w / 2 - half
      contentRight = w / 2 + half
      hasGutter = contentLeft >= MIN_GUTTER
      const pts: P[] = []
      if (hasGutter) {
        const gutterArea = contentLeft * h * 2
        const count = Math.max(0, Math.min(70, Math.round(gutterArea / GUTTER_DENSITY)))
        for (let i = 0; i < count; i++) {
          const onLeft = i % 2 === 0
          const minX = onLeft ? 0 : contentRight
          const maxX = onLeft ? contentLeft : w
          const x = minX + Math.random() * (maxX - minX)
          pts.push({ x, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.6 + 1.3, minX, maxX })
        }
      } else {
        // No real gutter (phones, narrow tablets): a low-density sprinkle
        // across the full width instead, so the motif doesn't just vanish.
        const count = Math.max(8, Math.min(18, Math.round((w * h) / NARROW_DENSITY)))
        for (let i = 0; i < count; i++) {
          pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 1.1, minX: 0, maxX: w })
        }
      }
      return pts
    }

    // Draw in CSS pixels on a backing store scaled by devicePixelRatio, so lines stay crisp.
    let w = 0, h = 0
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
      c.style.width = w + 'px'; c.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    let pts: P[] = makePts(w, h)
    let mx = -9999, my = -9999
    const onM = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onM)
    const linkDist = 110

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      const outside = mx < contentLeft ? contentLeft - mx : mx > contentRight ? mx - contentRight : 0
      const gutterFactor = hasGutter ? Math.max(0, Math.min(1, outside / GUTTER_FEATHER)) : 0
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        ctx.strokeStyle = 'rgba(120,120,120,0.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke()
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j]; const dx = p.x - q.x, dy = p.y - q.y; const d = Math.hypot(dx, dy)
          if (d < linkDist) { ctx.strokeStyle = `rgba(120,120,120,${0.12 * (1 - d / linkDist)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke() }
        }
        if (gutterFactor > 0) {
          const dm = Math.hypot(p.x - mx, p.y - my)
          if (dm < 160) { ctx.strokeStyle = `rgba(120,120,120,${0.55 * gutterFactor * (1 - dm / 160)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke() }
        }
      }
      if (gutterFactor > 0) { ctx.strokeStyle = `rgba(120,120,120,${0.5 * gutterFactor})`; ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2); ctx.stroke() }
    }

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let af = 0
    const loop = () => {
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < p.minX || p.x > p.maxX) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      }
      draw(); af = requestAnimationFrame(loop)
    }
    // Animate only while the tab is visible and motion is welcome; otherwise draw one static frame.
    const start = () => {
      cancelAnimationFrame(af); af = 0
      if (document.hidden) return
      if (reducedQuery.matches) draw()
      else loop()
    }
    const onResize = () => { size(); pts = makePts(w, h); if (!af) draw() }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', start)
    reducedQuery.addEventListener('change', start)
    start()
    return () => {
      cancelAnimationFrame(af)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onM)
      document.removeEventListener('visibilitychange', start)
      reducedQuery.removeEventListener('change', start)
    }
  }, [])

  const gutterStyle: React.CSSProperties = { width: `max(0px, calc((100vw - ${CONTENT_MAX_WIDTH}px) / 2))` }
  return (
    <>
      <div aria-hidden='true' className='pointer-events-none fixed inset-y-0 left-0 -z-10 bg-gradient-to-r from-black/[0.07] to-transparent dark:from-black/[0.32]' style={gutterStyle} />
      <div aria-hidden='true' className='pointer-events-none fixed inset-y-0 right-0 -z-10 bg-gradient-to-l from-black/[0.07] to-transparent dark:from-black/[0.32]' style={gutterStyle} />
      <canvas ref={ref} aria-hidden='true' className='pointer-events-none fixed inset-0 -z-10' />
    </>
  )
}
