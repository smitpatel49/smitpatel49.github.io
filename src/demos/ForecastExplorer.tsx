import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react'
import { Table2 } from 'lucide-react'
import { DemoFrame, FOCUS, MUTED, SMALL_BUTTON, Segmented } from './controls'
import { parseForecastData, pooledOutcome, seriesOutcome, type ForecastData, type ForecastSeries, type ServiceLevel, type StockOutcome } from './forecastModel'
import { pct } from './format'

const DATA_URL = import.meta.env.BASE_URL + 'demos/forecast.json'

const STORES = ['airport', 'campus', 'downtown', 'suburb'] as const
const CATEGORIES = ['beverages', 'gifts', 'snacks'] as const
type Store = typeof STORES[number]
type Category = typeof CATEGORIES[number]
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

const LEVELS: readonly { value: ServiceLevel; label: string; long: string }[] = [
  { value: 'median', label: 'Median forecast', long: 'the median forecast' },
  { value: 'q90', label: '90th percentile', long: 'the conformal 90th percentile' },
  { value: 'q95', label: '95th percentile', long: 'the conformal 95th percentile' },
]

type Load = { state: 'waiting' } | { state: 'error'; message: string } | { state: 'ready'; data: ForecastData }

/** Fetch the backtest JSON the first time the explorer comes near the viewport, so it never weighs on first load. */
function useForecastData(ref: RefObject<HTMLElement>, attempt: number): Load {
  const [load, setLoad] = useState<Load>({ state: 'waiting' })
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) setNear(true) }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, near])
  useEffect(() => {
    if (!near) return
    let cancelled = false
    setLoad({ state: 'waiting' })
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<unknown> })
      .then(json => { if (!cancelled) setLoad({ state: 'ready', data: parseForecastData(json) }) })
      .catch((e: unknown) => { if (!cancelled) setLoad({ state: 'error', message: e instanceof Error ? e.message : String(e) }) })
    return () => { cancelled = true }
  }, [near, attempt])
  return load
}

function useWidth(ref: RefObject<HTMLElement>, fallback: number): number {
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth || fallback)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width) || fallback))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, fallback])
  return width
}

const dayDate = (start: string, i: number) => {
  const d = new Date(start + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + i)
  return d
}
const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })

/** Round an axis maximum up to 1, 2 or 5 × 10^k steps; returns [max, step]. */
function niceScale(max: number, ticks = 4): [number, number] {
  const raw = max / ticks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map(f => f * mag).find(s => s >= raw) ?? 10 * mag
  return [Math.ceil(max / step) * step, step]
}

// Chart colors per theme. The print overrides are !important because `dark:` classes outrank a
// plain @media print rule, and a dark-theme chart would otherwise print pale marks on white paper.
const C = {
  text: 'fill-neutral-600 dark:fill-neutral-400 print:!fill-neutral-600',
  grid: 'stroke-neutral-200 dark:stroke-neutral-800 print:!stroke-neutral-200',
  axis: 'stroke-neutral-400 dark:stroke-neutral-600 print:!stroke-neutral-400',
  fold: 'stroke-neutral-500',
  promo: 'stroke-amber-600 dark:stroke-amber-400 print:!stroke-amber-600',
  band: 'fill-accent-500/20 dark:fill-accent-400/20 print:!fill-accent-500/20',
  stock: 'stroke-accent-500 dark:stroke-accent-400 print:!stroke-accent-500',
  median: 'stroke-accent-700 dark:stroke-accent-400 print:!stroke-accent-700',
  dot: 'fill-neutral-700 dark:fill-neutral-300 print:!fill-neutral-700',
  soldOut: 'fill-red-600 dark:fill-red-400 print:!fill-red-600',
  soldOutRing: 'stroke-white dark:stroke-neutral-900 print:!stroke-white',
}

