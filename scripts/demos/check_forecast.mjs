// Checks public/demos/forecast.json against the demand-forecast project it was exported from.
// Usage: node scripts/demos/check_forecast.mjs /path/to/demand-forecast
//
// 1. The explorer's own stocking code (src/demos/forecastModel.ts), run on the JSON, reproduces
//    metrics.json's pooled stocking numbers for the point forecast, conformal q90 and q95:
//    days in stock exactly, share served and leftover to 1e-4 relative (the JSON rounds values
//    to 2 decimals; in practice the gap is ~1e-6).
// 2. Per series and horizon, the same numbers computed from the full-precision CSV agree with the
//    JSON's (days in stock exactly), so the per-series view is faithful too.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { build } from 'esbuild'

const project = process.argv[2]
if (!project) throw new Error('usage: node scripts/demos/check_forecast.mjs /path/to/demand-forecast')
const site = fileURLToPath(new URL('../..', import.meta.url))

const bundled = await build({ entryPoints: [join(site, 'src/demos/forecastModel.ts')], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' })
const m = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))

const data = m.parseForecastData(JSON.parse(readFileSync(join(site, 'public/demos/forecast.json'), 'utf8')))
const metrics = JSON.parse(readFileSync(join(project, 'results/metrics.json'), 'utf8'))
const LEVELS = { median: 'forecast', q90: 'q90_conformal', q95: 'q95_conformal' }
const failures = []
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b))

console.log('pooled over 12 series x 7 horizons (JSON via forecastModel.ts vs metrics.json):')
for (const [level, key] of Object.entries(LEVELS)) {
  const got = m.pooledOutcome(data, level)
  const want = metrics.stocking[key]
  const pairs = [['daysInStock', 'days_in_stock', 1e-12], ['fillRate', 'fill_rate', 1e-4], ['leftoverPerUnitSold', 'leftover_per_unit_sold', 1e-4]]
  const line = pairs.map(([g, w, tol]) => {
    const r = rel(got[g], want[w])
    if (r > tol) failures.push(`${level} ${w}: json ${got[g]} vs metrics ${want[w]}`)
    return `${w} ${got[g].toFixed(6)} vs ${want[w].toFixed(6)} (rel ${r.toExponential(1)})`
  })
  console.log(`  ${level.padEnd(6)} ${line.join('; ')}`)
}

// full-precision CSV, per series and horizon
const text = gunzipSync(readFileSync(join(project, 'results/backtest_predictions.csv.gz'))).toString('utf8').trim().split('\n')
const header = text[0].split(',')
const col = name => header.indexOf(name)
const groups = new Map()
for (const row of text.slice(1)) {
  const f = row.split(',')
  const k = `${f[col('series')]}|${f[col('horizon')]}`
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(f)
}
let checked = 0, worst = 0
for (const s of data.series) {
  for (const h of data.horizons) {
    const rows = groups.get(`${s.store}/${s.category}|${h}`).sort((a, b) => a[col('date')].localeCompare(b[col('date')]))
    const units = rows.map(r => Number(r[col('units')]))
    if (units.join() !== s.units.join()) failures.push(`${s.store}/${s.category} h${h}: actuals differ`)
    for (const [level, key] of Object.entries(LEVELS)) {
      const full = { ...s, [level]: s[level].map((_, i) => (i === h - 1 ? rows.map(r => Number(r[col(key)])) : s[level][i])) }
      const a = m.seriesOutcome(full, h, level), b = m.seriesOutcome(s, h, level)
      if (a.daysInStock !== b.daysInStock) failures.push(`${s.store}/${s.category} h${h} ${level}: days in stock differ`)
      worst = Math.max(worst, rel(a.fillRate, b.fillRate), rel(a.leftoverPerUnitSold, b.leftoverPerUnitSold))
      checked++
    }
  }
}
if (worst > 1e-2) failures.push(`per-series share served/leftover differ by up to ${worst}`)
console.log(`per series x horizon x level: ${checked} checks, days in stock identical, worst relative gap in share served/leftover ${worst.toExponential(1)}`)

if (failures.length) {
  console.log(`FAIL (${failures.length}):\n  ` + failures.slice(0, 20).join('\n  '))
  process.exit(1)
}
console.log('PASS')
