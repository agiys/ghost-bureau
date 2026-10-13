import { ALL_CONDITIONS } from './conditions'
import { isIsoDate } from './dates'
import type { BureauData, Condition, Ghost, HumanPresence, ManualChoices, Place } from './types'

export type ParseResult = { ok: true, data: BureauData } | { ok: false, error: string }

const HUMANS: HumanPresence[] = ['none', 'occasional', 'constant']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isInt = (value: unknown, min: number, max: number): value is number => Number.isInteger(value) && (value as number) >= min && (value as number) <= max
const isName = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 60
const labelOf = (item: Record<string, unknown>, index: number) => isName(item.name) ? `«${item.name}»` : `№${index + 1}`

export function ghostErrors(ghost: Partial<Ghost>): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!isName(ghost.name)) {
    errors.name = 'Имя от 1 до 60 символов'
  }
  if (!isInt(ghost.anxiety, 1, 10)) {
    errors.anxiety = 'Тревожность — целое от 1 до 10'
  }
  if (!isInt(ghost.favoriteTemp, -30, 40)) {
    errors.favoriteTemp = 'Температура — целое от −30 до 40'
  }
  if (!isIsoDate(ghost.deadline)) {
    errors.deadline = 'Укажите дату дедлайна'
  }
  if (!Array.isArray(ghost.conditions) || ghost.conditions.some(c => !ALL_CONDITIONS.includes(c as Condition))) {
    errors.conditions = 'Неизвестное особое условие'
  }
  return errors
}

export function placeErrors(place: Partial<Place>): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!isName(place.name)) {
    errors.name = 'Название от 1 до 60 символов'
  }
  if (!isInt(place.capacity, 1, 50)) {
    errors.capacity = 'Вместимость — целое от 1 до 50'
  }
  for (const key of ['lighting', 'noise', 'humidity'] as const) {
    if (!isInt(place[key], 0, 10)) {
      errors[key] = 'Значение от 0 до 10'
    }
  }
  if (!isInt(place.temperature, -30, 40)) {
    errors.temperature = 'Температура — целое от −30 до 40'
  }
  if (!HUMANS.includes(place.humans as HumanPresence)) {
    errors.humans = 'Выберите, бывают ли там люди'
  }
  if (typeof place.hasAttic !== 'boolean' || typeof place.hasMirrors !== 'boolean') {
    errors.features = 'Отметьте чердак и зеркала'
  }
  if (place.maxAnxiety !== null && !isInt(place.maxAnxiety, 1, 10)) {
    errors.maxAnxiety = 'Предел тревожности — от 1 до 10 или пусто'
  }
  return errors
}

export function parseBureau(input: unknown): ParseResult {
  if (!isRecord(input) || !Array.isArray(input.ghosts) || !Array.isArray(input.places)) {
    return { ok: false, error: 'Нет списков заявок и мест' }
  }
  const ids = new Set<string>()
  for (const [index, ghost] of input.ghosts.entries()) {
    if (!isRecord(ghost) || typeof ghost.id !== 'string' || ids.has(ghost.id)) {
      return { ok: false, error: `Заявка №${index + 1}: нет id или он повторяется` }
    }
    ids.add(ghost.id)
    const errors = Object.values(ghostErrors(ghost as Partial<Ghost>))
    if (errors.length) {
      return { ok: false, error: `Заявка ${labelOf(ghost, index)}: ${errors[0]}` }
    }
  }
  for (const [index, place] of input.places.entries()) {
    if (!isRecord(place) || typeof place.id !== 'string' || ids.has(place.id)) {
      return { ok: false, error: `Место №${index + 1}: нет id или он повторяется` }
    }
    ids.add(place.id)
    const errors = Object.values(placeErrors(place as Partial<Place>))
    if (errors.length) {
      return { ok: false, error: `Место ${labelOf(place, index)}: ${errors[0]}` }
    }
  }
  const manual: ManualChoices = {}
  if (input.manual !== undefined) {
    if (!isRecord(input.manual)) {
      return { ok: false, error: 'Ручные решения в неверном формате' }
    }
    for (const [ghostId, placeId] of Object.entries(input.manual)) {
      if (placeId !== null && typeof placeId !== 'string') {
        return { ok: false, error: 'Ручные решения в неверном формате' }
      }
      manual[ghostId] = placeId
    }
  }
  return { ok: true, data: { ghosts: input.ghosts as Ghost[], places: input.places as Place[], manual } }
}
