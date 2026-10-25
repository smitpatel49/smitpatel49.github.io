// Evaluates the TypeScript port (src/demos/dealModel.ts) on a grid of inputs for deal_parity.py.
// Usage: node scripts/demos/deal-eval.mjs <grid.json> <out.json>
// grid.json: [{premium, cash, debt, stock, synergy_realization}, ...]
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const [gridPath, outPath] = process.argv.slice(2)
if (!gridPath || !outPath) throw new Error('usage: node scripts/demos/deal-eval.mjs <grid.json> <out.json>')

const entry = fileURLToPath(new URL('../../src/demos/dealModel.ts', import.meta.url))
const bundled = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' })
const m = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))

const grid = JSON.parse(readFileSync(gridPath, 'utf8'))
const deal = m.DEAL
const results = grid.map(g => {
  const s = { cash: g.cash, debt: g.debt, stock: g.stock }
  const r = m.evaluateDeal(g.premium, s, g.synergy_realization)
  return {
    accretion: r.projection.accretion,
    price: r.projection.price,
    fees: r.projection.fees,
    cash_used: r.projection.cashUsed,
    new_shares: r.projection.newShares,
    leverage: r.projection.leverage,
    cash_ok: r.limits.cashOk,
    leverage_ok: r.limits.leverageOk,
    standalone_value: r.value.standaloneValue,
    synergy_value: r.value.synergyValue,
    integration_cost_value: r.value.integrationCostValue,
    cost_of_acquisition: r.value.costOfAcquisition,
    npv: r.value.npv,
    walk_away: r.walkAway,
  }
})
const extras = {
  deal,
  medians: m.medians(deal),
  cautious_premium: m.percentile(deal, 'premium', m.CAUTIOUS_PERCENTILE),
}
writeFileSync(outPath, JSON.stringify({ results, extras }))
