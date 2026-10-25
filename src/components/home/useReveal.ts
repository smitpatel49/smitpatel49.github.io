import { useReducedMotion } from 'framer-motion'

/**
 * Fade-and-rise as an element scrolls into view. With reduced motion it renders in its
 * final state (initial={false}), and print CSS forces `.reveal` visible, so content is
 * never left invisible if the in-view animation doesn't fire.
 */
export function useReveal(amount: number) {
  const reduce = useReducedMotion()
  return reduce
    ? { initial: false as const }
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount }, transition: { duration: 0.5 } }
}
