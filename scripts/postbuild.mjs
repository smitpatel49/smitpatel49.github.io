// Runs after `vite build`. GitHub Pages has no SPA rewrites, so this writes:
//   dist/projects/<slug>.html  a copy of index.html with that case study's title, description,
//                              canonical, Open Graph and Twitter tags (including its own preview
//                              image, /og/<slug>.png from scripts/og_images.py), so
//                              /projects/<slug> is served with HTTP 200 and link previews show
//                              the right page;
//   dist/404.html              the SPA fallback for any other path, marked noindex;
//   dist/sitemap.xml           home plus every project, lastmod = build date.
// Project data comes from src/data/projects.ts and the pages' summaries (scripts/case-studies.mjs),
// the same data the app renders.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCaseStudies, ogAlt } from './case-studies.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
// The output folder defaults to dist/; an argument overrides it (for builds with --outDir).
const dist = resolve(root, process.argv[2] ?? 'dist')
const SITE_URL = 'https://smitpatel49.github.io'

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Replace exactly one match of `re` in `html`, or fail the build. */
function replaceOne(html, re, value, what) {
  const matches = html.match(new RegExp(re.source, 'g')) || []
  if (matches.length !== 1) throw new Error(`postbuild: expected one ${what} in index.html, found ${matches.length}`)
  return html.replace(re, value)
}

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`)
  return replaceOne(html, re, `<meta ${attr}="${key}" content="${esc(value)}" />`, `${attr}="${key}" tag`)
}

/** Width and height from a PNG's IHDR chunk, so the og:image size tags can't go stale. */
function pngSize(file) {
  const b = readFileSync(file)
  if (b.toString('latin1', 1, 4) !== 'PNG') throw new Error(`postbuild: ${file} is not a PNG`)
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

function ogImage(p) {
  const rel = `og/${p.slug}.png`
  const file = join(dist, rel)
  if (!existsSync(file)) throw new Error(`postbuild: missing ${rel}; run \`python3 scripts/og_images.py\``)
  return { url: `${SITE_URL}/${rel}`, alt: ogAlt(p), ...pngSize(file) }
}

function pageHtml(template, p) {
  const url = `${SITE_URL}/projects/${p.slug}`
  const title = `${p.title} · Smit Patel`
  let html = template
  html = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`, '<title>')
  html = setMeta(html, 'name', 'description', p.description)
  html = replaceOne(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, 'canonical link')
  html = setMeta(html, 'property', 'og:type', 'article')
  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', p.description)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'name', 'twitter:title', title)
  html = setMeta(html, 'name', 'twitter:description', p.description)
  const img = ogImage(p)
  html = setMeta(html, 'property', 'og:image', img.url)
  html = setMeta(html, 'property', 'og:image:width', String(img.width))
  html = setMeta(html, 'property', 'og:image:height', String(img.height))
  html = setMeta(html, 'property', 'og:image:alt', img.alt)
  html = setMeta(html, 'name', 'twitter:image', img.url)
  html = setMeta(html, 'name', 'twitter:image:alt', img.alt)
  return html
}

function notFoundHtml(template) {
  let html = replaceOne(template, /\s*<link rel="canonical" href="[^"]*"\s*\/?>/, '', 'canonical link')
  html = replaceOne(html, /<meta charset="UTF-8" \/>/, '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />', 'charset meta')
  return html
}

function sitemap(projects, lastmod) {
  const urls = [{ loc: SITE_URL + '/', priority: '1.0' }, ...projects.map(p => ({ loc: `${SITE_URL}/projects/${p.slug}`, priority: '0.8' }))]
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>\n`).join('') +
    '</urlset>\n'
}

const projects = await loadCaseStudies()
const template = readFileSync(join(dist, 'index.html'), 'utf8')

mkdirSync(join(dist, 'projects'), { recursive: true })
for (const p of projects) writeFileSync(join(dist, 'projects', `${p.slug}.html`), pageHtml(template, p))
writeFileSync(join(dist, '404.html'), notFoundHtml(template))
const today = new Date().toISOString().slice(0, 10)
writeFileSync(join(dist, 'sitemap.xml'), sitemap(projects, today))

console.log(`postbuild: ${projects.length} case-study pages, 404.html (noindex), sitemap.xml (lastmod ${today})`)
