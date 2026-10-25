/**
 * The acquisition screen's deterministic arithmetic, ported from the mna project's Python
 * (dealsim/simulate.py medians/percentile, dealsim/model.py, dealsim/value.py) for one point of
 * inputs instead of a Monte Carlo array. Operation order follows the Python so the two agree to
 * floating-point round-off; scripts/demos/deal_parity.py checks that on a grid of inputs.
 *
 * Money is in $ millions, shares in millions, rates and shares of price as decimals.
 */

export type Triangular = { low: number; mode: number; high: number }

export type Deal = {
  acquirer: { net_income: number; shares: number; pe: number; ebitda: number; net_debt: number; cash: number; minimum_cash: number; earnings_growth: number }
  target: { net_income: number; pe: number; ebitda: number; net_debt: number }
  terms: { tax_rate: number; cash_yield: number; stock_issue_discount: number; intangibles_share_of_price: number; intangibles_life_years: number; max_leverage: number }
  plan: { synergies_run_rate: number; synergy_phase_in: readonly number[]; integration_cost_total: number; integration_cost_timing: readonly number[] }
  uncertainty: Record<UncertainInput, Triangular>
  base_structure: Structure
  valuation: { target_ebit: number; roic: number; explicit_years: number; terminal_growth: number; wacc: number; synergy_risk_premium: number; deal_fees_share_of_price: number; synergy_growth_needs_reinvestment?: boolean }
}

export type UncertainInput = 'premium' | 'synergy_realization' | 'integration_overrun' | 'debt_rate' | 'target_growth'
export type Point = Record<UncertainInput, number>
/** Shares of the price paid with cash on hand, new debt and new stock; they sum to 1. */
export type Structure = { cash: number; debt: number; stock: number }

/**
 * The project's deal.json (fictional companies), copied verbatim. deal_parity.py fails if this
 * drifts from the file.
 */
export const DEAL: Deal = {
  acquirer: { net_income: 120.0, shares: 60.0, pe: 18.0, ebitda: 260.0, net_debt: 300.0, cash: 250.0, minimum_cash: 50.0, earnings_growth: 0.04 },
  target: { net_income: 32.0, pe: 15.0, ebitda: 70.0, net_debt: 40.0 },
  terms: { tax_rate: 0.25, cash_yield: 0.035, stock_issue_discount: 0.03, intangibles_share_of_price: 0.15, intangibles_life_years: 15, max_leverage: 3.0 },
  plan: { synergies_run_rate: 20.0, synergy_phase_in: [0.35, 0.75, 1.0], integration_cost_total: 15.0, integration_cost_timing: [0.6, 0.4, 0.0] },
  uncertainty: {
    premium: { low: 0.2, mode: 0.35, high: 0.6 },
    synergy_realization: { low: 0.4, mode: 0.8, high: 1.1 },
    integration_overrun: { low: 0.9, mode: 1.1, high: 1.8 },
    debt_rate: { low: 0.055, mode: 0.065, high: 0.085 },
    target_growth: { low: -0.04, mode: 0.03, high: 0.08 },
  },
  base_structure: { cash: 0.2, debt: 0.4, stock: 0.4 },
  valuation: { target_ebit: 45.0, roic: 0.12, explicit_years: 5, terminal_growth: 0.025, wacc: 0.08, synergy_risk_premium: 0.02, deal_fees_share_of_price: 0.015 },
}

const YEARS = 3
const TOLERANCE = 1e-9 // same slack as the Python limit tests
/** Feasibility in the full screen is tested at this percentile of the premium (analysis.py). */
export const CAUTIOUS_PERCENTILE = 0.9
const UNCERTAIN: UncertainInput[] = ['premium', 'synergy_realization', 'integration_overrun', 'debt_rate', 'target_growth']

/** Closed-form median of each input's triangular distribution (simulate.medians). */
export function medians(deal: Deal): Point {
  const out = {} as Point
  for (const name of UNCERTAIN) {
    const { low: lo, mode, high: hi } = deal.uncertainty[name]
    out[name] = mode - lo >= (hi - lo) / 2
      ? lo + Math.sqrt((hi - lo) * (mode - lo) / 2)
      : hi - Math.sqrt((hi - lo) * (hi - mode) / 2)
  }
  return out
}

