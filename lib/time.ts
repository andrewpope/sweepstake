/**
 * Project-wide timezone convention: Europe/Amsterdam.
 *
 * All user-facing times are entered in Amsterdam local time and rendered in
 * Amsterdam local time. The DB stores UTC `timestamptz` regardless.
 */
export const PROJECT_TIMEZONE = 'Europe/Amsterdam'

/**
 * Compute the offset (in minutes) between UTC and the given timezone at a
 * specific instant. Positive when the zone is ahead of UTC (e.g. CEST = +120).
 */
function offsetMinutes(timeZone: string, instant: Date): number {
  // `en-US` short format reliably emits a GMT±H[:MM] suffix on the time-zone part.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: 'numeric',
  })
  const part = fmt.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value
  if (!part) return 0
  // Possible values: "GMT", "GMT+1", "GMT+1:30", "GMT-5".
  const match = part.match(/GMT(?:([+-])(\d+)(?::(\d+))?)?$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] ?? 0)
  const mins = Number(match[3] ?? 0)
  return sign * (hours * 60 + mins)
}

/**
 * Parses a wall-clock string from a <input type="datetime-local"> (e.g.
 * "2026-06-11T18:00") as Europe/Amsterdam local time and returns a Date.
 *
 * Handles DST automatically by computing the offset at the parsed instant.
 */
export function amsterdamWallClockToDate(localValue: string): Date {
  // Build a date as if the wall-clock were UTC. The result is wrong by exactly
  // the Amsterdam offset at that instant; subtract it to land at the real UTC.
  const naive = new Date(`${localValue}:00Z`)
  const offset = offsetMinutes(PROJECT_TIMEZONE, naive)
  return new Date(naive.getTime() - offset * 60 * 1000)
}

const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PROJECT_TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Format an ISO date as a long Amsterdam-localised string. */
export function formatInAmsterdam(iso: string): string {
  return longDateFormatter.format(new Date(iso))
}
