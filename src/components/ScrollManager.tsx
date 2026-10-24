import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scroll handling for the SPA (BrowserRouter has no built-in scroll restoration):
 *  - a new route starts at the top;
 *  - a URL with a #hash scrolls to that element once it has rendered, including on a
 *    cold load of e.g. /#projects and after a lazily loaded page arrives;
 *  - Back/Forward returns to where the visitor was on that history entry.
 */
const positions = new Map<string, number>()
const WAIT_MS = 3000

export default function ScrollManager() {
  const location = useLocation()
  const navType = useNavigationType()
  // Entries made by the first load or by a plain #fragment change all share the key 'default',
  // so positions are stored per entry, path and fragment together.
  const entryKey = `${location.key}|${location.pathname}|${location.hash}`
  const keyRef = useRef(entryKey)
  // Path of the previous history entry, recorded once per entry (effects may re-run in StrictMode).
  const nav = useRef<{ key: string | null; path: string | null; prevPath: string | null }>({ key: null, path: null, prevPath: null })

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => { frame = 0; positions.set(keyRef.current, window.scrollY) })
    }
    // A fragment-only change made outside the router (editing the #part of the address) doesn't
    // always reach useLocation, so handle it directly.
    const onHashChange = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', onHashChange)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    keyRef.current = entryKey
    if (nav.current.key !== location.key) {
      nav.current = { key: location.key, path: location.pathname, prevPath: nav.current.path }
    }
    const firstRender = nav.current.prevPath === null
    const samePage = nav.current.prevPath === location.pathname

    // Jumping across pages should land instantly; within a page, 'auto' defers to the CSS
    // scroll-behavior (smooth, unless the visitor prefers reduced motion).
    const behavior: ScrollBehavior = samePage ? 'auto' : 'instant'
    const saved = navType === 'POP' ? positions.get(entryKey) : undefined
    const id = location.hash ? decodeURIComponent(location.hash.slice(1)) : ''

    if (!id && saved === undefined) {
      if (!firstRender) window.scrollTo({ top: 0, left: 0, behavior })
      return
    }

    // The target may not exist yet (lazy route, first render), so retry on each frame for a while.
    const start = performance.now()
    let raf = 0
    const attempt = () => {
      if (saved !== undefined) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        if (max >= saved - 1 || performance.now() - start > WAIT_MS) {
          window.scrollTo({ top: saved, left: 0, behavior: 'instant' })
          return
        }
      } else {
        const el = document.getElementById(id)
        if (el) { el.scrollIntoView({ behavior, block: 'start' }); return }
        if (performance.now() - start > WAIT_MS) return
      }
      raf = requestAnimationFrame(attempt)
    }
    attempt()
    return () => cancelAnimationFrame(raf)
  }, [location.key, location.pathname, location.hash, navType, entryKey])

  return null
}
