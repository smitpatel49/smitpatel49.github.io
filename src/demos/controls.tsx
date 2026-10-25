import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/** Solid focus outline shared by the demo controls (the translucent cards make soft rings hard to see). */
export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 dark:focus-visible:outline-accent-400'

export const MUTED = 'text-neutral-600 dark:text-neutral-400'

/** Lets a small data bar keep its fill when printed (browsers drop backgrounds by default). */
export const PRINT_FILL = '[print-color-adjust:exact]'

/** Small secondary button (presets, reset, table toggle). */
export const SMALL_BUTTON =
  'inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-xs ' +
  'hover:border-accent-500 aria-pressed:bg-accent-600 aria-pressed:border-accent-600 aria-pressed:text-white ' +
  // backgrounds don't print, so a pressed button prints as blue text in its blue outline
  'print:aria-pressed:!text-accent-700 print:aria-pressed:font-semibold ' +
  'dark:aria-pressed:bg-accent-600 ' + FOCUS

/**
 * Frame for one demo: heading, one-line intro, the demo, and a link to the case study it comes
 * from. Exported so every demo in "Try the models" looks the same.
 */
export function DemoFrame({ id, title, intro, caseStudy, children }: {
  id: string
  title: string
  intro: ReactNode
  caseStudy: { slug: string; title: string }
  children: ReactNode
}) {
  return (
    <article aria-labelledby={id + '-title'} className='glass p-4 sm:p-6 text-left'>
      <h3 id={id + '-title'} className='text-lg font-semibold'>{title}</h3>
      <p className={'mt-1 text-sm leading-relaxed ' + MUTED}>{intro}</p>
      <div className='mt-5'>{children}</div>
      <div className='mt-5 pt-4 border-t border-neutral-200/70 dark:border-neutral-800/70 text-sm'>
        <Link to={'/projects/' + caseStudy.slug} className={'inline-flex items-center gap-2 underline rounded ' + FOCUS}>
          Read the case study<span className='sr-only'>: {caseStudy.title}</span>
          <ArrowRight className='w-4 h-4' aria-hidden='true'/>
        </Link>
      </div>
    </article>
  )
}

/** Labelled range input with its current value shown (and announced) as formatted text. */
export function Slider({ id, label, value, min, max, step, valueText, onChange, hint }: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  valueText: string
  onChange: (v: number) => void
  hint?: ReactNode
}) {
  return (
    <div>
      <div className='flex items-baseline justify-between gap-3'>
        <label htmlFor={id} className='text-sm font-medium'>{label}</label>
        <output htmlFor={id} className='text-sm tabular-nums font-mono'>{valueText}</output>
      </div>
      <input
        id={id}
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        aria-describedby={hint ? id + '-hint' : undefined}
        onChange={e => onChange(Number(e.target.value))}
        className={'mt-1.5 w-full accent-accent-600 dark:accent-accent-400 cursor-pointer rounded ' + FOCUS}
      />
      {hint && <p id={id + '-hint'} className={'text-xs ' + MUTED}>{hint}</p>}
    </div>
  )
}

/** Radio group drawn as pills; native radios keep arrow-key navigation and screen-reader semantics. */
export function Segmented<T extends string>({ legend, name, options, value, onChange }: {
  legend: string
  name: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <fieldset className='min-w-0'>
      <legend className='text-sm font-medium mb-1.5'>{legend}</legend>
      <div className='flex flex-wrap gap-1.5'>
        {options.map(o => (
          <label key={o.value} className='cursor-pointer'>
            <input
              type='radio'
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className='peer sr-only'
            />
            <span className={
              'inline-block rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-xs ' +
              'hover:border-accent-500 ' +
              'peer-checked:bg-accent-600 peer-checked:border-accent-600 peer-checked:text-white dark:peer-checked:bg-accent-600 ' +
              'print:peer-checked:!text-accent-700 print:peer-checked:font-semibold ' +
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ' +
              'peer-focus-visible:outline-accent-600 dark:peer-focus-visible:outline-accent-400'
            }>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
