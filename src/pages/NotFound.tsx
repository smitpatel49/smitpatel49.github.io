import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import { PageHeader, SiteFooter, SkipLink, PAGE_SHELL } from '../components/SiteChrome'
import { useHeadMeta } from '../hooks/useHeadMeta'

/** Shown for any unknown route, including /projects/<unknown-slug>. Not indexed. */
export default function NotFound() {
  useHeadMeta({ title: 'Page not found', description: 'This page doesn’t exist.', noindex: true })
  return (
    <div className={PAGE_SHELL}>
      <SkipLink/>
      <AmbientBackground/>
      <PageHeader/>
      <main id='main-content' className='section text-center min-h-[60vh] flex flex-col items-center justify-center'>
        <p className='text-sm uppercase tracking-wide opacity-60 mb-2'>404</p>
        <h1 className='section-title'>Page not found</h1>
        <p className='opacity-80 max-w-md mx-auto'>There’s nothing at this address. It may have moved, or the link may have a typo.</p>
        <div className='mt-6 flex flex-wrap justify-center gap-3 text-sm'>
          <Link to='/' className='inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-accent-600 text-white hover:bg-accent-700 transition-colors'>
            <ArrowLeft className='w-4 h-4' aria-hidden='true'/> Back to the home page
          </Link>
          <Link to='/#projects' className='inline-flex items-center gap-2 rounded-2xl px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'>
            See the projects
          </Link>
        </div>
      </main>
      <SiteFooter/>
    </div>
  )
}