/** Inverse CDF of a triangular input at probability p (simulate.percentile). */
export function percentile(deal: Deal, name: UncertainInput, p: number): number {
  const { low: lo, mode, high: hi } = deal.uncertainty[name]
  const split = (mode - lo) / (hi - lo)
  return p < split ? lo + Math.sqrt(p * (hi - lo) * (mode - lo)) : hi - Math.sqrt((1 - p) * (hi - lo) * (hi - mode))
}

export function purchasePrice(deal: Deal, premium: number): number {
  return deal.target.net_income * deal.target.pe * (1 + premium)
}

export function dealFees(deal: Deal, price: number): number {
  return price * deal.valuation.deal_fees_share_of_price
}

/** Net debt / EBITDA right after close; synergies don't count toward EBITDA yet. */
export function leverageAtClose(deal: Deal, s: Structure, price: number): number {
  const a = deal.acquirer, t = deal.target
  const netDebt = a.net_debt + t.net_debt + price * (s.debt + s.cash) + dealFees(deal, price)
  return netDebt / (a.ebitda + t.ebitda)
}

export type Projection = {
  /** Pro forma EPS / standalone EPS − 1 for years 1–3. */
  accretion: number[]
  price: number
  fees: number
  cashUsed: number
  newShares: number
  leverage: number
}

/** Year 1–3 EPS accretion for one mix at one point of inputs (model.project). */
export function project(deal: Deal, point: Point, s: Structure): Projection {
  const a = deal.acquirer, t = deal.target, terms = deal.terms, plan = deal.plan
  const price = purchasePrice(deal, point.premium)
  const fees = dealFees(deal, price)
  const sharePrice = a.net_income / a.shares * a.pe
  const newShares = price * s.stock / (sharePrice * (1 - terms.stock_issue_discount))
  const newDebt = price * s.debt
  const cashUsed = price * s.cash
  const interest = newDebt * point.debt_rate
  // fees are paid from cash too, so the interest they would have earned is lost as well
  const lostInterestOnCash = (cashUsed + fees) * terms.cash_yield
  const amortization = price * terms.intangibles_share_of_price / terms.intangibles_life_years

  const accretion: number[] = []
  for (let y = 1; y <= YEARS; y++) {
    const acquirerNi = a.net_income * (1 + a.earnings_growth) ** y
    const targetNi = t.net_income * (1 + point.target_growth) ** y
    const synergies = plan.synergies_run_rate * point.synergy_realization * plan.synergy_phase_in[y - 1]
    const integration = plan.integration_cost_total * point.integration_overrun * plan.integration_cost_timing[y - 1]
    const pretax = synergies - integration - interest - lostInterestOnCash - amortization
    const proFormaNi = acquirerNi + targetNi + pretax * (1 - terms.tax_rate)
    const proFormaEps = proFormaNi / (a.shares + newShares)
    const standaloneEps = acquirerNi / a.shares
    accretion.push(proFormaEps / standaloneEps - 1)
  }
  return { accretion, price, fees, cashUsed, newShares, leverage: leverageAtClose(deal, s, price) }
}

export type Limits = { cashOk: boolean; leverageOk: boolean; cashNeeded: number; cashAvailable: number; leverage: number; maxLeverage: number }

/** Cash and leverage tests at one price (model.within_limits); fees are paid in cash whatever the mix. */
export function withinLimits(deal: Deal, s: Structure, price: number): Limits {
  const a = deal.acquirer
  const cashNeeded = price * s.cash + dealFees(deal, price)
  const cashAvailable = a.cash - a.minimum_cash
  const leverage = leverageAtClose(deal, s, price)
  return {
    cashOk: cashNeeded <= cashAvailable + TOLERANCE,
    leverageOk: leverage <= deal.terms.max_leverage + TOLERANCE,
    cashNeeded, cashAvailable, leverage, maxLeverage: deal.terms.max_leverage,
  }
}

const discount = (rate: number, year: number) => 1 / (1 + rate) ** year

