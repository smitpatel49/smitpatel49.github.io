import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CheckCircle2, UserRound } from 'lucide-react'
import { loadRouter, routeTicket, type Routed, type Router } from './routerModel'

/**
 * Live demo of the ticket router: type a ticket and see the queue, the top three confidences
 * and the policy decision, computed in the browser by the project's words-only model.
 *
 * The model (~310 kB of JSON, ~125 kB gzipped) is fetched only when the demo nears the
 * viewport or someone interacts with it, so the case-study page doesn't pay for it up front.
 */

// Written in the style of the project's ticket generator (routing/generate.py): a subject,
// an opening, an issue sentence built from its phrasings, sometimes a second issue, a sign-off.
const EXAMPLES = [
  { label: 'Double charge', text: 'Subject: Charge on my card. Hi, you double charged my card for the pro plan. Thanks' },
  { label: 'Feature idea', text: 'Subject: Suggestion. Any plans for dark mode in the ipad app? Thanks in advance' },
  { label: 'Two problems', text: 'Subject: Problem. Hi, I keep getting logged out every few minutes. Also, you sent me the wrong jacket.' },
  { label: 'Vague', text: 'Subject: Question. Hi, can you take a look at this? Thanks' },
]

const QUEUE_NAMES: Record<string, string> = {
  billing: 'Billing',
  technical: 'Technical',
  shipping: 'Shipping',
  account_access: 'Account access',
  returns: 'Returns',
  feature_request: 'Feature requests',
}

const MODEL_URL = import.meta.env.BASE_URL + 'demos/router.json'
const DEBOUNCE_MS = 150
const MAX_CHARS = 2000

const PRINT_EXACT: CSSProperties = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }

const queueName = (q: string) => QUEUE_NAMES[q] ?? q

/** Probability as a percentage with one decimal, without claiming certainty the rounding hides. */
function pct(p: number): string {
  if (p >= 0.9995) return '>99.9%'
  if (p > 0 && p < 0.0005) return '<0.1%'
  return (p * 100).toFixed(1) + '%'
}

const whole = (p: number) => Math.round(p * 100) + '%'

type Status = 'idle' | 'loading' | 'ready' | 'error'

/** Loads the router when `ref` comes within reach of the viewport, or when `load` is called. */
function useLazyRouter() {
  const [router, setRouter] = useState<Router | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const load = useCallback(() => {
    if (started.current) return
    started.current = true
    setStatus('loading')
    loadRouter(MODEL_URL)
      .then(r => { setRouter(r); setStatus('ready') })
      .catch(() => { started.current = false; setStatus('error') })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { load(); return }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { load(); io.disconnect() }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [load])

  return { router, status, ref, load }
}

function useDebounced<T>(value: T, ms: number): [T, (v: T) => void] {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return [debounced, setDebounced]
}

export default function TicketRouter() {
  const { router, status, ref, load } = useLazyRouter()
  const [text, setText] = useState(EXAMPLES[0].text)
  const [debounced, setNow] = useDebounced(text, DEBOUNCE_MS)
  const inputId = useId()
  const hintId = useId()

  const result = useMemo(
    () => (router && debounced.trim() ? routeTicket(router, debounced) : null),
    [router, debounced],
  )

  const pick = (example: string) => {
    load()
    setText(example)
    setNow(example) // an example is a complete ticket: no need to wait for typing to settle
  }

  return (
    // Two columns only when there's room for both at a comfortable width (the home page's demo
    // frame), one column in a narrower case-study card or on a phone.
    <div ref={ref} className='grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]'>
      <div className='space-y-2'>
        <label htmlFor={inputId} className='block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
          Ticket text
        </label>
        <textarea
          id={inputId}
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={load}
          onPointerEnter={load}
          rows={4}
          maxLength={MAX_CHARS}
          spellCheck={false}
          aria-describedby={hintId}
          placeholder='Write a support ticket, e.g. “My order has not arrived”'
          className='block w-full resize-y rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/70 px-3 py-2 text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:border-transparent'
        />
        <div className='flex flex-wrap items-center gap-2' role='group' aria-label='Example tickets'>
          <span className='text-xs text-neutral-600 dark:text-neutral-400'>Examples:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              type='button'
              onClick={() => pick(ex.text)}
              aria-pressed={text === ex.text}
              className='rounded-full border px-3 py-1.5 text-xs transition-colors motion-reduce:transition-none border-neutral-300 dark:border-neutral-700 hover:border-accent-500 hover:bg-accent-500/10 aria-pressed:border-accent-600 aria-pressed:bg-accent-500/15 dark:aria-pressed:border-accent-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'
            >
              {ex.label}
            </button>
          ))}
        </div>
        <p id={hintId} className='text-xs text-neutral-600 dark:text-neutral-400'>
          Results update as you type. The model runs in your browser; nothing you type is sent anywhere.
        </p>
      </div>

      {status === 'error' ? (
        <div role='alert' className='self-start rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm'>
          The model didn’t load.{' '}
          <button type='button' onClick={load} className='font-medium underline underline-offset-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'>
            Try again
          </button>
        </div>
      ) : (
        <Result router={router} result={result} loading={status !== 'ready'} />
      )}

      {router && (
        <p className='col-span-full text-xs text-neutral-600 dark:text-neutral-400'>
          This is the words-only model ({pct(router.metrics.wordsNewWording)} on unseen wording); the shipped
          router adds character n-grams ({pct(router.metrics.shippedNewWording)}). The ticks mark this model’s own
          policy, picked on validation tickets: auto-route when the top queue reaches {whole(router.policy.threshold)}
          {' '}and the runner-up stays below {whole(router.policy.runnerUpMax)}.
        </p>
      )}
    </div>
  )
}

