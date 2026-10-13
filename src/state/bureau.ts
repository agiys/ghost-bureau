import { computed, reactive, shallowReadonly, watch } from 'vue'
import { buildPlan, buildReport, parseBureau, scenarioData, toIsoDate } from '../domain'
import type { BureauData, Ghost, Place, ScenarioId } from '../domain'

export const STORAGE_KEY = 'ghost-bureau:v1'

export type Notice = { kind: 'error' | 'success', title: string, text?: string, actions?: Array<'reset' | 'download-raw' | 'reload'> }

interface State {
  data: BureauData
  today: string
  notice: Notice | null
  storageBlocked: boolean
}

const state = reactive<State>({
  data: { ghosts: [], places: [], manual: {} },
  today: toIsoDate(new Date()),
  notice: null,
  storageBlocked: false,
})

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  }
  catch {
    return null
  }
}

function writeStorage(): void {
  if (state.storageBlocked) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: state.data }))
  }
  catch (error) {
    state.notice = {
      kind: 'error',
      title: 'Не получилось сохранить изменения в браузере',
      text: `Они останутся до перезагрузки страницы. Причина: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export function loadFromStorage(): void {
  const raw = readStorage()
  if (raw === null) {
    state.data = scenarioData('demo', state.today)
    state.storageBlocked = false
    return
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  }
  catch {
    parsed = undefined
  }
  const payload = typeof parsed === 'object' && parsed !== null && 'data' in parsed ? (parsed as { data: unknown }).data : undefined
  const result = parseBureau(payload)
  if (result.ok) {
    state.data = result.data
    state.storageBlocked = false
    return
  }
  state.data = { ghosts: [], places: [], manual: {} }
  state.storageBlocked = true
  state.notice = {
    kind: 'error',
    title: 'Сохранённые данные не читаются',
    text: `${payload === undefined ? 'Файл сохранения повреждён' : result.error}. Мы ничего не перезаписали: можно скачать их как есть или начать заново с демо-данными.`,
    actions: ['download-raw', 'reset'],
  }
}

watch(() => state.data, writeStorage, { deep: true })

let noticeTimer: ReturnType<typeof setTimeout> | undefined
watch(() => state.notice, (notice) => {
  clearTimeout(noticeTimer)
  if (notice?.kind === 'success') {
    noticeTimer = setTimeout(() => {
      state.notice = null
    }, 4000)
  }
})

const plan = computed(() => buildPlan(state.data, state.today))
const report = computed(() => buildReport(state.data, plan.value))

function download(name: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function useBureau() {
  return {
    state: shallowReadonly(state),
    plan,
    report,

    loadScenario(id: ScenarioId) {
      state.storageBlocked = false
      state.notice = null
      state.data = scenarioData(id, state.today)
    },

    simulateCorruptedSave() {
      try {
        window.localStorage.setItem(STORAGE_KEY, '{"version":1,"data":{"ghosts":[{"id":"x","name":"Без даты","anxiety":42}]')
      }
      catch {
        return
      }
      loadFromStorage()
    },

    resetToDemo() {
      state.storageBlocked = false
      state.notice = { kind: 'success', title: 'Загружены демо-данные' }
      state.data = scenarioData('demo', state.today)
    },

    saveGhost(ghost: Omit<Ghost, 'id'> & { id?: string }) {
      const existing = ghost.id ? state.data.ghosts.findIndex(g => g.id === ghost.id) : -1
      const saved: Ghost = { ...ghost, id: ghost.id ?? uid('ghost') }
      if (existing >= 0) {
        state.data.ghosts.splice(existing, 1, saved)
      }
      else {
        state.data.ghosts.push(saved)
      }
    },

    removeGhost(id: string) {
      state.data.ghosts = state.data.ghosts.filter(g => g.id !== id)
      delete state.data.manual[id]
    },

    savePlace(place: Omit<Place, 'id'> & { id?: string }) {
      const existing = place.id ? state.data.places.findIndex(p => p.id === place.id) : -1
      const saved: Place = { ...place, id: place.id ?? uid('place') }
      if (existing >= 0) {
        state.data.places.splice(existing, 1, saved)
      }
      else {
        state.data.places.push(saved)
      }
    },

    removePlace(id: string) {
      state.data.places = state.data.places.filter(p => p.id !== id)
      for (const [ghostId, placeId] of Object.entries(state.data.manual)) {
        if (placeId === id) {
          delete state.data.manual[ghostId]
        }
      }
    },

    clearGhosts() {
      state.data.ghosts = []
      state.data.manual = {}
    },

    chooseManually(ghostId: string, placeId: string | null) {
      state.data.manual[ghostId] = placeId
    },

    returnToAuto(ghostId: string) {
      delete state.data.manual[ghostId]
    },

    resetAllManual() {
      state.data.manual = {}
    },

    exportJson() {
      download(`bureau-${state.today}.json`, JSON.stringify({ version: 1, data: state.data }, null, 2))
    },

    downloadRawSave() {
      download('bureau-damaged-save.json', readStorage() ?? '')
    },

    async importJson(file: File) {
      let parsed: unknown
      try {
        parsed = JSON.parse(await file.text())
      }
      catch {
        state.notice = { kind: 'error', title: 'Файл не загрузился', text: 'Это не JSON. Выберите файл, который выгружен из бюро.' }
        return
      }
      const payload = typeof parsed === 'object' && parsed !== null && 'data' in parsed ? (parsed as { data: unknown }).data : parsed
      const result = parseBureau(payload)
      if (!result.ok) {
        state.notice = { kind: 'error', title: 'Файл не загрузился', text: `${result.error}. Текущие данные не изменились.` }
        return
      }
      state.storageBlocked = false
      state.data = result.data
      state.notice = { kind: 'success', title: `Загружено: ${result.data.ghosts.length} заявок, ${result.data.places.length} мест` }
    },

    reportCrash(error: unknown) {
      state.notice = {
        kind: 'error',
        title: 'Что-то пошло не так',
        text: `${error instanceof Error ? error.message : String(error)}. Данные сохранены — можно продолжить или перезагрузить страницу.`,
        actions: ['reload'],
      }
    },

    dismissNotice() {
      state.notice = null
    },
  }
}
