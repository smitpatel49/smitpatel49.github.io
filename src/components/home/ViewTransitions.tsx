import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom'

/*
 * Cross-fade between pages with the View Transitions API, on top of BrowserRouter (which has no
 * built-in support; that needs a data router). How it works:
 *  - a capture-phase click listener on document runs before React Router's <Link> handler; for a
 *    plain click on an internal link to another page it cancels the default (Link then skips its
 *    own navigation, because it checks defaultPrevented) and navigates inside
 *    document.startViewTransition;
 *  - the update callback resolves once the new location has committed. Navigation runs in a
 *    React transition (v7_startTransition), so a not-yet-loaded case-study chunk keeps the old
 *    page on screen until it arrives rather than flashing the Suspense fallback;
 *  - unsupported browsers, reduced motion, same-page #fragment links, modified clicks, new tabs
 *    and Back/Forward all fall through to normal navigation.
 */

type DocumentWithVT = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => {
    ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>
  }
}

// Longer than any normal chunk load; past it the transition gives up and the page just appears.
const MAX_WAIT_MS = 2500
const APP_ROUTE = /^\/(projects\/[\w-]+\/?)?$/
let pendingCommit: (() => void) | null = null

function canTransition(): boolean {
  return typeof (document as DocumentWithVT).startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Navigate to `to`, cross-fading if it's another page and the browser supports it. Also used by
 * the command menu, so its jumps match link clicks.
 */
export function navigateWithTransition(navigate: NavigateFunction, to: string) {
  const target = new URL(to, window.location.href)
  if (target.pathname === window.location.pathname || !canTransition()) { navigate(to); return }
  const vt = (document as DocumentWithVT).startViewTransition!(() => new Promise<void>(resolve => {
    const timeout = window.setTimeout(done, MAX_WAIT_MS)
    function done() { window.clearTimeout(timeout); pendingCommit = null; resolve() }
    pendingCommit = done
    navigate(to)
  }))
  // A skipped or timed-out transition rejects these; the navigation itself has still happened.
  vt.ready.catch(() => {})
  vt.finished.catch(() => {})
  vt.updateCallbackDone.catch(() => {})
}

/** Mount once inside the router (App does). Renders nothing. */
export default function ViewTransitions() {
  const navigate = useNavigate()
  const location = useLocation()

  // Runs after the DOM for the new location is in place, before paint: release the transition.
  useLayoutEffect(() => { pendingCommit?.() }, [location.key])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (!(e.target instanceof Element)) return
      const a = e.target.closest('a')
      if (!a || !a.href || a.hasAttribute('download') || (a.target && a.target !== '_self')) return
      const url = new URL(a.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      // Only the app's own routes: files under /public (dashboards, media) need a real page load.
      if (!APP_ROUTE.test(url.pathname)) return
      if (!canTransition()) return
      e.preventDefault()
      navigateWithTransition(navigate, url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate])

  return null
}
