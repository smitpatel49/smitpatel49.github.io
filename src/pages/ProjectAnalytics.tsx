
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

// Sequential single-hue blue ramp (magnitude), light -> dark, matching the site's accent scale.
const BLUE_RAMP = ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
function rampColor(pct: number) {
  // pct in [0,100] -> ramp index
  const idx = Math.max(0, Math.min(BLUE_RAMP.length - 1, Math.round((pct / 100) * (BLUE_RAMP.length - 1))))
  return BLUE_RAMP[idx]
}
function textColorFor(pct: number) {
  return pct >= 45 ? '#ffffff' : '#0f172a'
}

// Synthetic monthly-cohort retention data (illustrative sample, not real company data).
// Each row is a signup cohort; null = not yet observed (that many months haven't elapsed yet) —
// the empty upper-right triangle is intentional and is how real cohort tables look.
type CohortRow = { cohort: string; values: (number | null)[] }
const COHORTS: CohortRow[] = [
  { cohort: 'Jan 2026', values: [100, 48, 42, 36, 33, 32] },
  { cohort: 'Feb 2026', values: [100, 51, 43, 38, 36, null] },
  { cohort: 'Mar 2026', values: [100, 51, 41, 38, null, null] },
  { cohort: 'Apr 2026', values: [100, 53, 44, null, null, null] },
  { cohort: 'May 2026', values: [100, 52, null, null, null, null] },
]
const MONTH_LABELS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5']

