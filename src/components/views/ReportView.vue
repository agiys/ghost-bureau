<template>
  <section class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Итоговый отчёт
      </h2>
      <p class="text-sm text-muted">
        Считается по текущему распределению, с учётом ручных решений.
      </p>
    </div>

    <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="rounded-card border border-line bg-white p-4 shadow-card">
        <dt class="text-sm text-muted">
          Расселено
        </dt>
        <dd class="mt-1 text-3xl font-semibold tabular-nums">
          {{ report.placed }}<span class="text-lg text-muted"> из {{ report.total }}</span>
        </dd>
        <dd class="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
          <div
            class="h-full rounded-full bg-glow-600"
            :style="{ width: `${share}%` }"
          />
        </dd>
      </div>
      <div class="rounded-card border border-line bg-white p-4 shadow-card">
        <dt class="text-sm text-muted">
          Осталось без места
        </dt>
        <dd
          class="mt-1 text-3xl font-semibold tabular-nums"
          :class="report.unplaced ? 'text-danger-600' : ''"
        >
          {{ report.unplaced }}
        </dd>
      </div>
      <div class="rounded-card border border-line bg-white p-4 shadow-card">
        <dt class="text-sm text-muted">
          Ручные решения с нарушениями
        </dt>
        <dd
          class="mt-1 text-3xl font-semibold tabular-nums"
          :class="report.manualWithViolations ? 'text-danger-600' : ''"
        >
          {{ report.manualWithViolations }}<span class="text-lg text-muted"> из {{ report.manual }}</span>
        </dd>
      </div>
      <div class="rounded-card border border-line bg-white p-4 shadow-card">
        <dt class="text-sm text-muted">
          Среднее совпадение
        </dt>
        <dd class="mt-1 text-3xl font-semibold tabular-nums">
          {{ report.averageScore ?? '—' }}<span
            v-if="report.averageScore !== null"
            class="text-lg text-muted"
          > / 100</span>
        </dd>
      </div>
    </dl>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="rounded-card border border-line bg-white p-4 shadow-card">
        <h3 class="mb-3 flex items-center gap-2 font-semibold">
          <AppIcon
            name="alert"
            class="size-5 text-danger-600"
          />
          Самые проблемные заявки
        </h3>
        <p
          v-if="!report.problems.length"
          class="text-sm text-muted"
        >
          {{ report.total ? 'Проблемных заявок нет — все расселены без нарушений.' : 'Заявок нет.' }}
        </p>
        <ol class="space-y-3">
          <li
            v-for="(problem, index) in report.problems"
            :key="problem.ghost.id"
            class="flex gap-3 text-sm"
          >
            <span class="grid size-6 shrink-0 place-items-center rounded-full bg-mist text-xs font-semibold">{{ index + 1 }}</span>
            <span class="min-w-0">
              <span class="font-medium">{{ problem.ghost.name }}</span>
              <span class="text-muted"> · {{ problem.placement.placeId ? placeName(problem.placement.placeId) : 'без места' }}</span>
              <span class="block text-muted">{{ problem.summary }}</span>
            </span>
          </li>
        </ol>
      </section>

      <section class="rounded-card border border-line bg-white p-4 shadow-card">
        <h3 class="mb-3 flex items-center gap-2 font-semibold">
          <AppIcon
            name="home"
            class="size-5 text-ember-600"
          />
          Перегруженные и заполненные места
        </h3>
        <p
          v-if="!report.crowded.length"
          class="text-sm text-muted"
        >
          Везде есть свободные места.
        </p>
        <ul class="space-y-3">
          <li
            v-for="item in report.crowded"
            :key="item.place.id"
            class="text-sm"
          >
            <span class="font-medium">{{ item.place.name }}</span>
            <span
              class="block"
              :class="item.reason.startsWith('Заполнено') ? 'text-muted' : 'font-medium text-danger-600'"
            >{{ item.reason }}</span>
            <span class="block text-muted">{{ item.occupants.map(g => g.name).join(', ') }}</span>
          </li>
        </ul>
      </section>
    </div>

    <section class="overflow-x-auto rounded-card border border-line bg-white shadow-card">
      <table class="w-full min-w-[32rem] text-sm">
        <caption class="px-4 pt-4 text-left font-semibold">
          Загрузка всех мест
        </caption>
        <thead class="text-left text-xs text-muted">
          <tr>
            <th class="px-4 py-2 font-medium">
              Место
            </th>
            <th class="px-4 py-2 font-medium">
              Занято
            </th>
            <th class="px-4 py-2 font-medium">
              Жильцы
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr
            v-for="row in occupancyRows"
            :key="row.place.id"
          >
            <td class="px-4 py-2 font-medium">
              {{ row.place.name }}
            </td>
            <td
              class="px-4 py-2 tabular-nums"
              :class="row.load.overloaded ? 'font-semibold text-danger-600' : ''"
            >
              {{ row.load.occupants.length }}/{{ row.load.capacity }}
            </td>
            <td class="px-4 py-2 text-muted">
              {{ row.load.occupants.map(id => state.data.ghosts.find(g => g.id === id)?.name).join(', ') || '—' }}
            </td>
          </tr>
          <tr v-if="!occupancyRows.length">
            <td
              colspan="3"
              class="px-4 py-3 text-muted"
            >
              Мест нет.
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBureau } from '../../state/bureau'
import AppIcon from '../ui/AppIcon.vue'

const { state, plan, report } = useBureau()

const share = computed(() => (report.value.total ? Math.round((report.value.placed / report.value.total) * 100) : 0))
const placeName = (id: string | null) => state.data.places.find(p => p.id === id)?.name
const occupancyRows = computed(() => plan.value.loads
  .map(load => ({ load, place: state.data.places.find(p => p.id === load.placeId)! }))
  .sort((a, b) => b.load.occupants.length / b.load.capacity - a.load.occupants.length / a.load.capacity))
</script>
