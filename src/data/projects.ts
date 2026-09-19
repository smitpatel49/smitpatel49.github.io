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

export const projects: ProjectMeta[] = [
  { slug:'analytics', title: 'Customer Retention & Revenue Analytics', summary: 'SQL cohort retention & purchase-funnel analysis, presented as an interactive dashboard.', tech:['SQL','PostgreSQL','Cohort Analysis','Dashboarding'], icon: Database },
  { slug:'mna', title: 'Simulating Company Merger/Acquisition', summary: '20,000-trial Monte Carlo on deal accretion, with regression-based sensitivity analysis.', tech:['Python','NumPy','Monte Carlo','scikit-learn'], icon: GitMerge },
  { slug:'bank', title: 'Bank Marketing Classification', summary: 'Calibrated XGBoost scoring model vs. a Random Forest baseline, tuned to a call-center capacity constraint.', tech:['Python','XGBoost','scikit-learn','Calibration','FastAPI'], icon: PhoneCall },
  { slug:'stock', title: 'Simulating a Buy/Sell Call for a Stock', summary: 'Regime-aware block bootstrap over 3,000 paths; VaR/CVaR and a fan chart.', tech:['Python','NumPy','Bootstrap Simulation','Risk (VaR/CVaR)'], icon: TrendingUp },
  { slug:'adas', title: 'Lane & Road-Sign Detection for Self-Driving', summary: 'Perception → fusion → control architecture, validated with a real OpenCV pipeline on synthetic scenes.', tech:['Python','OpenCV','Segmentation','Object Detection','Control Systems'], icon: ScanLine },
  { slug:'forecast', title: 'Daily Demand Forecasting', summary: 'LightGBM forecasting with lag/rolling features, benchmarked honestly against a seasonal-naive baseline.', tech:['Python','Pandas','LightGBM','Time-Series'], icon: CalendarClock },
  { slug:'nlp', title: 'Support Ticket Routing (NLP)', summary: 'TF-IDF baseline vs. a small transformer trained from scratch, with an honest look at where each one wins.', tech:['Python','scikit-learn','PyTorch','NLP'], icon: MessageSquareText },
  { slug:'account-risk', title: 'Account Health & Renewal-Risk Reporting', summary: 'A stakeholder-governed at-risk definition turned into a KPI dashboard for CS, AM, and Renewals.', tech:['Business Analysis','Requirements Gathering','Data Modeling','KPI Design'], icon: ShieldCheck },
]
