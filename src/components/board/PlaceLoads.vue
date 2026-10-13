<template>
  <section
    class="rounded-card border border-line bg-white p-4 shadow-card"
    aria-labelledby="places-load"
  >
    <h2
      id="places-load"
      class="mb-3 font-semibold"
    >
      Загрузка мест
    </h2>
    <p
      v-if="!rows.length"
      class="text-sm text-muted"
    >
      Мест пока нет.
    </p>
    <ul class="space-y-3">
      <li
        v-for="row in rows"
        :key="row.place.id"
        class="space-y-1.5"
        :data-load="row.place.id"
      >
        <div class="flex items-baseline justify-between gap-2 text-sm">
          <span class="truncate font-medium">{{ row.place.name }}</span>
          <span
            class="shrink-0 tabular-nums"
            :class="row.load.overloaded ? 'font-semibold text-danger-600' : 'text-muted'"
          >{{ row.load.occupants.length }}/{{ row.load.capacity }}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-mist">
          <div
            class="h-full rounded-full transition-all"
            :class="row.load.overloaded || row.load.exclusiveConflict ? 'bg-danger-600' : row.ratio >= 1 ? 'bg-ember-600' : 'bg-spirit-500'"
            :style="{ width: `${Math.max(row.ratio * 100, row.load.occupants.length ? 6 : 0)}%` }"
          />
        </div>
        <p class="text-xs text-muted">
          <span
            v-if="row.load.overloaded"
            class="font-semibold text-danger-600"
          >Перегружено · </span>
          <span
            v-else-if="row.load.exclusiveConflict"
            class="font-semibold text-danger-600"
          >Подселили к одиночке · </span>
          {{ row.names.length ? row.names.join(', ') : 'свободно' }}
        </p>
        <p class="text-[11px] text-muted/80">
          свет {{ row.place.lighting }} · шум {{ row.place.noise }} · влажность {{ row.place.humidity }} · {{ row.place.temperature }}° · люди: {{ HUMAN_LABELS[row.place.humans].toLowerCase() }}{{ row.place.hasAttic ? ' · чердак' : '' }}{{ row.place.hasMirrors ? ' · зеркала' : '' }}
        </p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HUMAN_LABELS } from '../../domain'
import { useBureau } from '../../state/bureau'

const { state, plan } = useBureau()

const rows = computed(() => plan.value.loads.map((load) => {
  const place = state.data.places.find(p => p.id === load.placeId)!
  const names = load.occupants.map(id => state.data.ghosts.find(g => g.id === id)?.name ?? '—')
  const ratio = Math.min(1, load.occupants.length / load.capacity)
  return { load, place, names, ratio }
}))
</script>
