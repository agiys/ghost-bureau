import { describe, expect, it } from 'vitest'
import { buildPlan, buildReport, scenarioData } from '../../src/domain'
import { TODAY } from './fixtures'

describe('report', () => {
  it('counts the demo day and ranks the hardest cases first', () => {
    const demo = scenarioData('demo', TODAY)
    const report = buildReport(demo, buildPlan(demo, TODAY))

    expect(report).toMatchObject({ total: 11, placed: 9, unplaced: 2, manual: 0 })
    expect(report.problems.slice(0, 2).map(p => p.ghost.id)).toEqual(['late', 'countess'])
  })

  it('puts overloaded places on top', () => {
    const overflow = scenarioData('overflow', TODAY)
    const report = buildReport(overflow, buildPlan(overflow, TODAY))

    expect(report.crowded[0]).toMatchObject({ place: { id: 'chapel' }, reason: 'Перегружено: 3 при вместимости 1' })
    expect(report.manualWithViolations).toBe(3)
  })

  it('is empty but valid without applications', () => {
    const empty = scenarioData('empty', TODAY)

    expect(buildReport(empty, buildPlan(empty, TODAY))).toMatchObject({ total: 0, placed: 0, averageScore: null, problems: [], crowded: [] })
  })
})
