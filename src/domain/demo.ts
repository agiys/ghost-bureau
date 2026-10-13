import { addDays } from './dates'
import type { BureauData, Ghost, Place } from './types'

export type ScenarioId = 'demo' | 'empty' | 'no_place' | 'overflow' | 'manual_conflict'

export interface Scenario {
  id: ScenarioId
  title: string
  description: string
}

export const SCENARIOS: Scenario[] = [
  { id: 'demo', title: 'Обычный день бюро', description: '11 заявок и 6 мест: часть расселяется легко, часть нет' },
  { id: 'empty', title: 'Пустой список заявок', description: 'Заявок нет — места есть' },
  { id: 'no_place', title: 'Заявка без подходящего места', description: 'Привидение, которому не подходит ни одно место' },
  { id: 'overflow', title: 'Место переполнено', description: 'Оператор вручную заселил в часовню троих при вместимости 1' },
  { id: 'manual_conflict', title: 'Ручной выбор с конфликтом', description: 'Тревожную Агату вручную отправили в библиотеку с людьми' },
]

export function demoPlaces(): Place[] {
  return [
    { id: 'castle', name: 'Замок Грейхолл', capacity: 4, lighting: 2, noise: 3, humidity: 6, temperature: 12, humans: 'occasional', hasAttic: true, hasMirrors: true, maxAnxiety: null },
    { id: 'lighthouse', name: 'Маяк на Тёмном мысе', capacity: 2, lighting: 8, noise: 6, humidity: 9, temperature: 8, humans: 'none', hasAttic: false, hasMirrors: false, maxAnxiety: null },
    { id: 'library', name: 'Городская библиотека', capacity: 3, lighting: 5, noise: 1, humidity: 3, temperature: 19, humans: 'constant', hasAttic: true, hasMirrors: false, maxAnxiety: 6 },
    { id: 'theatre', name: 'Заброшенный театр «Рампа»', capacity: 5, lighting: 1, noise: 2, humidity: 5, temperature: 14, humans: 'none', hasAttic: true, hasMirrors: true, maxAnxiety: null },
    { id: 'basement', name: 'Подвал старой типографии', capacity: 2, lighting: 0, noise: 4, humidity: 8, temperature: 10, humans: 'occasional', hasAttic: false, hasMirrors: false, maxAnxiety: null },
    { id: 'chapel', name: 'Часовня на холме', capacity: 1, lighting: 3, noise: 0, humidity: 4, temperature: 11, humans: 'none', hasAttic: false, hasMirrors: false, maxAnxiety: null },
  ]
}

export function demoGhosts(today: string): Ghost[] {
  const inDays = (days: number) => addDays(today, days)
  return [
    { id: 'draft', name: 'Леди Сквозняк', anxiety: 3, favoriteTemp: 10, deadline: inDays(5), conditions: ['loves_damp'] },
    { id: 'baron', name: 'Барон Скрипучий', anxiety: 4, favoriteTemp: 14, deadline: inDays(10), conditions: ['needs_attic'] },
    { id: 'agata', name: 'Тихоня Агата', anxiety: 9, favoriteTemp: 12, deadline: inDays(3), conditions: ['avoids_humans', 'prefers_quiet', 'fears_mirrors'] },
    { id: 'whisper', name: 'Шептун', anxiety: 2, favoriteTemp: 18, deadline: inDays(14), conditions: ['prefers_quiet'] },
    { id: 'fog', name: 'Мадам Туман', anxiety: 6, favoriteTemp: 9, deadline: inDays(7), conditions: ['loves_damp', 'needs_darkness'] },
    { id: 'gosha', name: 'Полтергейст Гоша', anxiety: 7, favoriteTemp: 16, deadline: inDays(2), conditions: [] },
    { id: 'hermit', name: 'Отшельник Евлампий', anxiety: 5, favoriteTemp: 11, deadline: inDays(6), conditions: ['needs_solitude', 'avoids_humans'] },
    { id: 'dust', name: 'Кот-призрак Пыль', anxiety: 1, favoriteTemp: 20, deadline: inDays(20), conditions: ['needs_attic', 'fears_mirrors'] },
    { id: 'captain', name: 'Капитан Солёный', anxiety: 4, favoriteTemp: 6, deadline: inDays(9), conditions: ['loves_damp', 'avoids_humans'] },
    { id: 'late', name: 'Призрак Опоздавший', anxiety: 5, favoriteTemp: 15, deadline: inDays(-2), conditions: [] },
    { id: 'countess', name: 'Графиня Без-Отражения', anxiety: 8, favoriteTemp: 13, deadline: inDays(4), conditions: ['fears_mirrors', 'needs_attic', 'needs_darkness'] },
  ]
}

export function scenarioData(id: ScenarioId, today: string): BureauData {
  const places = demoPlaces()
  const ghosts = demoGhosts(today)
  switch (id) {
    case 'empty':
      return { ghosts: [], places, manual: {} }
    case 'no_place':
      return { ghosts: ghosts.filter(g => ['countess', 'baron', 'draft'].includes(g.id)), places, manual: {} }
    case 'overflow':
      return { ghosts, places, manual: { gosha: 'chapel', whisper: 'chapel', baron: 'chapel' } }
    case 'manual_conflict':
      return { ghosts, places, manual: { agata: 'library' } }
    default:
      return { ghosts, places, manual: {} }
  }
}
