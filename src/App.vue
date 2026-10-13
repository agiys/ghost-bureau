<template>
  <div class="min-h-screen">
    <header class="bg-ink text-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-spirit-500/20 text-spirit-100">
            <AppIcon
              name="ghost"
              class="size-6"
            />
          </span>
          <div>
            <h1 class="text-lg leading-tight font-semibold">
              Бюро переселения привидений
            </h1>
            <p class="text-xs text-white/60">
              Рабочее место оператора · сегодня {{ formatDay(state.today) }}
            </p>
          </div>
        </div>

        <div class="ml-auto flex flex-wrap items-center gap-2">
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
              :aria-expanded="scenarioMenu"
              aria-haspopup="menu"
              @click="scenarioMenu = !scenarioMenu"
            >
              <AppIcon
                name="sparkles"
                class="size-4"
              />
              Сценарий
              <AppIcon
                name="chevron"
                class="size-4"
              />
            </button>
            <div
              v-if="scenarioMenu"
              class="fixed inset-0 z-30"
              @click="scenarioMenu = false"
            />
            <ul
              v-if="scenarioMenu"
              role="menu"
              class="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white py-1 text-ink shadow-2xl"
            >
              <li
                v-for="scenario in SCENARIOS"
                :key="scenario.id"
                role="none"
              >
                <button
                  type="button"
                  role="menuitem"
                  class="w-full px-4 py-2.5 text-left hover:bg-mist"
                  @click="pickScenario(scenario.id)"
                >
                  <span class="block text-sm font-medium">{{ scenario.title }}</span>
                  <span class="block text-xs text-muted">{{ scenario.description }}</span>
                </button>
              </li>
            </ul>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            title="Сохранить данные бюро в файл"
            @click="exportJson"
          >
            <AppIcon
              name="download"
              class="size-4"
            />
            Экспорт
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            title="Загрузить данные бюро из файла"
            @click="fileInput?.click()"
          >
            <AppIcon
              name="upload"
              class="size-4"
            />
            Импорт
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="onFile"
          >
        </div>
      </div>
      <nav
        class="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6"
        aria-label="Разделы"
      >
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2.5 text-sm font-medium transition"
          :class="tab === item.id ? 'bg-mist text-ink' : 'text-white/70 hover:text-white'"
          :aria-current="tab === item.id ? 'page' : undefined"
          @click="tab = item.id"
        >
          <AppIcon
            :name="item.icon"
            class="size-4"
          />
          {{ item.label }}
          <span
            v-if="item.count !== undefined"
            class="rounded-full px-1.5 text-xs tabular-nums"
            :class="tab === item.id ? 'bg-ink/10' : 'bg-white/10'"
          >{{ item.count }}</span>
          <span
            v-if="item.id === 'report' && report.unplaced"
            class="size-2 rounded-full bg-danger-600"
            :aria-label="`${report.unplaced} без места`"
          />
        </button>
      </nav>
    </header>

    <main class="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <NoticeBanner />
      <AssignmentBoard
        v-if="tab === 'board'"
        @goto="tab = $event"
      />
      <GhostsView v-else-if="tab === 'ghosts'" />
      <PlacesView v-else-if="tab === 'places'" />
      <ReportView v-else-if="tab === 'report'" />
      <WorklogView v-else-if="tab === 'worklog'" />
      <ChecklistView
        v-else
        @goto="tab = $event"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AssignmentBoard from './components/board/AssignmentBoard.vue'
import GhostsView from './components/manage/GhostsView.vue'
import PlacesView from './components/manage/PlacesView.vue'
import NoticeBanner from './components/NoticeBanner.vue'
import AppIcon from './components/ui/AppIcon.vue'
import type { IconName } from './components/ui/AppIcon.vue'
import ChecklistView from './components/views/ChecklistView.vue'
import ReportView from './components/views/ReportView.vue'
import WorklogView from './components/views/WorklogView.vue'
import { formatDay, SCENARIOS } from './domain'
import type { ScenarioId } from './domain'
import { useBureau } from './state/bureau'

type Tab = 'board' | 'ghosts' | 'places' | 'report' | 'worklog' | 'checklist'

const { state, report, loadScenario, exportJson, importJson } = useBureau()

const TABS: Tab[] = ['board', 'ghosts', 'places', 'report', 'worklog', 'checklist']

function tabFromHash(): Tab {
  const fromHash = window.location.hash.slice(1) as Tab
  return TABS.includes(fromHash) ? fromHash : 'board'
}

const tab = ref<Tab>(tabFromHash())
window.addEventListener('hashchange', () => {
  tab.value = tabFromHash()
})
watch(tab, (value) => {
  history.replaceState(null, '', `#${value}`)
  window.scrollTo({ top: 0 })
})

const tabs = computed<Array<{ id: Tab, label: string, icon: IconName, count?: number }>>(() => [
  { id: 'board', label: 'Распределение', icon: 'sparkles' },
  { id: 'ghosts', label: 'Заявки', icon: 'ghost', count: state.data.ghosts.length },
  { id: 'places', label: 'Места', icon: 'home', count: state.data.places.length },
  { id: 'report', label: 'Отчёт', icon: 'chart' },
  { id: 'worklog', label: 'AI Worklog', icon: 'list' },
  { id: 'checklist', label: 'Проверка', icon: 'clipboard' },
])

const scenarioMenu = ref(false)
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    scenarioMenu.value = false
  }
})
const fileInput = ref<HTMLInputElement | null>(null)

function pickScenario(id: ScenarioId) {
  loadScenario(id)
  scenarioMenu.value = false
  tab.value = 'board'
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await importJson(file)
  }
  input.value = ''
}
</script>