function ForecastChart({ data, s, horizon, level, titleId, descId, title, desc }: {
  data: ForecastData; s: ForecastSeries; horizon: number; level: ServiceLevel
  titleId: string; descId: string; title: string; desc: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const width = useWidth(box, 640)
  const height = width < 480 ? 230 : 290
  const m = { top: 10, right: 8, bottom: 30, left: 34 }
  const iw = Math.max(width - m.left - m.right, 10), ih = height - m.top - m.bottom
  const median = s.median[horizon - 1], stock = s[level][horizon - 1]
  // the axis is fixed per series and horizon, so switching the service level doesn't rescale it
  const [yMax, yStep] = niceScale(Math.max(...s.units, ...s.q95[horizon - 1]))
  const x = (i: number) => m.left + i * iw / (data.days - 1)
  const y = (v: number) => m.top + ih - v / yMax * ih
  const path = (vals: readonly number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const band = level === 'median' ? '' : path(stock) + median.map((_, k) => {
    const i = median.length - 1 - k
    return `L${x(i).toFixed(1)},${y(median[i]).toFixed(1)}`
  }).join('') + 'Z'
  const yTicks = Array.from({ length: Math.round(yMax / yStep) + 1 }, (_, k) => k * yStep)
  const monthStarts = Array.from({ length: data.days }, (_, i) => i).filter(i => dayDate(data.start, i).getUTCDate() === 1)
  // label the first day too, unless it would collide with the first month label on a narrow chart
  const monthTicks = monthStarts.length && x(monthStarts[0]) - x(0) < 48 ? monthStarts : [0, ...monthStarts]

  return (
    <div ref={box} className='w-full'>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role='img' aria-labelledby={`${titleId} ${descId}`} className='block max-w-full'>
        <title id={titleId}>{title}</title>
        <desc id={descId}>{desc}</desc>
        <g className={'text-[10px] ' + C.text} aria-hidden='true'>
          {yTicks.map(t => (
            <g key={t}>
              <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} className={C.grid} />
              <text x={m.left - 6} y={y(t)} dy='0.32em' textAnchor='end'>{t}</text>
            </g>
          ))}
          {monthTicks.map(i => (
            <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : 'middle'}>
              {fmtDate(dayDate(data.start, i), i === 0 ? { month: 'short', day: 'numeric' } : { month: 'short' })}
            </text>
          ))}
          {s.promoDays.map(i => (
            <line key={i} x1={x(i)} x2={x(i)} y1={m.top + ih + 3} y2={m.top + ih + 9} strokeWidth={1.5} className={C.promo} />
          ))}
          {data.foldStarts.filter(i => i > 0).map(i => (
            <line key={i} x1={x(i - 0.5)} x2={x(i - 0.5)} y1={m.top} y2={m.top + ih} strokeDasharray='3 3' className={C.fold} />
          ))}
          {band && <path d={band} className={C.band} />}
          {level !== 'median' && <path d={path(stock)} fill='none' strokeWidth={1} className={C.stock} />}
          <path d={path(median)} fill='none' strokeWidth={1.75} strokeLinejoin='round' className={C.median} />
          {s.units.map((u, i) => u > stock[i]
            ? <circle key={i} cx={x(i)} cy={y(u)} r={3} strokeWidth={1} className={C.soldOut + ' ' + C.soldOutRing} />
            : <circle key={i} cx={x(i)} cy={y(u)} r={1.9} className={C.dot} />)}
          <line x1={m.left} x2={width - m.right} y1={m.top + ih} y2={m.top + ih} className={C.axis} />
        </g>
      </svg>
    </div>
  )
}

function Legend({ level }: { level: ServiceLevel }) {
  const item = 'inline-flex items-center gap-1.5'
  return (
    <ul className={'flex flex-wrap gap-x-4 gap-y-1 text-xs ' + MUTED} aria-label='Chart legend'>
      <li className={item}><svg width='10' height='10' aria-hidden='true'><circle cx='5' cy='5' r='2' className={C.dot} /></svg>Units sold</li>
      <li className={item}><svg width='10' height='10' aria-hidden='true'><circle cx='5' cy='5' r='3.5' className={C.soldOut} /></svg>Sold out (demand above stock)</li>
      <li className={item}><svg width='18' height='10' aria-hidden='true'><line x1='0' x2='18' y1='5' y2='5' strokeWidth='2' className={C.median} /></svg>Median forecast</li>
      {level !== 'median' && <li className={item}><svg width='18' height='10' aria-hidden='true'><rect width='18' height='10' className={C.band} /><line x1='0' x2='18' y1='1' y2='1' className={C.stock} /></svg>Extra stock up to the {level === 'q90' ? '90th' : '95th'} percentile</li>}
      <li className={item}><svg width='10' height='10' aria-hidden='true'><line x1='5' x2='5' y1='0' y2='10' strokeDasharray='3 2' className={C.fold} /></svg>Models retrained</li>
      <li className={item}><svg width='10' height='10' aria-hidden='true'><line x1='5' x2='5' y1='2' y2='9' strokeWidth='1.5' className={C.promo} /></svg>Promotion day</li>
    </ul>
  )
}

