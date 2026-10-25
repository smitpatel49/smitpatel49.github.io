/**
 * The ticket-routing project's words-only router, reimplemented for the browser.
 *
 * It reproduces, step for step, what TfidfModel(use_chars=False).predict_proba does in
 * Python, from the parameters that scripts/demos/router/export_router.py writes to
 * /demos/router.json:
 *   1. scikit-learn's TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=2):
 *      lowercase, token_pattern (?u)\b\w\w+\b, unigrams and bigrams, tf → 1 + ln(tf),
 *      × idf (smooth), L2 norm over the vocabulary terms present;
 *   2. multinomial logistic regression: softmax(Xw + b);
 *   3. temperature scaling: softmax(ln(p + 1e-12) / T);
 *   4. the routing policy from routing/policy.py: auto-route when the top queue is at least
 *      the threshold and the runner-up is strictly below its limit.
 * scripts/demos/router/parity.py checks the probabilities against scikit-learn (max abs
 * difference ≤ 1e-6 on every test ticket).
 */

export type Decision = 'auto_route' | 'human_review'
export type Reason = 'confident' | 'low confidence' | 'looks like two issues'

/** The JSON shape written by export_router.py (format 1). */
export interface RouterData {
  format: 1
  queues: string[]
  vectorizer: { nDocs: number; ngramRange: [number, number] }
  temperature: number
  eps: number
  policy: { threshold: number; runnerUpMax: number }
  metrics: { wordsNewWording: number; wordsNewIssueTypes: number; shippedNewWording: number; shippedNewIssueTypes: number }
  intercept: number[]
  coefDecimals: number
  vocab: string[]
  df: number[]
  coef: number[][]
}

export interface Router {
  queues: string[]
  policy: RouterData['policy']
  metrics: RouterData['metrics']
  vocab: string[]
  ngramRange: [number, number]
  temperature: number
  eps: number
  index: Map<string, number>
  idf: Float64Array
  /** coef[q][term] as floats, one row per queue in `queues` order. */
  coef: Float64Array[]
  intercept: Float64Array
}

export interface QueueScore { queue: string; probability: number }

export interface Routed {
  /** All queues, most likely first. */
  ranked: QueueScore[]
  decision: Decision
  reason: Reason
  /** How many of the ticket's distinct unigrams and bigrams are in the vocabulary. */
  knownTerms: number
  /** Known terms that push hardest toward the top queue (largest positive x·w), strongest first. */
  evidence: string[]
}

// Python's \w (str.isalnum() or "_") is Unicode letters, numbers and the underscore. A run of
// two or more of them is exactly what \b\w\w+\b finds; the `u` flag counts code points, as
// Python does, so a single astral letter is still too short to be a token.
const TOKEN = /[\p{L}\p{N}_]{2,}/gu

/** TfidfVectorizer's analyzer: lowercase, tokens, then the n-grams in `ngramRange`. */
export function analyze(text: string, ngramRange: [number, number] = [1, 2]): string[] {
  const tokens = text.toLowerCase().match(TOKEN) ?? []
  const [lo, hi] = ngramRange
  const grams: string[] = []
  for (let n = lo; n <= hi; n++) {
    for (let i = 0; i + n <= tokens.length; i++) grams.push(n === 1 ? tokens[i] : tokens.slice(i, i + n).join(' '))
  }
  return grams
}

function softmaxInPlace(z: Float64Array): Float64Array {
  let max = -Infinity
  for (const v of z) if (v > max) max = v
  let sum = 0
  for (let i = 0; i < z.length; i++) { z[i] = Math.exp(z[i] - max); sum += z[i] }
  for (let i = 0; i < z.length; i++) z[i] /= sum
  return z
}

export function createRouter(data: RouterData): Router {
  const n = data.vocab.length
  const index = new Map<string, number>()
  data.vocab.forEach((term, i) => index.set(term, i))
  const idf = new Float64Array(n)
  // smooth_idf: as if one extra document contained every term once
  for (let i = 0; i < n; i++) idf[i] = Math.log((1 + data.vectorizer.nDocs) / (1 + data.df[i])) + 1
  const scale = 10 ** data.coefDecimals
  return {
    queues: data.queues,
    policy: data.policy,
    metrics: data.metrics,
    vocab: data.vocab,
    ngramRange: data.vectorizer.ngramRange,
    temperature: data.temperature,
    eps: data.eps,
    index,
    idf,
    coef: data.coef.map(row => Float64Array.from(row, v => v / scale)),
    intercept: Float64Array.from(data.intercept),
  }
}

