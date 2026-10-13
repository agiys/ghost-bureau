import type { BureauData, Ghost, Place } from '../../src/domain'

export const TODAY = '2026-10-13'

export function ghost(overrides: Partial<Ghost> & { id: string }): Ghost {
  return { name: overrides.id, anxiety: 3, favoriteTemp: 12, deadline: '2026-10-20', conditions: [], ...overrides }
}

export function place(overrides: Partial<Place> & { id: string }): Place {
  return {
    name: overrides.id,
    capacity: 2,
    lighting: 2,
    noise: 2,
    humidity: 5,
    temperature: 12,
    humans: 'none',
    hasAttic: false,
    hasMirrors: false,
    maxAnxiety: null,
    ...overrides,
  }
}

export function data(ghosts: Ghost[], places: Place[], manual: BureauData['manual'] = {}): BureauData {
  return { ghosts, places, manual }
}
