import type { Condition, HardCondition, HumanPresence, SoftCondition } from './types'

export const HARD_CONDITIONS: HardCondition[] = ['needs_attic', 'fears_mirrors', 'avoids_humans', 'needs_darkness', 'needs_solitude']
export const SOFT_CONDITIONS: SoftCondition[] = ['loves_damp', 'prefers_quiet']
export const ALL_CONDITIONS: Condition[] = [...HARD_CONDITIONS, ...SOFT_CONDITIONS]

export const CONDITION_LABELS: Record<Condition, string> = {
  needs_attic: 'Нужен чердак',
  fears_mirrors: 'Боится зеркал',
  avoids_humans: 'Нельзя рядом с людьми',
  needs_darkness: 'Нужна темнота',
  needs_solitude: 'Только в одиночестве',
  loves_damp: 'Любит сырость',
  prefers_quiet: 'Любит тишину',
}

export const HUMAN_LABELS: Record<HumanPresence, string> = {
  none: 'Нет',
  occasional: 'Иногда',
  constant: 'Постоянно',
}

export const DARK_MAX_LIGHTING = 3
export const VERY_ANXIOUS = 8

export function isHard(condition: Condition): condition is HardCondition {
  return (HARD_CONDITIONS as Condition[]).includes(condition)
}
