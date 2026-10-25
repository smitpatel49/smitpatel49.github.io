import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

const TOAST_MS = 2500

/**
 * Copies the address and confirms with a toast. The toast lives in a polite live region that is
 * always mounted (an announcement only fires when text changes inside an existing region). If
 * the Clipboard API is missing or refused (insecure context, permissions), it opens the mail
 * client instead, so the button always does something useful.
 */
export default function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), TOAST_MS)
    } catch {
      window.location.href = 'mailto:' + email
    }
  }

  return (
    <>
      <button
        type='button'
        onClick={copy}
        className='inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'
      >
        {copied ? <Check className='w-3.5 h-3.5' aria-hidden='true'/> : <Copy className='w-3.5 h-3.5' aria-hidden='true'/>}
        {copied ? 'Copied' : 'Copy email'}
      </button>
      <div role='status' aria-live='polite' className='toast-region fixed inset-x-0 bottom-6 z-[150] flex justify-center px-4 pointer-events-none'>
        {copied && (
          <div className='toast inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-sm shadow-lg'>
            <Check className='w-4 h-4' aria-hidden='true'/> Email copied
          </div>
        )}
      </div>
    </>
  )
}
