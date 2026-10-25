import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const TITLE = 'Data Scientist & Analytics Professional'
const LOCATION = 'Chicago, IL'

/**
 * Proof points. Each is checked against the project READMEs: the test total is the sum of the
 * counts each README states (45 + 37 + 83 + 49 + 46 + 66 + 57 + 32), and the datasets are the
 * distinct public sources used (Online Retail II appears in two projects but counts once; the
 * ticket router's pretrained encoder is a model, not a dataset).
 */
const PROOF: { value: string; label: string }[] = [
  { value: '8', label: 'end-to-end projects' },
  { value: '415', label: 'automated tests' },
  { value: '4', label: 'public datasets' },
]

const CTA_BASE = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950'

export default function Hero() {
  return (
    <section id='home' aria-labelledby='hero-name' className='container-narrow pt-14 md:pt-24 pb-12 md:pb-16 relative text-center'>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className='reveal flex flex-col items-center'>
        <h1 id='hero-name' className='hero-name hero-display font-semibold bg-gradient-to-r from-accent-600 to-accent-500 bg-clip-text text-transparent'>Smit Patel</h1>
        {/* Title and location wrap as whole units: stacked on phones, one line with a separator from sm up. */}
        <p className='mt-3 text-[15px] md:text-[17px] font-medium text-neutral-700 dark:text-neutral-300'>
          <span className='block sm:inline'>{TITLE}</span><span className='sr-only'>, </span><span className='hidden sm:inline' aria-hidden='true'> · </span><span className='block sm:inline'>{LOCATION}</span>
        </p>
        <p className='hero-lede mt-8 max-w-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100'>
          I turn ambiguous business problems into decisions and systems, using data analysis, statistical modeling, and production ML.
        </p>
        <p className='mt-4 max-w-2xl text-[15px] md:text-base leading-relaxed text-neutral-700 dark:text-neutral-300'>
          I work the full arc: scoping the business question, exploring and analyzing the data, building the model or dashboard, and shipping it into something people actually use.
        </p>
        <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
          <Link to='/#projects' className={CTA_BASE + ' bg-accent-600 text-white hover:bg-accent-700'}>
            See the projects <ArrowRight className='w-4 h-4' aria-hidden='true'/>
          </Link>
          <Link to='/#contact' className={CTA_BASE + ' ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10'}>
            Get in touch
          </Link>
        </div>
        <dl className='mt-12 w-full max-w-xl grid grid-cols-3 border-y border-neutral-200/80 dark:border-neutral-800 divide-x divide-neutral-200/80 dark:divide-neutral-800'>
          {PROOF.map(p => (
            <div key={p.label} className='flex flex-col-reverse justify-end items-center px-2 py-4'>
              <dt className='mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400'>{p.label}</dt>
              <dd className='text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums'>{p.value}</dd>
            </div>
          ))}
        </dl>
        <p className='mt-3 max-w-2xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400'>
          Public data: UCI Bank Marketing, Online Retail II (in two projects), the S&amp;P 500 from FRED, and Bitext support tickets.
        </p>
      </motion.div>
    </section>
  )
}
