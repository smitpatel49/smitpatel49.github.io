import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * The page component for each project slug in src/data/projects.ts, loaded on demand so
 * the home page doesn't ship every case study. App.tsx builds the routes from projects.ts
 * and looks the page up here; a slug without a page renders the NotFound page.
 */
export const caseStudyPages: Record<string, LazyExoticComponent<ComponentType>> = {
  analytics: lazy(() => import('./ProjectAnalytics')),
  mna: lazy(() => import('./ProjectMNA')),
  bank: lazy(() => import('./ProjectBank')),
  stock: lazy(() => import('./ProjectStock')),
  adas: lazy(() => import('./ProjectADAS')),
  forecast: lazy(() => import('./ProjectForecast')),
  nlp: lazy(() => import('./ProjectNLP')),
  'account-risk': lazy(() => import('./ProjectAccountRisk')),
}
