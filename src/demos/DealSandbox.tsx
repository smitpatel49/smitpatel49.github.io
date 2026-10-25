import { useMemo, useState } from 'react'
import { CircleCheck, CircleX, RotateCcw } from 'lucide-react'
import { DemoFrame, MUTED, PRINT_FILL, SMALL_BUTTON, Slider } from './controls'
import { CAUTIOUS_PERCENTILE, DEAL, evaluateDeal, medians, percentile, type DealResult } from './dealModel'
import { money, pct, points, times } from './format'

const MEDIANS = medians(DEAL)
const CAUTIOUS_PREMIUM = percentile(DEAL, 'premium', CAUTIOUS_PERCENTILE)
const MARKET_VALUE = DEAL.target.net_income * DEAL.target.pe
// The financing mix is kept in tenths so cash + debt + stock is always exactly 10.
const PROPOSED = { cash: DEAL.base_structure.cash * 10, debt: DEAL.base_structure.debt * 10 }
const PRESETS = [
  { label: 'Proposed', cash: PROPOSED.cash, debt: PROPOSED.debt },
  { label: 'Best that fits', cash: 2, debt: 6 }, // the project's best feasible mix (README)
  { label: 'All stock', cash: 0, debt: 0 },
] as const
const EPS_SCALE = 0.15 // bar half-width in accretion terms; values beyond it are clamped

const mixLabel = (cash: number, debt: number) => `${cash * 10}% cash / ${debt * 10}% debt / ${(10 - cash - debt) * 10}% stock`

/** The one plain-language sentence: what EPS does, whether the price creates value, and whether the mix fits. */
function verdict(r: DealResult): string {
  const acc = r.projection.accretion
  const first = acc.findIndex(a => a > 0)
  const epsGood = acc[2] > 0
  const eps = first === -1 ? 'Dilutive in all three years'
    : !epsGood ? 'Dilutive again by year 3'
    : first === 2 ? 'Accretive by year 3' : `Accretive from year ${first + 1}`
  const valueGood = r.value.npv >= 0
  const broken = [!r.limits.cashOk && 'cash', !r.limits.leverageOk && 'leverage'].filter(Boolean)
  const limits = broken.length ? `, and this mix breaks the ${broken.join(' and ')} limit${broken.length > 1 ? 's' : ''}` : ''
  return `${eps} ${epsGood === valueGood ? 'and' : 'but'} ${valueGood ? 'creates' : 'destroys'} value at this price${limits}.`
}

function EpsBar({ value }: { value: number }) {
  const share = Math.min(Math.abs(value), EPS_SCALE) / EPS_SCALE * 50
  return (
    <div className={'relative h-2 rounded-full bg-neutral-200/80 dark:bg-neutral-800 print:!bg-neutral-200 ' + PRINT_FILL} aria-hidden='true'>
      <div className='absolute inset-y-0 left-1/2 w-px bg-neutral-500' />
      <div
        className={'absolute inset-y-0 rounded-full ' + (value >= 0 ? 'bg-accent-600 dark:bg-accent-400' : 'bg-neutral-500 dark:bg-neutral-400')}
        style={value >= 0 ? { left: '50%', width: share + '%' } : { right: '50%', width: share + '%' }}
      />
    </div>
  )
}

