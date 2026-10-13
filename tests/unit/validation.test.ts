import { describe, expect, it } from 'vitest'
import { parseBureau, scenarioData } from '../../src/domain'
import { TODAY } from './fixtures'

describe('saved data check', () => {
  it('accepts the demo data as is', () => {
    const demo = scenarioData('overflow', TODAY)

    expect(parseBureau(JSON.parse(JSON.stringify(demo)))).toEqual({ ok: true, data: demo })
  })

  it.each([
    [null, 'Нет списков заявок и мест'],
    [{ ghosts: [{ id: 'a', name: 'A', anxiety: 11, favoriteTemp: 0, deadline: '2026-01-01', conditions: [] }], places: [] }, 'Заявка «A»: Тревожность — целое от 1 до 10'],
    [{ ghosts: [], places: [{ id: 'p' }, { id: 'p' }] }, 'Место №1: Название от 1 до 60 символов'],
    [{ ghosts: [{ id: 'x', name: 'X', anxiety: 1, favoriteTemp: 0, deadline: 'вчера', conditions: [] }], places: [] }, 'Заявка «X»: Укажите дату дедлайна'],
    [{ ghosts: [], places: [], manual: { a: 5 } }, 'Ручные решения в неверном формате'],
  ])('rejects broken data with a clear reason', (input, error) => {
    expect(parseBureau(input)).toEqual({ ok: false, error })
  })
})
