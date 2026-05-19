/**
 * Round-based balanced allocation for the sweepstake draw.
 *
 * INVARIANTS (validated by tests):
 *   1. Every input entry receives exactly one team in the output.
 *   2. No participant ends up with the same team twice across their entries.
 *   3. Round-bucket fairness: nobody receives their (N+1)th team before every
 *      participant who has an Nth entry has received an Nth team. Equivalent
 *      to "all first entries are processed before any second entry".
 *   4. Co-ownership spread ≤ 1: every team is owned by either
 *      ⌊E/T⌋ or ⌈E/T⌉ entries (E = total entries, T = total teams).
 *   5. Deterministic given a seed.
 *
 * The algorithm:
 *   • Bucket entries by entry_number, shuffle within each bucket.
 *   • Concatenate buckets in ascending bucket order.
 *   • Shuffle teams once.
 *   • Walk entries left-to-right, dealing teams[i % T]. If the candidate is
 *     already owned by this participant, swap it with a forward neighbour the
 *     participant doesn't own. This preserves per-team owner counts because
 *     we're swapping two slots both still in the pool.
 *   • If no forward neighbour can break the conflict (only possible in
 *     contrived participant/k combinations that don't occur with our caps),
 *     do a bounded backtracking swap with an earlier slot.
 */

export type DrawEntry = {
  entryId: string
  participantId: string
  entryNumber: number
}

export type DrawTeam = {
  teamId: string
}

export type Allocation = {
  entryId: string
  teamId: string
}

export type DrawResult = {
  seed: string
  allocations: Allocation[]
}

/** Mulberry32 PRNG — small, fast, well-distributed for our purposes. */
function makeRng(seed: string) {
  // Hash the string to a 32-bit integer (FNV-1a).
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  let state = h || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = out[i]
    const b = out[j]
    if (a !== undefined && b !== undefined) {
      out[i] = b
      out[j] = a
    }
  }
  return out
}

export function runDraw(
  entries: DrawEntry[],
  teams: DrawTeam[],
  seed: string,
): DrawResult {
  if (entries.length === 0) return { seed, allocations: [] }
  if (teams.length === 0) {
    throw new Error('draw_no_teams')
  }

  const rng = makeRng(seed)

  // 1. Bucket entries by entry_number, shuffle each bucket.
  const buckets = new Map<number, DrawEntry[]>()
  for (const e of entries) {
    const bucket = buckets.get(e.entryNumber) ?? []
    bucket.push(e)
    buckets.set(e.entryNumber, bucket)
  }
  const orderedBucketNumbers = Array.from(buckets.keys()).sort((a, b) => a - b)
  const ordered: DrawEntry[] = []
  for (const n of orderedBucketNumbers) {
    const bucket = buckets.get(n) ?? []
    ordered.push(...shuffle(bucket, rng))
  }

  // 2. Shuffle teams once.
  const shuffledTeams = shuffle(teams, rng)
  const T = shuffledTeams.length

  // 3. Round-robin deal with skip-owned-by-participant.
  //
  // We assign by mutating a slot array. Each slot starts as
  // shuffledTeams[i % T]. When a conflict is found at slot i, we look for the
  // nearest forward slot j > i whose team is acceptable to entries[i]'s
  // participant AND whose entry at j is happy to take entries[i]'s team
  // (i.e. that swap is conflict-free in both directions). Swap, advance.
  const slotTeams: string[] = ordered.map((_, i) => {
    const t = shuffledTeams[i % T]
    if (!t) throw new Error('draw_team_indexing_failed')
    return t.teamId
  })

  const owned = new Map<string, Set<string>>() // participant_id -> set<team_id>

  function ownerSet(pid: string): Set<string> {
    let s = owned.get(pid)
    if (!s) {
      s = new Set()
      owned.set(pid, s)
    }
    return s
  }

  for (let i = 0; i < ordered.length; i++) {
    const entry = ordered[i]
    const team = slotTeams[i]
    if (!entry || !team) throw new Error('draw_indexing_failed')
    const mine = ownerSet(entry.participantId)

    if (!mine.has(team)) {
      mine.add(team)
      continue
    }

    // Conflict — find a forward swap.
    let swapped = false
    for (let j = i + 1; j < ordered.length; j++) {
      const candidate = slotTeams[j]
      const otherEntry = ordered[j]
      if (!candidate || !otherEntry) continue
      if (candidate === team) continue
      if (mine.has(candidate)) continue
      const theirs = ownerSet(otherEntry.participantId)
      if (theirs.has(team)) continue
      // Safe swap.
      slotTeams[i] = candidate
      slotTeams[j] = team
      mine.add(candidate)
      swapped = true
      break
    }
    if (swapped) continue

    // Backward swap fallback. Look for a previously-assigned slot whose team
    // we could take, giving them ours. Both sides must still respect their
    // owned set.
    for (let j = i - 1; j >= 0; j--) {
      const candidate = slotTeams[j]
      const otherEntry = ordered[j]
      if (!candidate || !otherEntry) continue
      if (candidate === team) continue
      if (mine.has(candidate)) continue
      const theirs = ownerSet(otherEntry.participantId)
      if (theirs.has(team)) continue
      // Swap: i takes candidate, j takes team.
      slotTeams[i] = candidate
      slotTeams[j] = team
      mine.add(candidate)
      theirs.delete(candidate)
      theirs.add(team)
      swapped = true
      break
    }

    if (!swapped) {
      throw new Error(`draw_unresolvable_conflict_at_${i}`)
    }
  }

  const allocations: Allocation[] = ordered.map((e, i) => {
    const teamId = slotTeams[i]
    if (!teamId) throw new Error('draw_emit_failed')
    return { entryId: e.entryId, teamId }
  })

  return { seed, allocations }
}

/** Generate a reasonable random seed if the organiser doesn't supply one. */
export function generateSeed(): string {
  // 12 random base36 chars ≈ 62 bits of entropy. Plenty for an audit ID.
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
}
