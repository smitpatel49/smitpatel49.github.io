import type { ComponentType } from 'react'
import {
  Database, GitMerge, PhoneCall, TrendingUp, ScanLine, CalendarClock, MessageSquareText, ShieldCheck,
} from 'lucide-react'

export type ProjectMetric = {
  /** The number as displayed, with its unit or sign (e.g. '27.5%', '+20.0 pts'). */
  value: string
  /** What the number measures, short enough for one or two lines on a compact tile. */
  label: string
}

export type ProjectMeta = {
  slug: string
  title: string
  summary: string
  tech: string[]
  icon: ComponentType<{ className?: string }>
  /** The kind of work, shown above the title on the home page and searched by the command menu. */
  area: string
  /** One headline number from the project's README or results/. */
  metric: ProjectMetric
  /** Featured projects get a large tile on the home page, with `result` as their one-line takeaway. */
  featured?: boolean
  result?: string
}

// Slugs are part of the public URLs (/projects/<slug>), so they stay fixed. The order is the
// home page's order (featured first) and the case-study pager's Previous/Next order.
// Every number below is traceable to that project's README.
export const projects: ProjectMeta[] = [
  { slug: 'forecast', title: 'Week-Ahead Demand Forecasting', area: 'Data science', featured: true,
    summary: 'Global LightGBM over seven horizons with leakage tests and conformal stock levels: 27.5% WAPE against a 25.9% noise floor, and level with Holt-Winters on a real retailer.',
    metric: { value: '27.5%', label: 'WAPE against a 25.9% noise floor' },
    result: 'Beats Holt-Winters (29.1%) on simulated data, and reports that it doesn’t on a real retailer (38.7% vs 38.0%).',
    tech: ['LightGBM', 'Holt-Winters', 'Conformal prediction', 'Time series'], icon: CalendarClock },
  { slug: 'nlp', title: 'Support Ticket Routing', area: 'NLP', featured: true,
    summary: 'Calibrated classifiers and a cost-based policy auto-route 80% of tickets at 94.6% accuracy. On unseen intents in public data, keyword models fall to 59% while a pretrained encoder holds 85%.',
    metric: { value: '80%', label: 'of tickets auto-routed at 94.6% accuracy' },
    result: 'On intents never seen in training, keyword models fall to 59% while a pretrained encoder holds 85%.',
    tech: ['scikit-learn', 'PyTorch', 'Sentence embeddings', 'Calibration'], icon: MessageSquareText },
  { slug: 'analytics', title: 'Customer Retention & Funnel Analytics', area: 'Analytics', featured: true,
    summary: 'SQL cohorts and ordered funnels checked against pandas and PostgreSQL, a +20-point checkout fix measured with difference-in-differences, and a real UK retailer’s two years of invoices.',
    metric: { value: '+20.0 pts', label: 'checkout completion from a mobile fix (difference-in-differences)' },
    result: 'Only 7.5% of paid-social customers buy again at month 3, against 19–22% for every other channel.',
    tech: ['SQL', 'PostgreSQL', 'Difference-in-differences', 'Wilson intervals', 'Dashboards'], icon: Database },
  { slug: 'bank', title: 'Call-Center Targeting Model', area: 'Machine learning',
    summary: 'A ranking model chosen on precision at the call center’s 15% capacity: 3.0× lift on synthetic data, 3.2× on the real UCI calls, served by a CLI and a FastAPI service.',
    metric: { value: '3.2×', label: 'lift at 15% call capacity on real UCI calls' },
    tech: ['scikit-learn', 'XGBoost', 'Bootstrap CIs', 'FastAPI', 'Docker'], icon: PhoneCall },
  { slug: 'stock', title: 'Regime-Aware Tail Risk', area: 'Risk modeling',
    summary: 'A hand-written Student-t HMM drives a hold-or-reduce call, checked against the true process on 40 synthetic histories; 1-day VaR backtests on ten years of the S&P 500 flip the model ranking.',
    metric: { value: '0.4 pts', label: 'average VaR95 bias over 40 histories, vs 1.4 for the bootstrap' },
    tech: ['HMM', 'GARCH', 'VaR backtests', 'Monte Carlo', 'S&P 500'], icon: TrendingUp },
  { slug: 'mna', title: 'Acquisition Screen: Accretion, Financing & Value', area: 'Corporate finance',
    summary: 'Monte Carlo EPS accretion across 66 financing mixes, then a DCF: accretive by year 3 in 93% of scenarios, value-creating in 5%. Walk-away premium 20% against an expected 38%.',
    metric: { value: '20%', label: 'walk-away premium, against an expected 38%' },
    tech: ['Python', 'Monte Carlo', 'DCF', 'Corporate finance'], icon: GitMerge },
  { slug: 'account-risk', title: 'Account Health & Renewal Risk', area: 'Business analysis',
    summary: 'Requirements traced to tests, data checks, a worklist and dashboard, and a backtest showing the agreed at-risk rule caught 14% of churned ARR; one threshold change catches 48%.',
    metric: { value: '14% → 48%', label: 'of churned ARR caught: agreed rule, then one threshold change' },
    tech: ['Business analysis', 'Requirements', 'Backtesting', 'Dashboards'], icon: ShieldCheck },
  { slug: 'adas', title: 'Closed-Loop Lane Keeping & Sign Handling', area: 'Computer vision',
    summary: 'A camera-only stack drives a simulated track: classical CV, an odometry-predicted lane tracker and PID control. It holds in stress conditions and breaks, measurably, at night in rain behind a car.',
    metric: { value: '0', label: 'lane departures in six stress-condition laps' },
    tech: ['OpenCV', 'Control systems', 'Simulation', 'Failure analysis'], icon: ScanLine },
]
