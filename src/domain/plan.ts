import { BLOCKER_TITLES, deadlineBlocker, fitOf, isExpired, scoreFor, softWarnings, staticBlockers } from './scoring'
import type { Blocker, BureauData, Ghost, Place, PlaceLoad, Placement, Plan } from './types'

const BETTER_OPTION_GAP = 15
const SOLITUDE_WASTE_PENALTY = 3

interface Occupancy {
  occupants: Map<string, string[]>
  exclusive: Set<string>
}

function needsSolitude(ghost: Ghost): boolean {
  return ghost.conditions.includes('needs_solitude')
}

function settle(occupancy: Occupancy, ghost: Ghost, placeId: string): void {
  occupancy.occupants.get(placeId)?.push(ghost.id)
  if (needsSolitude(ghost)) {
    occupancy.exclusive.add(placeId)
  }
}

function hasRoom(occupancy: Occupancy, ghost: Ghost, place: Place): boolean {
  const taken = occupancy.occupants.get(place.id)?.length ?? 0
  if (occupancy.exclusive.has(place.id)) {
    return false
  }
  if (needsSolitude(ghost)) {
    return taken === 0
  }
  return taken < place.capacity
}

function byPriority(eligibleCount: Map<string, number>) {
  return (a: Ghost, b: Ghost) =>
    (eligibleCount.get(a.id) ?? 0) - (eligibleCount.get(b.id) ?? 0)
    || a.deadline.localeCompare(b.deadline)
    || b.anxiety - a.anxiety
    || a.name.localeCompare(b.name, 'ru')
}

function summarizeBlockers(ghost: Ghost, places: Place[]): string[] {
  const groups = new Map<Blocker['code'], string[]>()
  for (const place of places) {
    for (const blocker of staticBlockers(ghost, place)) {
      const entry = blocker.detail ? `${place.name} (${blocker.detail})` : place.name
      groups.set(blocker.code, [...(groups.get(blocker.code) ?? []), entry])
    }
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([code, entries]) => `${BLOCKER_TITLES[code]}: ${entries.join(', ')}`)
}

function choiceValue(ghost: Ghost, place: Place): number {
  const { score } = scoreFor(ghost, place)
  return needsSolitude(ghost) ? score - SOLITUDE_WASTE_PENALTY * (place.capacity - 1) : score
}

function emptyPlacement(ghost: Ghost, mode: Placement['mode'], unplacedReasons: string[]): Placement {
  return { ghostId: ghost.id, placeId: null, mode, score: null, fit: null, factors: [], violations: [], warnings: [], unplacedReasons }
}

function placed(ghost: Ghost, place: Place, mode: Placement['mode']): Placement {
  const { score, factors } = scoreFor(ghost, place)
  return {
    ghostId: ghost.id,
    placeId: place.id,
    mode,
    score,
    fit: fitOf(score),
    factors,
    violations: [],
    warnings: softWarnings(ghost, place, score),
    unplacedReasons: [],
  }
}

function manualViolations(ghost: Ghost, place: Place, load: PlaceLoad, ghostsById: Map<string, Ghost>, today: string): Blocker[] {
  const violations: Blocker[] = []
  if (isExpired(ghost, today)) {
    violations.push(deadlineBlocker(ghost))
  }
  violations.push(...staticBlockers(ghost, place))
  if (load.occupants.length > place.capacity) {
    violations.push({ code: 'capacity', message: `Место переполнено: ${load.occupants.length} при вместимости ${place.capacity}` })
  }
  const neighbours = load.occupants.filter(id => id !== ghost.id)
  if (needsSolitude(ghost) && neighbours.length > 0) {
    violations.push({ code: 'solitude_needs_empty', message: `Нужно одиночество, а здесь ещё ${neighbours.length}` })
  }
  const lonely = neighbours.map(id => ghostsById.get(id)).find(other => other && needsSolitude(other))
  if (lonely) {
    violations.push({ code: 'solitude_taken', message: `Здесь живёт ${lonely.name}, которому нужно одиночество` })
  }
  return violations
}

