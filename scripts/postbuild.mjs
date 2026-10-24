// Runs after `vite build`. GitHub Pages has no SPA rewrites, so this writes:
//   dist/projects/<slug>.html  a copy of index.html with that case study's title, description,
//                              canonical, Open Graph and Twitter tags, so /projects/<slug> is
//                              served with HTTP 200 and link previews show the right page;
//   dist/404.html              the SPA fallback for any other path, marked noindex;
//   dist/sitemap.xml           home plus every project, lastmod = build date.
// Project data comes from src/data/projects.ts, the same list the app renders.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const SITE_URL = 'https://smitpatel49.github.io'

async function loadProjects() {
  // Bundle projects.ts for Node. Its icon imports are only needed by the UI, so lucide-react
  // is replaced by a stub that returns null for every export.
  const stub = {
    name: 'stub-icons',
    setup(b) {
      b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: 'lucide-react', namespace: 'stub' }))
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'module.exports = new Proxy({}, { get: () => null })', loader: 'js' }))
    },
  }
  const out = await build({
    entryPoints: [join(root, 'src/data/projects.ts')],
    bundle: true, platform: 'node', format: 'esm', write: false, plugins: [stub], logLevel: 'silent',
  })
  const code = out.outputFiles[0].text
  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  if (!Array.isArray(mod.projects) || mod.projects.length === 0) throw new Error('postbuild: no projects found in src/data/projects.ts')
  return mod.projects
}

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

function pageHtml(template, p) {
  const url = `${SITE_URL}/projects/${p.slug}`
  const title = `${p.title} · Smit Patel`
  let html = template
  html = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`, '<title>')
  html = setMeta(html, 'name', 'description', p.summary)
  html = replaceOne(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, 'canonical link')
  html = setMeta(html, 'property', 'og:type', 'article')
  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', p.summary)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'name', 'twitter:title', title)
  html = setMeta(html, 'name', 'twitter:description', p.summary)
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

const projects = await loadProjects()
const template = readFileSync(join(dist, 'index.html'), 'utf8')

mkdirSync(join(dist, 'projects'), { recursive: true })
for (const p of projects) writeFileSync(join(dist, 'projects', `${p.slug}.html`), pageHtml(template, p))
writeFileSync(join(dist, '404.html'), notFoundHtml(template))
const today = new Date().toISOString().slice(0, 10)
writeFileSync(join(dist, 'sitemap.xml'), sitemap(projects, today))

console.log(`postbuild: ${projects.length} case-study pages, 404.html (noindex), sitemap.xml (lastmod ${today})`)