/** Sparse TF-IDF vector of one text: term index → weight (L2-normalized). */
function features(router: Router, text: string): Map<number, number> {
  const counts = new Map<number, number>()
  for (const gram of analyze(text, router.ngramRange)) {
    const i = router.index.get(gram)
    if (i !== undefined) counts.set(i, (counts.get(i) ?? 0) + 1)
  }
  let norm = 0
  for (const [i, tf] of counts) {
    const w = (1 + Math.log(tf)) * router.idf[i]
    counts.set(i, w)
    norm += w * w
  }
  norm = Math.sqrt(norm)
  if (norm > 0) for (const [i, w] of counts) counts.set(i, w / norm)
  return counts
}

function probabilitiesFrom(router: Router, x: Map<number, number>): Float64Array {
  const k = router.queues.length
  const logits = new Float64Array(k)
  for (let q = 0; q < k; q++) {
    let z = router.intercept[q]
    for (const [i, w] of x) z += w * router.coef[q][i]
    logits[q] = z
  }
  const p = softmaxInPlace(logits)
  for (let q = 0; q < k; q++) p[q] = Math.log(p[q] + router.eps) / router.temperature
  return softmaxInPlace(p)
}

/** Calibrated probabilities, one per queue in `router.queues` order. */
export function predictProba(router: Router, text: string): Float64Array {
  return probabilitiesFrom(router, features(router, text))
}

/** The policy decision for one non-empty ticket, as routing/policy.py's route() makes it. */
export function routeTicket(router: Router, text: string, evidenceCount = 3): Routed {
  const x = features(router, text)
  const p = probabilitiesFrom(router, x)
  const ranked = router.queues
    .map((queue, q) => ({ queue, probability: p[q] }))
    .sort((a, b) => b.probability - a.probability)
  const top = ranked[0].probability
  const second = ranked[1]?.probability ?? 0
  const { threshold, runnerUpMax } = router.policy
  const auto = top >= threshold && second < runnerUpMax
  const reason: Reason = auto ? 'confident' : top < threshold ? 'low confidence' : 'looks like two issues'

  const topRow = router.coef[router.queues.indexOf(ranked[0].queue)]
  const evidence = [...x]
    .map(([i, w]) => ({ term: router.vocab[i], push: w * topRow[i] }))
    .filter(e => e.push > 0)
    .sort((a, b) => b.push - a.push)
    .slice(0, evidenceCount)
    .map(e => e.term)

  return { ranked, decision: auto ? 'auto_route' : 'human_review', reason, knownTerms: x.size, evidence }
}

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every(n => typeof n === 'number' && Number.isFinite(n))
}

/** Shape check, so a stale or truncated file fails loudly instead of routing nonsense. */
export function isRouterData(v: unknown): v is RouterData {
  if (typeof v !== 'object' || v === null) return false
  const d = v as Record<string, unknown>
  const queues = d.queues
  if (d.format !== 1 || !Array.isArray(queues) || !queues.every(q => typeof q === 'string')) return false
  const vocab = d.vocab
  if (!Array.isArray(vocab) || !vocab.every(t => typeof t === 'string')) return false
  const coef = d.coef
  return isNumberArray(d.df) && d.df.length === vocab.length
    && isNumberArray(d.intercept) && d.intercept.length === queues.length
    && Array.isArray(coef) && coef.length === queues.length
    && coef.every(row => isNumberArray(row) && row.length === vocab.length)
    && typeof d.temperature === 'number' && typeof d.eps === 'number' && typeof d.coefDecimals === 'number'
    && typeof d.policy === 'object' && d.policy !== null
    && typeof d.metrics === 'object' && d.metrics !== null
    && typeof d.vectorizer === 'object' && d.vectorizer !== null
}

let pending: Promise<Router> | null = null

/** Fetch and build the router once per page load; a failed fetch can be retried. */
export function loadRouter(url: string): Promise<Router> {
  pending ??= fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<unknown>
    })
    .then(json => {
      if (!isRouterData(json)) throw new Error('unexpected router.json format')
      return createRouter(json)
    })
    .catch((err: unknown) => {
      pending = null
      throw err
    })
  return pending
}
