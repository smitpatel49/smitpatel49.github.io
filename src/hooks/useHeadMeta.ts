import { useEffect } from 'react'

const SITE_URL = 'https://smitpatel49.github.io'
const DEFAULT_TITLE = 'Smit Patel · Portfolio'
const DEFAULT_OG_TITLE = 'Smit Patel: Data Scientist & Analytics Professional'
const DEFAULT_DESCRIPTION = "Turning ambiguous business problems into decisions and systems through data analysis, statistical modeling, and production ML."

function setMetaContent(selector: string, value: string) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute('content', value)
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Sets the document title, meta description, Open Graph / Twitter tags, and
 * canonical link for the currently mounted route, and restores the site-wide
 * defaults on unmount (route change). Pure DOM effect, no dependency needed
 * since this is a client-only SPA with no server-side rendering.
 */
export function useHeadMeta(opts?: { title?: string; description?: string; path?: string }) {
  useEffect(() => {
    const path = opts?.path ?? '/'
    const url = SITE_URL + path
    const title = opts?.title ? `${opts.title} · Smit Patel` : DEFAULT_TITLE
    const ogTitle = opts?.title ? `${opts.title} · Smit Patel` : DEFAULT_OG_TITLE
    const description = opts?.description ?? DEFAULT_DESCRIPTION

    document.title = title
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', ogTitle)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="og:url"]', url)
    setMetaContent('meta[name="twitter:title"]', ogTitle)
    setMetaContent('meta[name="twitter:description"]', description)
    setCanonical(url)

    return () => {
      document.title = DEFAULT_TITLE
      setMetaContent('meta[name="description"]', DEFAULT_DESCRIPTION)
      setMetaContent('meta[property="og:title"]', DEFAULT_OG_TITLE)
      setMetaContent('meta[property="og:description"]', DEFAULT_DESCRIPTION)
      setMetaContent('meta[property="og:url"]', SITE_URL + '/')
      setMetaContent('meta[name="twitter:title"]', DEFAULT_OG_TITLE)
      setMetaContent('meta[name="twitter:description"]', DEFAULT_DESCRIPTION)
      setCanonical(SITE_URL + '/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.title, opts?.description, opts?.path])
}