function LimitRow({ ok, label, detail, used, limit }: { ok: boolean; label: string; detail: string; used: number; limit: number }) {
  const Icon = ok ? CircleCheck : CircleX
  return (
    <li className='flex gap-2.5'>
      <Icon className={'w-5 h-5 shrink-0 mt-0.5 ' + (ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')} aria-hidden='true' />
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
          <span className='font-medium'>{label}</span>
          <span className={'text-xs font-medium ' + (ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>{ok ? 'Within limit' : 'Over limit'}</span>
        </div>
        <p className={'text-xs ' + MUTED}>{detail}</p>
        <div className={'mt-1 h-1.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 print:!bg-neutral-200 ' + PRINT_FILL} aria-hidden='true'>
          <div className={'h-full rounded-full ' + (ok ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-red-600 dark:bg-red-400')} style={{ width: Math.min(used / limit, 1) * 100 + '%' }} />
        </div>
      </div>
    </li>
  )
}

const H4 = 'text-xs uppercase tracking-wide font-medium mb-2 ' + MUTED

export default function DealSandbox() {
  const [premium, setPremium] = useState(MEDIANS.premium)
  const [mix, setMix] = useState<{ cash: number; debt: number }>(PROPOSED)
  const [realization, setRealization] = useState(MEDIANS.synergy_realization)

  const stock = 10 - mix.cash - mix.debt
  const r = useMemo(
    () => evaluateDeal(premium, { cash: mix.cash / 10, debt: mix.debt / 10, stock: stock / 10 }, realization),
    [premium, mix.cash, mix.debt, stock, realization],
  )
  const { projection: p, limits, value } = r
  const worthToUs = value.standaloneValue + value.synergyValue - value.integrationCostValue - value.fees
  // compared at the precision shown, so the stated gap is the difference of the two displayed figures
  const gap = (Math.round(premium * 1000) - Math.round(r.walkAway * 1000)) / 1000

  const reset = () => { setPremium(MEDIANS.premium); setMix(PROPOSED); setRealization(MEDIANS.synergy_realization) }

  return (
    <DemoFrame
      id='deal-sandbox'
      title='M&A deal sandbox'
      intro={<>The acquisition screen’s EPS bridge, financing limits and DCF, ported from the project’s Python model and checked against it. Set the price, the financing and how much of the synergy plan shows up; every other input stays at its median.</>}
      caseStudy={{ slug: 'mna', title: 'Acquisition Screen: Accretion, Financing & Value' }}
    >
      <div className='grid gap-x-8 gap-y-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'>
        <div className='space-y-6'>
          <Slider
            id='deal-premium' label='Premium paid' min={0} max={60} step={1}
            value={premium * 100} valueText={pct(premium)}
            onChange={v => setPremium(v / 100)}
            hint={<>Price {money(p.price)} for a target worth {money(MARKET_VALUE)} at market. Median assumption {pct(MEDIANS.premium)}.</>}
          />

          <fieldset className='min-w-0 space-y-3'>
            <legend className='text-sm font-medium'>Financing mix</legend>
            <div className='flex flex-wrap gap-1.5' role='group' aria-label='Preset mixes'>
              {PRESETS.map(m => (
                <button
                  key={m.label} type='button' className={SMALL_BUTTON}
                  aria-pressed={mix.cash === m.cash && mix.debt === m.debt}
                  onClick={() => setMix({ cash: m.cash, debt: m.debt })}
                >
                  {m.label}<span className='sr-only'>: {mixLabel(m.cash, m.debt)}</span>
                </button>
              ))}
            </div>
            <Slider
              id='deal-cash' label='Cash on hand' min={0} max={100} step={10}
              value={mix.cash * 10} valueText={mix.cash * 10 + '%'}
              onChange={v => setMix(m => ({ cash: v / 10, debt: Math.min(m.debt, 10 - v / 10) }))}
            />
            <Slider
              id='deal-debt' label='New debt' min={0} max={100} step={10}
              value={mix.debt * 10} valueText={mix.debt * 10 + '%'}
              onChange={v => setMix(m => ({ debt: v / 10, cash: Math.min(m.cash, 10 - v / 10) }))}
            />
            <div>
              <div className={'flex h-3 overflow-hidden rounded-full ' + PRINT_FILL} aria-hidden='true'>
                <div className='bg-neutral-500' style={{ width: mix.cash * 10 + '%' }} />
                <div className='bg-accent-700' style={{ width: mix.debt * 10 + '%' }} />
                <div className='bg-accent-400' style={{ width: stock * 10 + '%' }} />
              </div>
              <p className={'mt-1.5 text-xs ' + MUTED}>
                <span className='inline-flex items-center gap-1'><span className={'inline-block w-2 h-2 rounded-full bg-neutral-500 ' + PRINT_FILL} aria-hidden='true' />Cash {mix.cash * 10}%</span>{' · '}
                <span className='inline-flex items-center gap-1'><span className={'inline-block w-2 h-2 rounded-full bg-accent-700 ' + PRINT_FILL} aria-hidden='true' />Debt {mix.debt * 10}%</span>{' · '}
                <span className='inline-flex items-center gap-1'><span className={'inline-block w-2 h-2 rounded-full bg-accent-400 ' + PRINT_FILL} aria-hidden='true' />Stock {stock * 10}%</span>
                {' '}(the rest: {p.newShares.toFixed(1)}M new shares)
              </p>
            </div>
          </fieldset>

          <Slider
            id='deal-synergies' label='Synergies realized' min={0} max={120} step={1}
            value={realization * 100} valueText={pct(realization, 0) + ' of plan'}
            onChange={v => setRealization(v / 100)}
            hint={<>Of a {money(DEAL.plan.synergies_run_rate)} a year run-rate plan. Median assumption {pct(MEDIANS.synergy_realization, 0)}.</>}
          />

          <button type='button' onClick={reset} className={SMALL_BUTTON}>
            <RotateCcw className='w-3.5 h-3.5' aria-hidden='true' />Reset to median inputs
          </button>
        </div>

        <div className='space-y-6 min-w-0'>
          <p aria-live='polite' className='text-base font-medium leading-snug border-l-2 border-accent-600 dark:border-accent-400 pl-3'>{verdict(r)}</p>

          <section aria-labelledby='deal-eps'>
            <h4 id='deal-eps' className={H4}>EPS change vs. standalone</h4>
            <ul className='grid grid-cols-3 gap-3'>
              {p.accretion.map((a, i) => (
                <li key={i} className='space-y-1.5'>
                  <div className={'text-xs ' + MUTED}>Year {i + 1}</div>
                  <div className='text-lg font-semibold tabular-nums'>{pct(a, 1, true)}</div>
                  <EpsBar value={a} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby='deal-limits'>
            <h4 id='deal-limits' className={H4}>Fits the limits at this price?</h4>
            <ul className='space-y-3 text-sm'>
              <LimitRow
                ok={limits.cashOk} label='Cash' used={limits.cashNeeded} limit={limits.cashAvailable}
                detail={`${money(limits.cashNeeded)} needed, fees included, of ${money(limits.cashAvailable)} above the minimum balance`}
              />
              <LimitRow
                ok={limits.leverageOk} label='Leverage at close' used={limits.leverage} limit={limits.maxLeverage}
                detail={`Net debt / EBITDA ${times(limits.leverage)} against a ${times(limits.maxLeverage, 1)} cap (no credit for synergies)`}
              />
            </ul>
          </section>

          <section aria-labelledby='deal-value'>
            <h4 id='deal-value' className={H4}>Value to the acquirer</h4>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <div className={'text-xs ' + MUTED}>NPV</div>
                <div className={'text-2xl font-semibold tabular-nums ' + (value.npv >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>{money(value.npv, true)}</div>
                <p className={'text-xs ' + MUTED}>{value.npv >= 0 ? 'Worth more to us than it costs' : 'Costs more than it’s worth to us'}</p>
              </div>
              <div>
                <div className={'text-xs ' + MUTED}>Walk-away premium</div>
                <div className='text-2xl font-semibold tabular-nums'>{pct(r.walkAway)}</div>
                <p className={'text-xs ' + MUTED}>
                  {gap === 0 ? 'You’re offering exactly that' : `You’re offering ${points(Math.abs(gap))} ${gap > 0 ? 'above' : 'below'} it`}
                </p>
              </div>
            </div>
            <dl className='mt-4 text-sm grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums sm:max-w-sm'>
              <dt className={MUTED}>Target on its own (DCF)</dt><dd className='text-right'>{money(value.standaloneValue)}</dd>
              <dt className={MUTED}>Plus synergies</dt><dd className='text-right'>{money(value.synergyValue, true)}</dd>
              <dt className={MUTED}>Less integration costs</dt><dd className='text-right'>{money(-value.integrationCostValue)}</dd>
              <dt className={MUTED}>Less fees</dt><dd className='text-right'>{money(-value.fees)}</dd>
              <dt className='font-medium border-t border-neutral-300 dark:border-neutral-700 pt-1'>Worth to us</dt>
              <dd className='text-right font-medium border-t border-neutral-300 dark:border-neutral-700 pt-1'>{money(worthToUs)}</dd>
              <dt className={MUTED}>Paid, including the target’s debt</dt><dd className='text-right'>{money(value.costOfAcquisition)}</dd>
            </dl>
          </section>
        </div>
      </div>

      <p className={'mt-6 text-xs leading-relaxed ' + MUTED}>
        This is one deterministic run at median assumptions for integration overrun, debt rate and target growth.
        Probabilities, such as the 93% chance of year-3 accretion for the proposed deal, need the project’s
        20,000-draw simulation; the case study has them. The full screen also requires a mix to fit at the
        90th-percentile premium ({pct(CAUTIOUS_PREMIUM, 0)}), and the financing mix doesn’t enter NPV by design:
        it changes how EPS looks, not what the target is worth.
      </p>
    </DemoFrame>
  )
}
