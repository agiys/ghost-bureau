import { describe, expect, it } from 'vitest'
import { buildPlan, previewChoice, scenarioData } from '../../src/domain'
import { data, ghost, place, TODAY } from './fixtures'

const placementOf = (plan: ReturnType<typeof buildPlan>, id: string) => plan.placements.find(p => p.ghostId === id)!

describe('automatic placement', () => {
  it('picks the best scoring place and explains the score', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'cold', favoriteTemp: 5 })],
      [place({ id: 'warm', temperature: 20 }), place({ id: 'chilly', temperature: 6 })],
    ), TODAY)

    const result = placementOf(plan, 'cold')
    expect(result.placeId).toBe('chilly')
    expect(result.mode).toBe('auto')
    expect(result.factors[0]).toEqual({ label: 'Температура 6° при любимой 5°', points: 22 })
  })

  it('never places a ghost where a hard condition is broken', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'shy', conditions: ['fears_mirrors', 'avoids_humans'] })],
      [place({ id: 'mirrors', hasMirrors: true, temperature: 12 }), place({ id: 'people', humans: 'occasional' }), place({ id: 'quiet', temperature: 30 })],
    ), TODAY)

    expect(placementOf(plan, 'shy').placeId).toBe('quiet')
  })

  it('leaves a ghost without a place when its deadline has passed', () => {
    const plan = buildPlan(data([ghost({ id: 'late', deadline: '2026-10-11' })], [place({ id: 'any' })]), TODAY)

    expect(placementOf(plan, 'late')).toMatchObject({ placeId: null, unplacedReasons: ['Дедлайн 11 окт. уже прошёл'] })
  })

  it('explains why no place fits, grouped by reason', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'picky', conditions: ['needs_attic', 'needs_darkness'] })],
      [place({ id: 'bright', name: 'Маяк', hasAttic: true, lighting: 8 }), place({ id: 'flat', name: 'Подвал' }), place({ id: 'hall', name: 'Зал', lighting: 6 })],
    ), TODAY)

    expect(placementOf(plan, 'picky').unplacedReasons).toEqual([
      'Слишком светло: Маяк (8/10), Зал (6/10)',
      'Нет чердака: Подвал, Зал',
    ])
  })

  it('reports full places when every fitting place is taken', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'first', deadline: '2026-10-14' }), ghost({ id: 'second', deadline: '2026-10-15' })],
      [place({ id: 'tiny', name: 'Чулан', capacity: 1 })],
    ), TODAY)

    expect(placementOf(plan, 'first').placeId).toBe('tiny')
    expect(placementOf(plan, 'second').unplacedReasons).toEqual(['Все подходящие места заняты: Чулан (1/1)'])
  })

  it('serves the most constrained ghost first so it is not crowded out', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'easy', deadline: '2026-10-14' }), ghost({ id: 'attic-only', deadline: '2026-10-30', conditions: ['needs_attic'] })],
      [place({ id: 'attic', capacity: 1, hasAttic: true }), place({ id: 'cellar', capacity: 1, temperature: 30 })],
    ), TODAY)

    expect(placementOf(plan, 'attic-only').placeId).toBe('attic')
    expect(placementOf(plan, 'easy').placeId).toBe('cellar')
  })

  it('gives a solitary ghost an empty place of its own and keeps others out', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'hermit', conditions: ['needs_solitude'] }), ghost({ id: 'guest' })],
      [place({ id: 'hall', capacity: 6 }), place({ id: 'cell', capacity: 1, temperature: 14 })],
    ), TODAY)

    expect(placementOf(plan, 'hermit').placeId).toBe('cell')
    expect(placementOf(plan, 'guest').placeId).toBe('hall')
  })

  it('handles an empty bureau', () => {
    expect(buildPlan(data([], [place({ id: 'a' })]), TODAY).placements).toEqual([])
    expect(placementOf(buildPlan(data([ghost({ id: 'lost' })], []), TODAY), 'lost').unplacedReasons).toEqual(['В бюро нет ни одного места'])
  })
})

describe('manual choice', () => {
  it('keeps the operator choice and lists every broken rule', () => {
    const plan = buildPlan(scenarioData('overflow', TODAY), TODAY)
    const baron = placementOf(plan, 'baron')

    expect(baron).toMatchObject({ placeId: 'chapel', mode: 'manual' })
    expect(baron.violations.map(v => v.message)).toEqual(['Нет чердака', 'Место переполнено: 3 при вместимости 1'])
    expect(plan.loads.find(l => l.placeId === 'chapel')).toMatchObject({ overloaded: true, occupants: ['baron', 'whisper', 'gosha'] })
  })

  it('suggests a clearly better place', () => {
    const conflict = placementOf(buildPlan(scenarioData('manual_conflict', TODAY), TODAY), 'agata')

    expect(conflict.violations.map(v => v.code)).toEqual(['humans', 'max_anxiety'])
    expect(conflict.warnings).toContain('Есть место лучше: Часовня на холме (82 из 100)')
  })

  it('places other ghosts around manual choices', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'pinned' }), ghost({ id: 'free' })],
      [place({ id: 'best', capacity: 1 }), place({ id: 'other', capacity: 1, temperature: 25 })],
      { pinned: 'best' },
    ), TODAY)

    expect(placementOf(plan, 'free').placeId).toBe('other')
  })

  it('warns when a ghost is moved in with a solitary one', () => {
    const preview = previewChoice(data(
      [ghost({ id: 'hermit', name: 'Евлампий', conditions: ['needs_solitude'] }), ghost({ id: 'guest' })],
      [place({ id: 'cell', capacity: 3 }), place({ id: 'hall', capacity: 3 })],
      { hermit: 'cell' },
    ), TODAY, 'guest', 'cell')

    expect(preview?.violations.map(v => v.message)).toEqual(['Здесь живёт Евлампий, которому нужно одиночество'])
  })

  it('can leave a ghost without a place on purpose and ignores choices of removed places', () => {
    const plan = buildPlan(data(
      [ghost({ id: 'skip' }), ghost({ id: 'orphan' })],
      [place({ id: 'home' })],
      { skip: null, orphan: 'demolished' },
    ), TODAY)

    expect(placementOf(plan, 'skip')).toMatchObject({ placeId: null, mode: 'manual', unplacedReasons: ['Оператор оставил без места'] })
    expect(placementOf(plan, 'orphan')).toMatchObject({ placeId: 'home', mode: 'auto' })
  })
})
