import { CONDITION_LABELS, DARK_MAX_LIGHTING, VERY_ANXIOUS } from './conditions'
import { formatDay } from './dates'
import type { Blocker, Factor, Fit, Ghost, Place } from './types'

export const GREAT_FIT = 70
export const GOOD_FIT = 45
const BASE_SCORE = 50

export function isExpired(ghost: Ghost, today: string): boolean {
  return ghost.deadline < today
}

export function deadlineBlocker(ghost: Ghost): Blocker {
  return { code: 'deadline', message: `Дедлайн ${formatDay(ghost.deadline)} уже прошёл` }
}

export function staticBlockers(ghost: Ghost, place: Place): Blocker[] {
  const blockers: Blocker[] = []
  const has = (condition: Ghost['conditions'][number]) => ghost.conditions.includes(condition)

  if (has('needs_attic') && !place.hasAttic) {
    blockers.push({ code: 'attic', message: 'Нет чердака' })
  }
  if (has('fears_mirrors') && place.hasMirrors) {
    blockers.push({ code: 'mirrors', message: 'Есть зеркала' })
  }
  if (has('avoids_humans') && place.humans !== 'none') {
    blockers.push({ code: 'humans', message: place.humans === 'constant' ? 'Там постоянно бывают люди' : 'Там иногда бывают люди' })
  }
  if (ghost.anxiety >= VERY_ANXIOUS && place.humans === 'constant' && !has('avoids_humans')) {
    blockers.push({ code: 'anxious_humans', message: `Слишком тревожное (${ghost.anxiety}/10) для места, где постоянно люди` })
  }
  if (has('needs_darkness') && place.lighting > DARK_MAX_LIGHTING) {
    blockers.push({ code: 'light', message: `Слишком светло (${place.lighting}/10)`, detail: `${place.lighting}/10` })
  }
  if (place.maxAnxiety !== null && ghost.anxiety > place.maxAnxiety) {
    blockers.push({ code: 'max_anxiety', message: `Место принимает тревожность до ${place.maxAnxiety}, а у привидения ${ghost.anxiety}`, detail: `до ${place.maxAnxiety}` })
  }
  return blockers
}

export const BLOCKER_TITLES: Record<Blocker['code'], string> = {
  deadline: 'Дедлайн прошёл',
  attic: 'Нет чердака',
  mirrors: 'Есть зеркала',
  humans: 'Бывают люди',
  anxious_humans: 'Постоянно люди — слишком тревожно',
  light: 'Слишком светло',
  max_anxiety: 'Ограничение по тревожности',
  capacity: 'Нет свободных мест',
  solitude_needs_empty: 'Нужно одиночество',
  solitude_taken: 'Занято одиночкой',
}

export function scoreFor(ghost: Ghost, place: Place): { score: number, factors: Factor[] } {
  const factors: Factor[] = []
  const tempGap = Math.abs(place.temperature - ghost.favoriteTemp)
  const tempPoints = Math.max(-25, 25 - tempGap * 3)
  factors.push({
    label: tempGap === 0 ? `Температура ровно любимая (${place.temperature}°)` : `Температура ${place.temperature}° при любимой ${ghost.favoriteTemp}°`,
    points: tempPoints,
  })

  const noisePoints = -Math.round((ghost.anxiety * place.noise) / 4)
  if (noisePoints !== 0) {
    factors.push({ label: `Шум ${place.noise}/10 при тревожности ${ghost.anxiety}/10`, points: noisePoints })
  }

  if (place.humans !== 'none') {
    const humanPoints = -Math.round(ghost.anxiety * (place.humans === 'constant' ? 2.5 : 1.5))
    factors.push({ label: place.humans === 'constant' ? 'Рядом постоянно люди' : 'Иногда заходят люди', points: humanPoints })
  }

  if (ghost.conditions.includes('loves_damp')) {
    const dampPoints = place.humidity >= 7 ? 15 : place.humidity >= 4 ? 5 : -10
    factors.push({ label: `${CONDITION_LABELS.loves_damp}: влажность ${place.humidity}/10`, points: dampPoints })
  }

  if (ghost.conditions.includes('prefers_quiet')) {
    const quietPoints = place.noise <= 2 ? 10 : place.noise >= 6 ? -10 : 0
    if (quietPoints !== 0) {
      factors.push({ label: `${CONDITION_LABELS.prefers_quiet}: шум ${place.noise}/10`, points: quietPoints })
    }
  }

  const raw = BASE_SCORE + factors.reduce((sum, factor) => sum + factor.points, 0)
  const score = Math.max(0, Math.min(100, raw))
  return { score, factors: factors.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)) }
}

export function fitOf(score: number): Fit {
  return score >= GREAT_FIT ? 'great' : score >= GOOD_FIT ? 'good' : 'poor'
}

export function softWarnings(ghost: Ghost, place: Place, score: number): string[] {
  const warnings: string[] = []
  const tempGap = Math.abs(place.temperature - ghost.favoriteTemp)
  if (tempGap >= 8) {
    warnings.push(`Температура далека от любимой: ${place.temperature}° вместо ${ghost.favoriteTemp}°`)
  }
  if (ghost.conditions.includes('loves_damp') && place.humidity <= 3) {
    warnings.push(`Сухо (${place.humidity}/10), а привидение любит сырость`)
  }
  if (ghost.conditions.includes('prefers_quiet') && place.noise >= 6) {
    warnings.push(`Шумно (${place.noise}/10), а привидение любит тишину`)
  }
  if (score < GOOD_FIT) {
    warnings.push(`Слабое совпадение: ${score} из 100`)
  }
  return warnings
}