export function buildPlan(data: BureauData, today: string): Plan {
  const placesById = new Map(data.places.map(place => [place.id, place]))
  const ghostsById = new Map(data.ghosts.map(ghost => [ghost.id, ghost]))
  const occupancy: Occupancy = {
    occupants: new Map(data.places.map(place => [place.id, []])),
    exclusive: new Set(),
  }
  const result = new Map<string, Placement>()

  const pinned = data.ghosts.filter(ghost => {
    if (!(ghost.id in data.manual)) {
      return false
    }
    const placeId = data.manual[ghost.id]
    return placeId === null || placesById.has(placeId)
  })
  for (const ghost of pinned) {
    const placeId = data.manual[ghost.id]
    const place = placeId ? placesById.get(placeId) : undefined
    if (!place) {
      result.set(ghost.id, emptyPlacement(ghost, 'manual', ['Оператор оставил без места']))
      continue
    }
    settle(occupancy, ghost, place.id)
    result.set(ghost.id, placed(ghost, place, 'manual'))
  }

  const pinnedIds = new Set(pinned.map(ghost => ghost.id))
  const automatic = data.ghosts.filter(ghost => !pinnedIds.has(ghost.id))
  const eligible = new Map<string, Place[]>()
  for (const ghost of automatic) {
    if (isExpired(ghost, today)) {
      result.set(ghost.id, emptyPlacement(ghost, 'auto', [deadlineBlocker(ghost).message]))
      continue
    }
    eligible.set(ghost.id, data.places.filter(place => staticBlockers(ghost, place).length === 0))
  }

  const eligibleCount = new Map([...eligible].map(([id, places]) => [id, places.length]))
  const queue = automatic.filter(ghost => eligible.has(ghost.id)).sort(byPriority(eligibleCount))

  for (const ghost of queue) {
    const candidates = eligible.get(ghost.id) ?? []
    if (candidates.length === 0) {
      const reasons = data.places.length === 0 ? ['В бюро нет ни одного места'] : summarizeBlockers(ghost, data.places)
      result.set(ghost.id, emptyPlacement(ghost, 'auto', reasons))
      continue
    }
    const best = candidates
      .filter(place => hasRoom(occupancy, ghost, place))
      .map(place => ({ place, value: choiceValue(ghost, place) }))
      .sort((a, b) => b.value - a.value || a.place.name.localeCompare(b.place.name, 'ru'))[0]
    if (!best) {
      const busy = candidates.map(place => `${place.name} (${occupancy.occupants.get(place.id)?.length ?? 0}/${place.capacity})`).join(', ')
      const reasons = [`Все подходящие места заняты: ${busy}`]
      if (needsSolitude(ghost)) {
        reasons.push('Нужно одиночество, а пустых подходящих мест не осталось')
      }
      result.set(ghost.id, emptyPlacement(ghost, 'auto', reasons))
      continue
    }
    settle(occupancy, ghost, best.place.id)
    result.set(ghost.id, placed(ghost, best.place, 'auto'))
  }

  const loads: PlaceLoad[] = data.places.map((place) => {
    const occupants = occupancy.occupants.get(place.id) ?? []
    const lonely = occupants.some(id => {
      const ghost = ghostsById.get(id)
      return ghost !== undefined && needsSolitude(ghost)
    })
    return {
      placeId: place.id,
      occupants,
      capacity: place.capacity,
      overloaded: occupants.length > place.capacity,
      exclusiveConflict: lonely && occupants.length > 1,
    }
  })
  const loadsById = new Map(loads.map(load => [load.placeId, load]))

  for (const ghost of pinned) {
    const placement = result.get(ghost.id)
    const place = placement?.placeId ? placesById.get(placement.placeId) : undefined
    const load = place ? loadsById.get(place.id) : undefined
    if (!placement || !place || !load) {
      continue
    }
    placement.violations = manualViolations(ghost, place, load, ghostsById, today)
    const better = data.places
      .filter(other => other.id !== place.id && staticBlockers(ghost, other).length === 0)
      .map(other => ({ other, score: scoreFor(ghost, other).score }))
      .sort((a, b) => b.score - a.score)[0]
    if (better && placement.score !== null && better.score - placement.score >= BETTER_OPTION_GAP) {
      placement.warnings.push(`Есть место лучше: ${better.other.name} (${better.score} из 100)`)
    }
  }

  return {
    placements: data.ghosts.map(ghost => result.get(ghost.id) ?? emptyPlacement(ghost, 'auto', ['Не удалось рассчитать'])),
    loads,
  }
}

export function previewChoice(data: BureauData, today: string, ghostId: string, placeId: string | null): Placement | undefined {
  const plan = buildPlan({ ...data, manual: { ...data.manual, [ghostId]: placeId } }, today)
  return plan.placements.find(placement => placement.ghostId === ghostId)
}
