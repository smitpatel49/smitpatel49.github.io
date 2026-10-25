// Number formatting for the demos: true minus sign, explicit plus where a sign carries meaning.

const MINUS = '−'

const signed = (text: string, x: number, plus: boolean) =>
  x < 0 ? MINUS + text : (plus && x > 0 ? '+' + text : text)

/** 0.0456 → "4.6%"; with `plus`, "+4.6%"; negatives always get "−". */
export function pct(x: number, digits = 1, plus = false): string {
  const r = Number((Math.abs(x) * 100).toFixed(digits))
  // a value that rounds to zero shouldn't show a sign
  return r === 0 ? (0).toFixed(digits) + '%' : signed(r.toFixed(digits) + '%', x, plus)
}

/** −86.5 → "−$87M" ($ millions in, whole millions out). */
export function money(x: number, plus = false): string {
  const r = Math.round(Math.abs(x))
  return r === 0 ? '$0M' : signed('$' + r.toLocaleString('en-US') + 'M', x, plus)
}

/** 2.2615 → "2.26×". */
export const times = (x: number, digits = 2) => x.toFixed(digits) + '×'

/** Percentage points: 0.177 → "17.7 points". */
export const points = (x: number) => (Math.abs(x) * 100).toFixed(1) + ' points'
