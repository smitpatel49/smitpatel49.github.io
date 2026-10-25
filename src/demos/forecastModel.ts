/**
 * Data shape and stocking arithmetic for the forecast explorer. The data is the demand-forecast
 * project's committed backtest, exported by scripts/demos/export_forecast.py; the stocking rule
 * mirrors forecast/evaluation.py stocking_outcome (each day on its own, no carry-over), and
 * scripts/demos/check_forecast.mjs asserts the pooled totals match the project's metrics.json.
 */

export type ServiceLevel = 'median' | 'q90' | 'q95'

export type ForecastSeries = {
  store: string
  category: string
  /** Actual units sold per day. */
  units: number[]
  /** Day indices (0 = start) with a planned promotion. */
  promoDays: number[]
  closedDays: number[]
  /** Stock level per [horizon − 1][day] for each service level. */
  median: number[][]
  q90: number[][]
  q95: number[][]
}

export type ForecastData = {
  start: string
  days: number
  horizons: number[]
  /** Day indices on which the backtest retrained the models. */
  foldStarts: number[]
  series: ForecastSeries[]
}

export type StockOutcome = {
  /** Share of days on which stock covered all demand. */
  daysInStock: number
  /** Share of total demand served. */
  fillRate: number
  /** Unsold units per unit sold. */
  leftoverPerUnitSold: number
}

type Tally = { days: number; inStock: number; demand: number; sold: number; leftover: number }

const emptyTally = (): Tally => ({ days: 0, inStock: 0, demand: 0, sold: 0, leftover: 0 })

function addDays(t: Tally, actual: readonly number[], stock: readonly number[]): Tally {
  for (let i = 0; i < actual.length; i++) {
    const sold = Math.min(actual[i], stock[i])
    t.days += 1
    if (actual[i] <= stock[i]) t.inStock += 1
    t.demand += actual[i]
    t.sold += sold
    t.leftover += stock[i] - sold
  }
  return t
}

const toOutcome = (t: Tally): StockOutcome => ({
  daysInStock: t.inStock / t.days,
  fillRate: t.sold / t.demand,
  leftoverPerUnitSold: t.leftover / t.sold,
})

/** Stocking outcome for one series at one horizon. */
export function seriesOutcome(s: ForecastSeries, horizon: number, level: ServiceLevel): StockOutcome {
  return toOutcome(addDays(emptyTally(), s.units, s[level][horizon - 1]))
}

/** Pooled over every series and horizon: the backtest's headline stocking numbers. */
export function pooledOutcome(data: ForecastData, level: ServiceLevel): StockOutcome {
  const t = emptyTally()
  for (const s of data.series) for (const h of data.horizons) addDays(t, s.units, s[level][h - 1])
  return toOutcome(t)
}

const isNumberArray = (x: unknown): x is number[] => Array.isArray(x) && x.every(v => typeof v === 'number' && Number.isFinite(v))
const isMatrix = (x: unknown, rows: number, cols: number): x is number[][] =>
  Array.isArray(x) && x.length === rows && x.every(r => isNumberArray(r) && r.length === cols)

/** Narrow the fetched JSON to ForecastData, or throw if it isn't the expected shape. */
export function parseForecastData(json: unknown): ForecastData {
  const fail = (what: string): never => { throw new Error('forecast.json: ' + what) }
  if (typeof json !== 'object' || json === null) return fail('not an object')
  const d = json as Record<string, unknown>
  if (typeof d.start !== 'string' || typeof d.days !== 'number') return fail('missing start or days')
  if (!isNumberArray(d.horizons) || !isNumberArray(d.foldStarts) || !Array.isArray(d.series)) return fail('missing horizons, foldStarts or series')
  const days = d.days, horizons = d.horizons.length
  const series = d.series.map((raw: unknown, i): ForecastSeries => {
    const s = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
    if (typeof s.store !== 'string' || typeof s.category !== 'string') return fail(`series ${i}: no store or category`)
    if (!isNumberArray(s.units) || s.units.length !== days) return fail(`series ${i}: bad units`)
    if (!isNumberArray(s.promoDays) || !isNumberArray(s.closedDays)) return fail(`series ${i}: bad day lists`)
    if (!isMatrix(s.median, horizons, days) || !isMatrix(s.q90, horizons, days) || !isMatrix(s.q95, horizons, days)) return fail(`series ${i}: bad forecasts`)
    return { store: s.store, category: s.category, units: s.units, promoDays: s.promoDays, closedDays: s.closedDays, median: s.median, q90: s.q90, q95: s.q95 }
  })
  return { start: d.start, days, horizons: d.horizons, foldStarts: d.foldStarts, series }
}
