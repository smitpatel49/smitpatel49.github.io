// Runs src/demos/routerModel.ts in Node on the tickets parity.py hands it.
//   node parity_runner.mjs <router.json> <in.json> <out.json>
// in.json: {"texts": [...], "analyze": [...]}; out.json: {"probs": [[...]], "decisions": [...],
// "reasons": [...], "tokens": [[...]]}. The TypeScript is bundled in memory with esbuild (already a
// dev dependency of the site), so this checks the exact module the page ships.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const [routerPath, inPath, outPath] = process.argv.slice(2)
const entry = fileURLToPath(new URL('../../../src/demos/routerModel.ts', import.meta.url))
const bundle = await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', write: false })
const code = bundle.outputFiles[0].text
const m = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))

const data = JSON.parse(readFileSync(routerPath, 'utf8'))
if (!m.isRouterData(data)) throw new Error('router.json failed the shape check')
const router = m.createRouter(data)
const input = JSON.parse(readFileSync(inPath, 'utf8'))
const started = performance.now()
const routed = input.texts.map(t => m.routeTicket(router, t))
const elapsed = performance.now() - started
writeFileSync(outPath, JSON.stringify({
  probs: input.texts.map(t => Array.from(m.predictProba(router, t))),
  decisions: routed.map(r => r.decision),
  reasons: routed.map(r => r.reason),
  top: routed.map(r => r.ranked[0].queue),
  tokens: input.analyze.map(t => m.analyze(t, router.ngramRange)),
  msPerTicket: elapsed / Math.max(1, input.texts.length),
}))