function CohortHeatmap() {
  const rowLabelW = 92
  const cellW = 66
  const cellH = 38
  const gap = 4
  const headerH = 26
  const width = rowLabelW + MONTH_LABELS.length * (cellW + gap)
  const height = headerH + COHORTS.length * (cellH + gap)

  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${width} ${height}`} width='100%' style={{ maxWidth: width }} role='img' aria-label='Monthly cohort retention heatmap'>
        {MONTH_LABELS.map((m, ci) => (
          <text key={m} x={rowLabelW + ci * (cellW + gap) + cellW / 2} y={headerH - 8} textAnchor='middle' fontSize='11' fontFamily='monospace' fill='currentColor' opacity={0.65}>{m}</text>
        ))}
        {COHORTS.map((row, ri) => (
          <g key={row.cohort}>
            <text x={0} y={headerH + ri * (cellH + gap) + cellH / 2 + 4} fontSize='11' fill='currentColor' opacity={0.75}>{row.cohort}</text>
            {row.values.map((v, ci) => {
              const x = rowLabelW + ci * (cellW + gap)
              const y = headerH + ri * (cellH + gap)
              if (v === null) {
                return (
                  <rect key={ci} x={x} y={y} width={cellW} height={cellH} rx={6}
                    fill='none' stroke='currentColor' strokeOpacity={0.12} strokeDasharray='3 3' />
                )
              }
              return (
                <g key={ci}>
                  <rect x={x} y={y} width={cellW} height={cellH} rx={6} fill={rampColor(v)}>
                    <title>{row.cohort} · {MONTH_LABELS[ci]}: {v}% retained</title>
                  </rect>
                  <text x={x + cellW / 2} y={y + cellH / 2 + 4} textAnchor='middle' fontSize='12' fontWeight={600} fill={textColorFor(v)}>{v}%</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}

type FunnelStage = { label: string; value: number }
const FUNNEL: FunnelStage[] = [
  { label: 'Viewed Product', value: 12000 },
  { label: 'Added to Cart', value: 3962 },
  { label: 'Checked Out', value: 2220 },
  { label: 'Purchased', value: 1681 },
]

function FunnelChart() {
  const width = 560
  const barH = 34
  const gap = 22
  const labelW = 140
  const maxVal = FUNNEL[0].value
  const plotW = width - labelW - 70
  const height = FUNNEL.length * (barH + gap)

  return (
    <div className='overflow-x-auto'>
      <svg viewBox={`0 0 ${width} ${height}`} width='100%' style={{ maxWidth: width }} role='img' aria-label='Purchase funnel conversion chart'>
        {FUNNEL.map((s, i) => {
          const w = Math.max(4, (s.value / maxVal) * plotW)
          const y = i * (barH + gap)
          const pctOfPrev = i === 0 ? null : Math.round((s.value / FUNNEL[i - 1].value) * 1000) / 10
          const color = BLUE_RAMP[3 + i] // monotone lightness steps, ordinal by funnel stage
          return (
            <g key={s.label}>
              <text x={0} y={y + barH / 2 + 4} fontSize='12' fill='currentColor' opacity={0.8}>{s.label}</text>
              <rect x={labelW} y={y} width={w} height={barH} rx={4} fill={color}>
                <title>{s.label}: {s.value.toLocaleString()}{pctOfPrev !== null ? ` (${pctOfPrev}% of previous step)` : ''}</title>
              </rect>
              <text x={labelW + w + 8} y={y + barH / 2 + 4} fontSize='12' fontWeight={600} fill='currentColor'>{s.value.toLocaleString()}</text>
              {pctOfPrev !== null && (
                <text x={labelW + w + 8} y={y + barH / 2 + 18} fontSize='10' fill='currentColor' opacity={0.55}>↓ {pctOfPrev}%</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const COHORT_SQL = `-- Monthly cohort retention (PostgreSQL)
WITH cohorts AS (
  SELECT customer_id,
         DATE_TRUNC('month', MIN(order_date)) AS cohort_month
  FROM orders
  GROUP BY customer_id
),
activity AS (
  SELECT o.customer_id,
         c.cohort_month,
         DATE_TRUNC('month', o.order_date) AS activity_month
  FROM orders o
  JOIN cohorts c ON c.customer_id = o.customer_id
)
SELECT
  cohort_month,
  DATE_PART('month', AGE(activity_month, cohort_month)) AS month_number,
  COUNT(DISTINCT customer_id) AS active_customers
FROM activity
GROUP BY 1, 2
ORDER BY 1, 2;`

const FUNNEL_SQL = `-- Purchase funnel conversion (PostgreSQL)
SELECT
  COUNT(DISTINCT CASE WHEN step = 'viewed'        THEN user_id END) AS viewed,
  COUNT(DISTINCT CASE WHEN step = 'added_to_cart'  THEN user_id END) AS added_to_cart,
  COUNT(DISTINCT CASE WHEN step = 'checked_out'    THEN user_id END) AS checked_out,
  COUNT(DISTINCT CASE WHEN step = 'purchased'      THEN user_id END) AS purchased
FROM funnel_events
WHERE event_date >= CURRENT_DATE - INTERVAL '30 days';`

export default function ProjectAnalytics() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100'>
      <div className='section'>
        <div className='section-stripe'></div>
        <h1 className='section-title'>Customer Retention & Revenue Analytics</h1>
        <p className='text-center opacity-80 max-w-2xl mx-auto'>SQL-driven cohort retention and purchase-funnel analysis, built into an interactive dashboard for a stakeholder audience.</p>
        <div className='flex gap-2 flex-wrap justify-center mt-4'>
          {['SQL','PostgreSQL','Cohort Analysis','Funnel Analysis','Dashboarding','Excel'].map((t,i)=>(<Badge key={i} variant='outline'>{t}</Badge>))}
        </div>

        <div className='grid grid-cols-1 gap-4 mt-8 max-w-3xl mx-auto'>
          <Card>
            <CardHeader><CardTitle>Business Question</CardTitle></CardHeader>
            <CardContent className='text-sm leading-relaxed space-y-2'>
              <p className='opacity-90'>Two questions a growth/marketing stakeholder actually asks: <em>"Are new customers sticking around?"</em> and <em>"Where in the purchase path are we losing people?"</em> This project answers both with plain SQL against an orders/events schema, laid out as the dashboard a non-technical stakeholder could actually read.</p>
              <p className='opacity-70 text-xs'><strong>Note on this one:</strong> the numbers below come from a real, executed pipeline. A synthetic-but-realistic relational dataset (2,430 customers, 5,599 orders, 19,863 funnel events, generated with a Python script that models per-customer retention decay and sequential funnel drop-off) was loaded into an actual PostgreSQL 16 database, and the exact SQL shown below was run against it to produce every value in the charts. The rows are simulated — there's no real company behind this — but the schema, the queries, and the query results are genuine, not hand-typed.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Approach</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-2'>
              <ul className='list-disc pl-5 space-y-2 opacity-90'>
                <li>Defined each customer's <strong>cohort month</strong> as the month of their first order, then tracked what share of each cohort placed another order in each following month.</li>
                <li>Modeled the checkout path as four events (<code>viewed</code> → <code>added_to_cart</code> → <code>checked_out</code> → <code>purchased</code>) and computed conversion between consecutive steps.</li>
                <li>Surfaced both as a compact dashboard: a retention heatmap (where the color <em>is</em> the number) and a funnel chart with drop-off called out at each stage — the two views a stakeholder deck usually needs.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cohort Retention SQL</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{COHORT_SQL}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dashboard — Monthly Cohort Retention</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <CohortHeatmap />
              <p className='text-xs opacity-70'>Darker = higher retention. Dashed cells haven't had time to reach that month yet — a normal, unavoidable gap in any live cohort table, not missing data.</p>
              <p className='opacity-90'>Reading it: roughly half of new customers return at all after month 0, and retention flattens around 32–38% by month 3–5 — the plateau is the more decision-useful number than month-1 alone, since it's roughly the "true" long-run repeat-purchase rate.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Funnel SQL</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre className='overflow-x-auto text-xs md:text-sm'><code>{FUNNEL_SQL}</code></pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dashboard — Purchase Funnel</CardTitle></CardHeader>
            <CardContent className='text-sm space-y-3'>
              <FunnelChart />
              <p className='opacity-90'>The steepest drop is actually the top of the funnel — viewed → added to cart (only 33.0% continue) — not cart → checkout (56.0%) or checkout → purchase (75.7%). That points the highest-leverage fix at the product page itself (pricing, images, perceived trust) rather than checkout friction, which is the more common assumption.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Repo Structure</CardTitle></CardHeader>
            <CardContent className='text-sm'>
              <pre><code>{`retention_analytics/\n├─ generate_data.py     # builds customers/orders/funnel_events.csv\n├─ sql/\n│  ├─ cohort_retention.sql\n│  └─ funnel_conversion.sql\n├─ load.sql             # creates tables, \\copy loads the CSVs\n├─ data/ (customers.csv, orders.csv, funnel_events.csv)\n└─ README.md`}</code></pre>
            </CardContent>
          </Card>
        </div>

        <div className='text-center mt-6'>
          <Link to='/' className='underline'>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