/** Target enterprise value by value-driver DCF (value.standalone_value). */
export function standaloneValue(deal: Deal, targetGrowth: number): number {
  const v = deal.valuation, tax = deal.terms.tax_rate
  let pvExplicit = 0
  let lastNopat = 0
  for (let y = 1; y <= v.explicit_years; y++) {
    const nopat = v.target_ebit * (1 - tax) * (1 + targetGrowth) ** y
    // the last explicit year reinvests for the terminal growth rate
    const nextGrowth = y === v.explicit_years ? v.terminal_growth : targetGrowth
    const fcf = nopat * (1 - Math.max(nextGrowth, 0) / v.roic)
    pvExplicit += fcf * discount(v.wacc, y)
    lastNopat = nopat
  }
  const g = v.terminal_growth
  const terminal = lastNopat * (1 + g) * (1 - g / v.roic) / (v.wacc - g)
  return pvExplicit + terminal / (1 + v.wacc) ** v.explicit_years
}

/** PV of after-tax synergies, discounted at WACC plus the synergy risk premium (value.synergy_value). */
export function synergyValue(deal: Deal, realization: number): number {
  const v = deal.valuation, plan = deal.plan, tax = deal.terms.tax_rate
  const r = v.wacc + v.synergy_risk_premium
  let pv = 0
  let lastFlow = 0
  for (let y = 1; y <= YEARS; y++) {
    const flow = plan.synergies_run_rate * realization * plan.synergy_phase_in[y - 1] * (1 - tax)
    pv += flow * discount(r, y)
    lastFlow = flow
  }
  const g = v.terminal_growth
  const payout = v.synergy_growth_needs_reinvestment ? 1 - g / v.roic : 1.0
  return pv + lastFlow * (1 + g) * payout / (r - g) / (1 + r) ** YEARS
}

/** PV of after-tax integration costs at WACC (value.integration_cost_value). */
export function integrationCostValue(deal: Deal, overrun: number): number {
  const v = deal.valuation, plan = deal.plan, tax = deal.terms.tax_rate
  let pv = 0
  for (let y = 1; y <= YEARS; y++) {
    pv += plan.integration_cost_total * overrun * plan.integration_cost_timing[y - 1] * (1 - tax) * discount(v.wacc, y)
  }
  return pv
}

export type NpvParts = { standaloneValue: number; synergyValue: number; integrationCostValue: number; fees: number; costOfAcquisition: number; npv: number }

/** Value to the acquirer minus what it pays; financing effects are left out by design (value.npv). */
export function npv(deal: Deal, point: Point): NpvParts {
  const price = purchasePrice(deal, point.premium)
  const parts = {
    standaloneValue: standaloneValue(deal, point.target_growth),
    synergyValue: synergyValue(deal, point.synergy_realization),
    integrationCostValue: integrationCostValue(deal, point.integration_overrun),
    fees: dealFees(deal, price),
    costOfAcquisition: price + deal.target.net_debt,
  }
  const value = parts.standaloneValue + parts.synergyValue - parts.integrationCostValue - parts.fees - parts.costOfAcquisition
  return { ...parts, npv: value }
}

/** Premium at which NPV = 0 with everything else at `point`; NPV is linear in the premium, so this is exact. */
export function walkAwayPremium(deal: Deal, point: Point): number {
  const lo = npv(deal, { ...point, premium: 0 }).npv
  const hi = npv(deal, { ...point, premium: 1 }).npv
  return -lo / (hi - lo)
}

export type DealResult = {
  point: Point
  projection: Projection
  limits: Limits
  value: NpvParts
  walkAway: number
}

/** Everything the sandbox shows, for one premium, mix and synergy realization, other inputs at their medians. */
export function evaluateDeal(premium: number, s: Structure, synergyRealization: number, deal: Deal = DEAL): DealResult {
  const point: Point = { ...medians(deal), premium, synergy_realization: synergyRealization }
  const projection = project(deal, point, s)
  return {
    point,
    projection,
    limits: withinLimits(deal, s, projection.price),
    value: npv(deal, point),
    walkAway: walkAwayPremium(deal, point),
  }
}