function Result({ router, result, loading }: { router: Router | null; result: Routed | null; loading: boolean }) {
  return (
    <div className='rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 p-3 sm:p-4 space-y-4'>
      <Decision router={router} result={result} loading={loading} />
      {router && result && <QueueBars router={router} result={result} />}
      {result && <Evidence result={result} />}
    </div>
  )
}

function decisionTitle(result: Routed): string {
  const top = queueName(result.ranked[0].queue)
  if (result.decision === 'auto_route') return `Auto-route to ${top}`
  return result.reason === 'low confidence' ? 'Send to a person: low confidence' : 'Send to a person: looks like two issues'
}

function decisionDetail(router: Router, result: Routed): string {
  const [first, second] = result.ranked
  const { threshold, runnerUpMax } = router.policy
  if (result.reason === 'confident') {
    return `${queueName(first.queue)} is at ${pct(first.probability)} (needs ${whole(threshold)}), and the runner-up is below ${whole(runnerUpMax)}.`
  }
  if (result.reason === 'low confidence') {
    return `The best guess, ${queueName(first.queue)}, is at ${pct(first.probability)}: below the ${whole(threshold)} needed. A person sees the suggestion.`
  }
  return `${queueName(first.queue)} is likely, but ${queueName(second.queue)} is at ${pct(second.probability)}, at or above the ${whole(runnerUpMax)} limit for a runner-up.`
}

function Decision({ router, result, loading }: { router: Router | null; result: Routed | null; loading: boolean }) {
  const auto = result?.decision === 'auto_route'
  const Icon = auto ? CheckCircle2 : UserRound
  const title = loading ? 'Loading the model…' : result ? decisionTitle(result) : 'Type a ticket to see where it goes'
  return (
    <div className='flex items-start gap-3'>
      {result && (
        <Icon aria-hidden='true' className={`mt-0.5 h-5 w-5 shrink-0 ${auto ? 'text-accent-600 dark:text-accent-400' : 'text-amber-700 dark:text-amber-400'}`} />
      )}
      <div className='min-w-0'>
        {/* Only the decision itself is live: the percentages below change on every keystroke. */}
        <p role='status' className='text-base font-semibold text-neutral-900 dark:text-neutral-50'>{title}</p>
        {router && result && <p className='mt-0.5 text-xs text-neutral-700 dark:text-neutral-300'>{decisionDetail(router, result)}</p>}
      </div>
    </div>
  )
}

function QueueBars({ router, result }: { router: Router; result: Routed }) {
  const ticks = [router.policy.threshold, router.policy.runnerUpMax]
  return (
    <ol aria-label='Top three queues' className='space-y-2.5'>
      {result.ranked.slice(0, 3).map((s, i) => (
        <li key={s.queue}>
          <div className='flex items-baseline justify-between gap-3 text-sm'>
            <span className={i === 0 ? 'font-medium text-neutral-900 dark:text-neutral-50' : 'text-neutral-700 dark:text-neutral-300'}>
              {queueName(s.queue)}
            </span>
            <span className='font-mono text-xs tabular-nums text-neutral-700 dark:text-neutral-300'>{pct(s.probability)}</span>
          </div>
          {/* exact: browsers drop background colors when printing, and the bars are backgrounds */}
          <div aria-hidden='true' className='relative mt-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 print:!bg-neutral-200' style={PRINT_EXACT}>
            <div
              className={`h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none ${i === 0 ? 'bg-accent-600 dark:bg-accent-500' : 'bg-neutral-500 dark:bg-neutral-400'}`}
              style={{ width: `${Math.max(0.5, s.probability * 100)}%` }}
            />
            {i < 2 && (
              <span
                className='absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded bg-neutral-900/70 dark:bg-white/80 print:!bg-neutral-900/70'
                style={{ left: `${ticks[i] * 100}%` }}
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function Evidence({ result }: { result: Routed }) {
  if (result.knownTerms === 0) {
    return (
      <p className='text-xs text-neutral-700 dark:text-neutral-300'>
        None of these words appear in the training tickets, so the scores are only the model’s base rates.
      </p>
    )
  }
  if (result.evidence.length === 0) return null
  return (
    <p className='text-xs text-neutral-700 dark:text-neutral-300'>
      Words pulling toward {queueName(result.ranked[0].queue)}:{' '}
      {result.evidence.map((w, i) => (
        <span key={w}>
          {i > 0 && ', '}
          <span className='font-mono'>“{w}”</span>
        </span>
      ))}
    </p>
  )
}
