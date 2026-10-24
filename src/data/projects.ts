import type { ComponentType } from 'react'
import {
  Database, GitMerge, PhoneCall, TrendingUp, ScanLine, CalendarClock, MessageSquareText, ShieldCheck,
} from 'lucide-react'

export type ProjectMeta = {
  slug: string
  title: string
  summary: string
  tech: string[]
  icon: ComponentType<{ className?: string }>
}

// Slugs are part of the public URLs (/projects/<slug>), so they stay fixed.
export const projects: ProjectMeta[] = [
  { slug: 'analytics', title: 'Customer Retention & Funnel Analytics',
    summary: 'SQL cohorts and ordered funnels checked against pandas and PostgreSQL, a +20-point checkout fix measured with difference-in-differences, and a real UK retailer’s two years of invoices.',
    tech: ['SQL', 'PostgreSQL', 'Difference-in-differences', 'Wilson intervals', 'Dashboards'], icon: Database },
  { slug: 'mna', title: 'Acquisition Screen: Accretion, Financing & Value',
    summary: 'Monte Carlo EPS accretion across 66 financing mixes, then a DCF: accretive by year 3 in 93% of scenarios, value-creating in 5%. Walk-away premium 20% against an expected 38%.',
    tech: ['Python', 'Monte Carlo', 'DCF', 'Corporate finance'], icon: GitMerge },
  { slug: 'bank', title: 'Call-Center Targeting Model',
    summary: 'A ranking model chosen on precision at the call center’s 15% capacity: 3.0× lift on synthetic data, 3.2× on the real UCI calls, served by a CLI and a FastAPI service.',
    tech: ['scikit-learn', 'XGBoost', 'Bootstrap CIs', 'FastAPI', 'Docker'], icon: PhoneCall },
  { slug: 'stock', title: 'Regime-Aware Tail Risk',
    summary: 'A hand-written Student-t HMM drives a hold-or-reduce call, checked against the true process on 40 synthetic histories; 1-day VaR backtests on ten years of the S&P 500 flip the model ranking.',
    tech: ['HMM', 'GARCH', 'VaR backtests', 'Monte Carlo', 'S&P 500'], icon: TrendingUp },
  { slug: 'adas', title: 'Closed-Loop Lane Keeping & Sign Handling',
    summary: 'A camera-only stack drives a simulated track: classical CV, an odometry-predicted lane tracker and PID control. It holds in stress conditions and breaks, measurably, at night in rain behind a car.',
    tech: ['OpenCV', 'Control systems', 'Simulation', 'Failure analysis'], icon: ScanLine },
  { slug: 'forecast', title: 'Week-Ahead Demand Forecasting',
    summary: 'Global LightGBM over seven horizons with leakage tests and conformal stock levels: 27.5% WAPE against a 25.9% noise floor, and level with Holt-Winters on a real retailer.',
    tech: ['LightGBM', 'Holt-Winters', 'Conformal prediction', 'Time series'], icon: CalendarClock },
  { slug: 'nlp', title: 'Support Ticket Routing',
    summary: 'Calibrated classifiers and a cost-based policy auto-route 80% of tickets at 94.6% accuracy. On unseen intents in public data, keyword models fall to 59% while a pretrained encoder holds 85%.',
    tech: ['scikit-learn', 'PyTorch', 'Sentence embeddings', 'Calibration'], icon: MessageSquareText },
  { slug: 'account-risk', title: 'Account Health & Renewal Risk',
    summary: 'Requirements traced to tests, data checks, a worklist and dashboard, and a backtest showing the agreed at-risk rule caught 14% of churned ARR; one threshold change catches 48%.',
    tech: ['Business analysis', 'Requirements', 'Backtesting', 'Dashboards'], icon: ShieldCheck },
]
