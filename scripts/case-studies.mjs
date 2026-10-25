// Reads the case-study data the app renders, for Node scripts (postbuild.mjs, og_images.py):
//   projects   from src/data/projects.ts (slug, title, summary, tech);
//   summaries  from each src/pages/Project*.tsx, as the `summary` prop the page passes to
//              <CaseStudyPage>, so the “At a glance” card, the Open Graph image and its alt
//              text all come from the same strings.
// Run directly (`node scripts/case-studies.mjs`) it prints one JSON record per project.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = fileURLToPath(new URL('..', import.meta.url))

/** An esbuild plugin that replaces a module with an object whose every export is a no-op. */
function stub(filter) {
  return {
    name: 'stub',
    setup(b) {
      b.onResolve({ filter }, args => ({ path: args.path, namespace: 'stub' }))
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents: 'module.exports = new Proxy({}, { get: () => function Stub() { return null } })', loader: 'js',
      }))
    },
  }
}

/** Bundle one TypeScript module for Node and import it. */
async function importTs(file, filter) {
  const out = await build({
    entryPoints: [file], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent',
    jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [stub(filter)],
  })
  return import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'))
}

export async function loadProjects() {
  // Icons are only needed by the UI.
  const mod = await importTs(join(root, 'src/data/projects.ts'), /^lucide-react$/)
  if (!Array.isArray(mod.projects) || mod.projects.length === 0) throw new Error('case-studies: no projects found in src/data/projects.ts')
  return mod.projects
}

/**
 * slug → summary. Each page's default export is called (not rendered): it returns the
 * <CaseStudyPage> element, whose props hold the slug and summary. The shared components
 * are stubbed, so nothing else runs.
 */
export async function loadSummaries() {
  const dir = join(root, 'src/pages')
  const files = readdirSync(dir).filter(f => /^Project.*\.tsx$/.test(f))
  const summaries = new Map()
  for (const f of files) {
    const mod = await importTs(join(dir, f), /components\/CaseStudy$/)
    const { slug, summary } = mod.default().props
    if (typeof slug !== 'string' || !summary || typeof summary.result !== 'string') throw new Error(`case-studies: ${f} has no slug or summary`)
    summaries.set(slug, summary)
  }
  return summaries
}

/** Projects joined with their summaries; fails if a project has no page. */
export async function loadCaseStudies() {
  const [projects, summaries] = await Promise.all([loadProjects(), loadSummaries()])
  return projects.map(p => {
    const summary = summaries.get(p.slug)
    if (!summary) throw new Error(`case-studies: no page with a summary for project "${p.slug}"`)
    return { slug: p.slug, title: p.title, description: p.summary, tech: p.tech, summary }
  })
}

/** Alt text for a case study's Open Graph image; it describes what og_images.py draws. */
export function ogAlt(cs) {
  return `Smit Patel’s case study “${cs.title}”. Result: ${cs.summary.result} Tags: ${cs.tech.slice(0, 3).join(', ')}.`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const studies = await loadCaseStudies()
  process.stdout.write(JSON.stringify(studies.map(cs => ({ ...cs, ogAlt: ogAlt(cs) })), null, 2) + '\n')
}