function Outcome({ heading, o, days }: { heading: string; o: StockOutcome; days?: number }) {
  return (
    <section className='rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-3' aria-label={heading}>
      <h4 className={'text-xs uppercase tracking-wide font-medium ' + MUTED}>{heading}</h4>
      <dl className='mt-2 grid grid-cols-3 gap-2'>
        <div>
          <dt className={'text-xs ' + MUTED}>Days fully in stock</dt>
          <dd className='text-lg font-semibold tabular-nums'>{pct(o.daysInStock, 0)}</dd>
          {days !== undefined && <dd className={'text-xs ' + MUTED}>{Math.round(o.daysInStock * days)} of {days}</dd>}
        </div>
        <div>
          <dt className={'text-xs ' + MUTED}>Demand served</dt>
          <dd className='text-lg font-semibold tabular-nums'>{pct(o.fillRate, 0)}</dd>
        </div>
        <div>
          <dt className={'text-xs ' + MUTED}>Leftover per 100 sold</dt>
          <dd className='text-lg font-semibold tabular-nums'>{Math.round(o.leftoverPerUnitSold * 100)}</dd>
        </div>
      </dl>
    </section>
  )
}

function DataTable({ data, s, horizon, level, id, caption }: { data: ForecastData; s: ForecastSeries; horizon: number; level: ServiceLevel; id: string; caption: string }) {
  const promo = new Set(s.promoDays)
  const h = horizon - 1
  const levelName = LEVELS.find(l => l.value === level)?.label ?? level
  const th = 'px-2 py-1.5 font-medium text-right first:text-left'
  return (
    <div id={id} role='region' aria-label={caption} tabIndex={0} className={'mt-3 max-h-80 overflow-auto rounded-xl border border-neutral-200/80 dark:border-neutral-800 ' + FOCUS}>
      <table className='w-full text-xs tabular-nums'>
        <caption className='sr-only'>{caption}</caption>
        <thead className='sticky top-0 bg-white dark:bg-neutral-900'>
          <tr className='border-b border-neutral-200 dark:border-neutral-800'>
            <th scope='col' className={th}>Date</th>
            <th scope='col' className={th}>Sold</th>
            <th scope='col' className={th}>Median</th>
            <th scope='col' className={th}>90th pct</th>
            <th scope='col' className={th}>95th pct</th>
            <th scope='col' className={th}>Stocked to {levelName.toLowerCase()}</th>
          </tr>
        </thead>
        <tbody>
          {s.units.map((u, i) => {
            const short = u - s[level][h][i]
            return (
              <tr key={i} className='border-b border-neutral-100 dark:border-neutral-800/60 last:border-0'>
                <th scope='row' className='px-2 py-1 text-left font-normal whitespace-nowrap'>
                  {fmtDate(dayDate(data.start, i), { weekday: 'short', month: 'short', day: 'numeric' })}{promo.has(i) && <span className={MUTED}> · promo</span>}
                </th>
                <td className='px-2 py-1 text-right'>{u}</td>
                <td className='px-2 py-1 text-right'>{s.median[h][i].toFixed(1)}</td>
                <td className='px-2 py-1 text-right'>{s.q90[h][i].toFixed(1)}</td>
                <td className='px-2 py-1 text-right'>{s.q95[h][i].toFixed(1)}</td>
                <td className={'px-2 py-1 text-right whitespace-nowrap ' + (short > 0 ? 'text-red-700 dark:text-red-400' : '')}>{short > 0 ? `Sold out, ${short.toFixed(1)} short` : 'In stock'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ForecastExplorer() {
  const root = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const load = useForecastData(root, attempt)
  const [store, setStore] = useState<Store>('downtown')
  const [category, setCategory] = useState<Category>('gifts')
  const [horizon, setHorizon] = useState(1)
  const [level, setLevel] = useState<ServiceLevel>('q90')
  const [showTable, setShowTable] = useState(false)
  const uid = useId()

  const data = load.state === 'ready' ? load.data : null
  const series = data?.series.find(s => s.store === store && s.category === category)
  const pooled = useMemo(() => (data ? pooledOutcome(data, level) : null), [data, level])
  const own = series ? seriesOutcome(series, horizon, level) : null
  const levelInfo = LEVELS.find(l => l.value === level) ?? LEVELS[0]
  const name = `${cap(store)} ${category}`
  const ahead = horizon === 1 ? '1 day ahead' : `${horizon} days ahead`

  return (
    <DemoFrame
      id='forecast-explorer'
      title='Demand forecast explorer'
      intro={<>The forecasting project’s committed backtest: 16 weeks of daily sales for 12 simulated store and category series, against the model’s forecasts made before the actuals were known. Choose how much to stock and see the trade-off between empty shelves and leftovers.</>}
      caseStudy={{ slug: 'forecast', title: 'Week-Ahead Demand Forecasting' }}
    >
      <div ref={root} className='space-y-5'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Segmented legend='Store' name={uid + 'store'} value={store} onChange={setStore} options={STORES.map(v => ({ value: v, label: cap(v) }))} />
          <Segmented legend='Category' name={uid + 'category'} value={category} onChange={setCategory} options={CATEGORIES.map(v => ({ value: v, label: cap(v) }))} />
          <Segmented legend='Stock to' name={uid + 'level'} value={level} onChange={setLevel} options={LEVELS} />
          <div>
            <label htmlFor={uid + 'horizon'} className='block text-sm font-medium mb-1.5'>Forecast made</label>
            <select
              id={uid + 'horizon'} value={horizon} onChange={e => setHorizon(Number(e.target.value))}
              className={'rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1 text-xs ' + FOCUS}
            >
              {[1, 2, 3, 4, 5, 6, 7].map(h => <option key={h} value={h}>{h === 1 ? '1 day ahead' : `${h} days ahead`}</option>)}
            </select>
          </div>
        </div>

        {load.state === 'error' && (
          <div role='alert' className='rounded-xl border border-red-300 dark:border-red-800 p-4 text-sm'>
            The backtest data didn’t load ({load.message}).{' '}
            <button type='button' className={SMALL_BUTTON} onClick={() => setAttempt(a => a + 1)}>Try again</button>
          </div>
        )}
        {load.state === 'waiting' && (
          <div role='status' className={'flex items-center justify-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 h-[230px] sm:h-[290px] text-sm ' + MUTED}>
            Loading the backtest…
          </div>
        )}

        {data && series && own && pooled && (
          <>
            <div className='space-y-2 break-inside-avoid'>
              <p className={'text-xs ' + MUTED} aria-hidden='true'>Units per day</p>
              <ForecastChart
                data={data} s={series} horizon={horizon} level={level}
                titleId={uid + 'title'} descId={uid + 'desc'}
                title={`${name}: daily units sold against the ${ahead} forecast`}
                desc={`${fmtDate(dayDate(data.start, 0), { month: 'short', day: 'numeric' })} to ${fmtDate(dayDate(data.start, data.days - 1), { month: 'short', day: 'numeric', year: 'numeric' })}. ` +
                  `Stocking to ${levelInfo.long}, the shelf was fully stocked on ${Math.round(own.daysInStock * data.days)} of ${data.days} days; sold-out days are marked. The data table below lists every day.`}
              />
              <Legend level={level} />
            </div>

            <div className='grid gap-3 sm:grid-cols-2' aria-live='polite'>
              <Outcome heading={`${name}, ${ahead}`} o={own} days={data.days} />
              <Outcome heading='All 12 series, all 7 horizons' o={pooled} />
            </div>
            <p className={'text-xs leading-relaxed ' + MUTED}>
              The 90th and 95th percentiles are the project’s conformal-calibrated quantiles, so stocking to them keeps
              the shelf full on about 90% and 95% of days across the backtest. Each day is scored on its own, with no
              leftover carried to the next. The data is simulated, which is what lets the project compare the model with
              the best possible forecast.
            </p>

            <div>
              <button
                type='button' className={SMALL_BUTTON} aria-expanded={showTable} aria-controls={uid + 'table'}
                onClick={() => setShowTable(v => !v)}
              >
                <Table2 className='w-3.5 h-3.5' aria-hidden='true' />{showTable ? 'Hide' : 'Show'} the numbers as a table
              </button>
              {showTable && (
                <DataTable
                  id={uid + 'table'} data={data} s={series} horizon={horizon} level={level}
                  caption={`${name}, ${ahead} forecasts and stock levels, by day`}
                />
              )}
            </div>
          </>
        )}
      </div>
    </DemoFrame>
  )
}
