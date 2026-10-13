import type { BureauData, Ghost, Place, Placement, Plan } from './types'

export interface ProblemCase {
  ghost: Ghost
  placement: Placement
  severity: number
  summary: string
}

export interface CrowdedPlace {
  place: Place
  occupants: Ghost[]
  reason: string
}

export interface Report {
  total: number
  placed: number
  unplaced: number
  manual: number
  manualWithViolations: number
  averageScore: number | null
  problems: ProblemCase[]
  crowded: CrowdedPlace[]
}

function severityOf(placement: Placement): { severity: number, summary: string } {
  if (placement.placeId === null) {
    return { severity: placement.mode === 'manual' ? 60 : 100, summary: placement.unplacedReasons[0] ?? 'Без места' }
  }
  if (placement.violations.length > 0) {
    return { severity: 80 + placement.violations.length, summary: placement.violations.map(v => v.message).join('; ') }
  }
  if (placement.fit === 'poor') {
    return { severity: 40, summary: `Слабое совпадение: ${placement.score} из 100` }
  }
  if (placement.warnings.length > 0) {
    return { severity: 20, summary: placement.warnings[0] ?? '' }
  }
  return { severity: 0, summary: '' }
}

export function buildReport(data: BureauData, plan: Plan, limit = 5): Report {
  const ghostsById = new Map(data.ghosts.map(ghost => [ghost.id, ghost]))
  const placesById = new Map(data.places.map(place => [place.id, place]))
  const placedOnes = plan.placements.filter(p => p.placeId !== null)
  const scores = placedOnes.map(p => p.score ?? 0)

  const problems = plan.placements
    .map((placement) => {
      const ghost = ghostsById.get(placement.ghostId)
      return ghost ? { ghost, placement, ...severityOf(placement) } : null
    })
    .filter((item): item is ProblemCase => item !== null && item.severity > 0)
    .sort((a, b) => b.severity - a.severity || a.ghost.deadline.localeCompare(b.ghost.deadline))
    .slice(0, limit)

  const crowded = plan.loads
    .filter(load => load.overloaded || load.exclusiveConflict || (load.capacity > 0 && load.occupants.length === load.capacity))
    .map((load) => {
      const place = placesById.get(load.placeId)
      if (!place) {
        return null
      }
      const occupants = load.occupants.map(id => ghostsById.get(id)).filter((g): g is Ghost => g !== undefined)
      const reason = load.overloaded
        ? `Перегружено: ${load.occupants.length} при вместимости ${load.capacity}`
        : load.exclusiveConflict
          ? 'Подселили к привидению, которому нужно одиночество'
          : `Заполнено полностью: ${load.occupants.length}/${load.capacity}`
      return { place, occupants, reason }
    })
    .filter((item): item is CrowdedPlace => item !== null)
    .sort((a, b) => Number(b.reason.startsWith('Перегружено')) - Number(a.reason.startsWith('Перегружено')))

  return {
    total: plan.placements.length,
    placed: placedOnes.length,
    unplaced: plan.placements.length - placedOnes.length,
    manual: plan.placements.filter(p => p.mode === 'manual').length,
    manualWithViolations: plan.placements.filter(p => p.mode === 'manual' && p.violations.length > 0).length,
    averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    problems,
    crowded,
  }
}
