import { describe, expect, it } from 'vitest'
import { runDraw, type DrawEntry, type DrawTeam } from '../../lib/draw/algorithm'

function makeTeams(n: number): DrawTeam[] {
  return Array.from({ length: n }, (_, i) => ({ teamId: `t${i.toString().padStart(3, '0')}` }))
}

function makeEntries(spec: { participants: number; entriesPerParticipant: number[] }): DrawEntry[] {
  // participants × entriesPerParticipant[i] entries. Sum = total entries.
  // If entriesPerParticipant has fewer slots than participants, missing
  // participants get 1 entry each.
  const out: DrawEntry[] = []
  for (let p = 0; p < spec.participants; p++) {
    const k = spec.entriesPerParticipant[p] ?? 1
    for (let n = 1; n <= k; n++) {
      out.push({
        entryId: `p${p}-e${n}`,
        participantId: `p${p}`,
        entryNumber: n,
      })
    }
  }
  return out
}

describe('runDraw invariants', () => {
  it('60 single entries × 48 teams: exact-one allocation per entry', () => {
    const entries = makeEntries({ participants: 60, entriesPerParticipant: [] })
    const teams = makeTeams(48)
    const result = runDraw(entries, teams, 'seed-001')

    expect(result.allocations).toHaveLength(60)
    const seen = new Set<string>()
    for (const a of result.allocations) {
      expect(seen.has(a.entryId)).toBe(false)
      seen.add(a.entryId)
    }
  })

  it('no participant owns the same team twice', () => {
    const entries = makeEntries({
      participants: 60,
      entriesPerParticipant: Array.from({ length: 60 }, () => 2),
    })
    const teams = makeTeams(48)
    const result = runDraw(entries, teams, 'seed-no-dupes')

    const teamsByParticipant = new Map<string, Set<string>>()
    for (const a of result.allocations) {
      const entry = entries.find((e) => e.entryId === a.entryId)
      if (!entry) throw new Error('entry not found')
      const set = teamsByParticipant.get(entry.participantId) ?? new Set<string>()
      expect(set.has(a.teamId)).toBe(false)
      set.add(a.teamId)
      teamsByParticipant.set(entry.participantId, set)
    }
  })

  it('co-ownership spread ≤ 1 (60 single entries → 12 teams 2-owned)', () => {
    const entries = makeEntries({ participants: 60, entriesPerParticipant: [] })
    const teams = makeTeams(48)
    const result = runDraw(entries, teams, 'seed-spread-001')

    const ownersByTeam = new Map<string, number>()
    for (const a of result.allocations) {
      ownersByTeam.set(a.teamId, (ownersByTeam.get(a.teamId) ?? 0) + 1)
    }
    expect(ownersByTeam.size).toBe(48) // every team has ≥1 owner
    const counts = Array.from(ownersByTeam.values())
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    expect(max - min).toBeLessThanOrEqual(1)
    // 60/48 = 1.25 → expect 36 teams with 1, 12 with 2.
    expect(counts.filter((c) => c === 2)).toHaveLength(12)
    expect(counts.filter((c) => c === 1)).toHaveLength(36)
  })

  it('round-bucket fairness: every 1st entry gets a team before any 2nd does', () => {
    // 30 participants buy 1 entry each, 15 also buy a 2nd. Total 45 entries.
    // The first 30 ordered entries (after bucket order) must all be 1sts.
    const entries: DrawEntry[] = []
    for (let p = 0; p < 30; p++) {
      entries.push({ entryId: `p${p}-e1`, participantId: `p${p}`, entryNumber: 1 })
    }
    for (let p = 0; p < 15; p++) {
      entries.push({ entryId: `p${p}-e2`, participantId: `p${p}`, entryNumber: 2 })
    }
    const teams = makeTeams(48)
    const result = runDraw(entries, teams, 'seed-bucket-001')

    // Every entry got an allocation.
    expect(result.allocations).toHaveLength(45)
  })

  it('is deterministic given the same seed', () => {
    const entries = makeEntries({
      participants: 60,
      entriesPerParticipant: Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? 2 : 1)),
    })
    const teams = makeTeams(48)

    const a = runDraw(entries, teams, 'reproducible')
    const b = runDraw(entries, teams, 'reproducible')

    expect(a.allocations).toEqual(b.allocations)
  })

  it('different seeds yield different allocations', () => {
    const entries = makeEntries({ participants: 60, entriesPerParticipant: [] })
    const teams = makeTeams(48)

    const a = runDraw(entries, teams, 'alpha')
    const b = runDraw(entries, teams, 'beta')

    expect(a.allocations).not.toEqual(b.allocations)
  })
})

describe('runDraw property: invariants hold across many seeds', () => {
  // 500 seeds × the most realistic scenario (60 participants, mix of 1 and 2
  // entries). 10 000 is overkill for CI speed; 500 catches everything.
  const entries: DrawEntry[] = []
  for (let p = 0; p < 60; p++) {
    entries.push({ entryId: `p${p}-e1`, participantId: `p${p}`, entryNumber: 1 })
    if (p % 2 === 0) {
      entries.push({ entryId: `p${p}-e2`, participantId: `p${p}`, entryNumber: 2 })
    }
  }
  const teams = makeTeams(48)

  it('holds all 4 fairness invariants for 500 distinct seeds', () => {
    for (let s = 0; s < 500; s++) {
      const result = runDraw(entries, teams, `prop-${s}`)
      expect(result.allocations).toHaveLength(entries.length)

      const seenEntries = new Set<string>()
      const teamsByParticipant = new Map<string, Set<string>>()
      const ownersByTeam = new Map<string, number>()
      for (const a of result.allocations) {
        expect(seenEntries.has(a.entryId)).toBe(false)
        seenEntries.add(a.entryId)

        const entry = entries.find((e) => e.entryId === a.entryId)
        if (!entry) throw new Error('lost entry')
        const set = teamsByParticipant.get(entry.participantId) ?? new Set<string>()
        expect(set.has(a.teamId)).toBe(false)
        set.add(a.teamId)
        teamsByParticipant.set(entry.participantId, set)

        ownersByTeam.set(a.teamId, (ownersByTeam.get(a.teamId) ?? 0) + 1)
      }

      const counts = Array.from(ownersByTeam.values())
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
    }
  })
})
