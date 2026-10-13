<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="min-w-0 space-y-4">
      <section
        v-if="showHelp"
        class="relative rounded-card border border-spirit-100 bg-spirit-50 p-4 pr-11 text-sm"
      >
        <button
          type="button"
          class="absolute top-3 right-3 grid size-7 place-items-center rounded-lg text-spirit-700 hover:bg-spirit-100"
          aria-label="Скрыть подсказку"
          @click="showHelp = false"
        >
          <AppIcon
            name="x"
            class="size-4"
          />
        </button>
        <p class="mb-1 font-semibold text-spirit-700">
          Как это работает
        </p>
        <p class="text-ink/80">
          Система сама подбирает место каждому привидению: обязательные условия отсекают неподходящие места, пожелания дают баллы, а самых «трудных» расселяют первыми.
          Нажмите на заявку, чтобы увидеть расчёт, или выберите место вручную. Готовые ситуации для проверки — в меню «Сценарий» сверху.
        </p>
      </section>

      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-card border border-line bg-white p-3 shadow-card">
          <dt class="text-xs text-muted">
            Расселено
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ report.placed }}<span class="text-base text-muted">/{{ report.total }}</span>
          </dd>
        </div>
        <div class="rounded-card border border-line bg-white p-3 shadow-card">
          <dt class="text-xs text-muted">
            Без места
          </dt>
          <dd
            class="text-2xl font-semibold tabular-nums"
            :class="report.unplaced ? 'text-danger-600' : ''"
          >
            {{ report.unplaced }}
          </dd>
        </div>
        <div class="rounded-card border border-line bg-white p-3 shadow-card">
          <dt class="text-xs text-muted">
            Ручных решений
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ report.manual }}<span
              v-if="report.manualWithViolations"
              class="ml-1 text-sm font-medium text-danger-600"
            >· {{ report.manualWithViolations }} с нарушениями</span>
          </dd>
        </div>
        <div class="rounded-card border border-line bg-white p-3 shadow-card">
          <dt class="text-xs text-muted">
            Среднее совпадение
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ report.averageScore ?? '—' }}
          </dd>
        </div>
      </dl>

      <div class="flex flex-wrap items-center gap-2">
        <div
          class="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-card"
          role="group"
          aria-label="Фильтр заявок"
        >
          <button
            v-for="item in filters"
            :key="item.id"
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
            :class="filter === item.id ? 'bg-ink text-white' : 'text-muted hover:text-ink'"
            :aria-pressed="filter === item.id"
            @click="filter = item.id"
          >
            {{ item.label }} <span class="tabular-nums opacity-70">{{ item.count }}</span>
          </button>
        </div>
        <button
          v-if="report.manual"
          type="button"
          class="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-white hover:text-ink"
          @click="resetAllManual"
        >
          <AppIcon
            name="refresh"
            class="size-4"
          />
          Сбросить ручные решения
        </button>
      </div>

      <div
        v-if="!state.data.ghosts.length"
        class="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center"
      >
        <AppIcon
          name="ghost"
          class="mx-auto mb-3 size-10 text-spirit-500"
        />
        <p class="font-semibold">
          Заявок пока нет
        </p>
        <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
          Когда привидения подадут заявки, здесь появится подбор мест. Добавьте заявку или загрузите демо-день бюро.
        </p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-soft"
            @click="emit('goto', 'ghosts')"
          >
            <AppIcon
              name="plus"
              class="size-4"
            />
            Добавить заявку
          </button>
          <button
            type="button"
            class="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-mist"
            @click="loadScenario('demo')"
          >
            Загрузить демо
          </button>
        </div>
      </div>

      <p
        v-else-if="!visible.length"
        class="rounded-card bg-white p-6 text-center text-sm text-muted shadow-card"
      >
        В этом фильтре заявок нет.
      </p>

      <TransitionGroup
        tag="div"
        class="space-y-3"
        move-class="transition duration-300"
      >
        <GhostCard
          v-for="row in visible"
          :key="row.ghost.id"
          :ghost="row.ghost"
          :placement="row.placement"
          :place="row.place"
          :today="state.today"
          @change="choosingFor = row.ghost.id"
          @auto="returnToAuto(row.ghost.id)"
        />
      </TransitionGroup>
    </div>

    <aside class="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <PlaceLoads />
      <button
        v-if="!state.data.places.length"
        type="button"
        class="w-full rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-soft"
        @click="emit('goto', 'places')"
      >
        Добавить место
      </button>
    </aside>

    <ChoiceDialog
      :ghost-id="choosingFor"
      @close="choosingFor = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBureau } from '../../state/bureau'
import AppIcon from '../ui/AppIcon.vue'
import ChoiceDialog from './ChoiceDialog.vue'
import GhostCard from './GhostCard.vue'
import PlaceLoads from './PlaceLoads.vue'

type Filter = 'all' | 'unplaced' | 'issues' | 'manual'

const emit = defineEmits<{ goto: [tab: 'ghosts' | 'places' | 'checklist'] }>()
const { state, plan, report, returnToAuto, resetAllManual, loadScenario } = useBureau()
const filter = ref<Filter>('all')
const choosingFor = ref<string | null>(null)
const showHelp = ref(true)

const rows = computed(() => plan.value.placements.map(placement => ({
  placement,
  ghost: state.data.ghosts.find(g => g.id === placement.ghostId)!,
  place: placement.placeId ? state.data.places.find(p => p.id === placement.placeId) : undefined,
})))

const rank = (row: (typeof rows.value)[number]) =>
  row.placement.placeId === null ? 0 : row.placement.violations.length ? 1 : row.placement.warnings.length ? 2 : 3

const visible = computed(() => rows.value
  .filter(({ placement }) => {
    if (filter.value === 'unplaced') {
      return placement.placeId === null
    }
    if (filter.value === 'issues') {
      return placement.placeId === null || placement.violations.length > 0 || placement.warnings.length > 0
    }
    if (filter.value === 'manual') {
      return placement.mode === 'manual'
    }
    return true
  })
  .sort((a, b) => rank(a) - rank(b) || a.ghost.deadline.localeCompare(b.ghost.deadline)))

const filters = computed<Array<{ id: Filter, label: string, count: number }>>(() => [
  { id: 'all', label: 'Все', count: rows.value.length },
  { id: 'unplaced', label: 'Без места', count: report.value.unplaced },
  { id: 'issues', label: 'Требуют внимания', count: rows.value.filter(r => rank(r) < 3).length },
  { id: 'manual', label: 'Вручную', count: report.value.manual },
])
</script>
