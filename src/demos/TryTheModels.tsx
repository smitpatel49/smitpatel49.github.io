import { Component, lazy, Suspense, type ReactNode } from 'react'
import DealSandbox from './DealSandbox'
import ForecastExplorer from './ForecastExplorer'
import { DemoFrame, MUTED } from './controls'

// The router ships its own model JSON and UI; keep both out of this chunk until it renders.
const TicketRouter = lazy(() => import('./TicketRouter'))

/** If the router's chunk fails to load (offline, stale deploy), say so instead of blanking the section. */
class LoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <p role='alert' className={'text-sm ' + MUTED}>This demo didn’t load. Reloading the page usually fixes it.</p>
      : this.props.children
  }
}

/**
 * Body of the home page's "Try the models" section: three demos that run the projects' own
 * models or committed results in the browser. The caller supplies the <section> and its title.
 */
export default function TryTheModels() {
  return (
    <div className='max-w-5xl mx-auto sm:px-6 space-y-6'>
      <p className={'text-sm text-center max-w-2xl mx-auto ' + MUTED}>
        Three of the projects, running in your browser on each project’s own model or committed results, not a mock-up.
      </p>
      <DealSandbox />
      <ForecastExplorer />
      <DemoFrame
        id='ticket-router'
        title='Support ticket router'
        intro={<>The ticket-routing project’s words-only classifier and routing policy, running in your browser: type a support ticket to see which queue it goes to, how sure the model is, and whether the policy routes it automatically or hands it to a person.</>}
        caseStudy={{ slug: 'nlp', title: 'Support Ticket Routing' }}
      >
        <LoadBoundary>
          <Suspense fallback={<p role='status' className={'text-sm ' + MUTED}>Loading the ticket router…</p>}>
            <TicketRouter />
          </Suspense>
        </LoadBoundary>
      </DemoFrame>
    </div>
  )
}
