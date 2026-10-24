import { useEffect } from 'react'

// Keep these in sync with index.html and scripts/postbuild.mjs, which writes the same tags
// into the prerendered HTML for each case study.
export const SITE_URL = 'https://smitpatel49.github.io'
const DEFAULT_TITLE = 'Smit Patel · Portfolio'
const DEFAULT_OG_TITLE = 'Smit Patel: Data Scientist & Analytics Professional'
const DEFAULT_DESCRIPTION = 'Turning ambiguous business problems into decisions and systems through data analysis, statistical modeling, and production ML.'

function setMetaContent(selector: string, value: string) {
  document.head.querySelector(selector)?.setAttribute('content', value)
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (href === null) { el?.remove(); return }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setNoindex(noindex: boolean) {
  let el = document.head.querySelector('meta[name="robots"]')
  if (!noindex) { el?.remove(); return }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'robots')
    document.head.appendChild(el)
  }
  el.setAttribute('content', 'noindex')
}

type Head = { title: string; ogTitle: string; description: string; url: string | null; type: string; noindex: boolean }

function apply(h: Head) {
  document.title = h.title
  setMetaContent('meta[name="description"]', h.description)
  setMetaContent('meta[property="og:type"]', h.type)
  setMetaContent('meta[property="og:title"]', h.ogTitle)
  setMetaContent('meta[property="og:description"]', h.description)
  setMetaContent('meta[property="og:url"]', h.url ?? SITE_URL + '/')
  setMetaContent('meta[name="twitter:title"]', h.ogTitle)
  setMetaContent('meta[name="twitter:description"]', h.description)
  setCanonical(h.url)
  setNoindex(h.noindex)
}

const HOME: Head = { title: DEFAULT_TITLE, ogTitle: DEFAULT_OG_TITLE, description: DEFAULT_DESCRIPTION, url: SITE_URL + '/', type: 'website', noindex: false }

/**
 * Sets the document title, meta description, Open Graph / Twitter tags, canonical link and
 * robots directive for the mounted route, and restores the home-page defaults on unmount.
 * Titles: "Smit Patel · Portfolio" on home, "<page title> · Smit Patel" elsewhere.
 */
export function useHeadMeta(opts?: { title?: string; description?: string; path?: string; type?: 'website' | 'article'; noindex?: boolean }) {
  const title = opts?.title
  const description = opts?.description
  const path = opts?.path
  const type = opts?.type
  const noindex = opts?.noindex ?? false
  useEffect(() => {
    if (!title) { apply(HOME); return }
    const full = `${title} · Smit Patel`
    apply({
      title: full,
      ogTitle: full,
      description: description ?? DEFAULT_DESCRIPTION,
      url: noindex ? null : SITE_URL + (path ?? '/'),
      type: type ?? 'website',
      noindex,
    })
    return () => apply(HOME)
  }, [title, description, path, type, noindex])
}
