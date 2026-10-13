<template>
  <article
    class="rounded-card border bg-white shadow-card transition"
    :class="{
      'border-danger-600/30': status === 'unplaced' || status === 'violations',
      'border-line': status === 'ok' || status === 'warnings',
    }"
    :data-ghost="ghost.id"
  >
    <button
      type="button"
      class="flex w-full flex-wrap items-start gap-3 p-4 text-left sm:flex-nowrap"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span
        class="grid size-10 shrink-0 place-items-center rounded-xl"
        :class="status === 'unplaced' ? 'bg-danger-50 text-danger-600' : 'bg-spirit-50 text-spirit-600'"
      >
        <AppIcon
          name="ghost"
          class="size-6"
        />
      </span>
      <span class="min-w-0 flex-1 space-y-1.5">
        <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-semibold">{{ ghost.name }}</span>
          <span
            v-if="placement.mode === 'manual'"
            class="inline-flex items-center gap-1 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white"
          >
            <AppIcon
              name="hand"
              class="size-3"
            />
            вручную
          </span>
        </span>
        <span class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span>тревожность {{ ghost.anxiety }}/10</span>
          <span>любит {{ ghost.favoriteTemp }}°</span>
          <DeadlineTag
            :deadline="ghost.deadline"
            :today="today"
          />
        </span>
        <ConditionChips :conditions="ghost.conditions" />
      </span>
      <span class="flex w-full items-center gap-2 border-t border-line pt-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:gap-1.5 sm:border-0 sm:pt-0 sm:text-right">
        <template v-if="place && placement.score !== null && placement.fit">
          <span class="min-w-0 flex-1 truncate text-sm font-medium sm:max-w-56 sm:flex-none">{{ place.name }}</span>
          <FitBadge
            :fit="placement.fit"
            :score="placement.score"
          />
        </template>
        <span
          v-else
          class="mr-auto rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-semibold text-danger-600 sm:mr-0"
        >Без места</span>
        <AppIcon
          name="chevron"
          class="size-4 shrink-0 text-muted transition"
          :class="open ? 'rotate-180' : ''"
        />
      </span>
    </button>

    <div
      v-if="open"
      class="space-y-4 border-t border-line px-4 pt-3 pb-4 text-sm"
    >
      <ul
        v-if="placement.violations.length"
        class="space-y-1 rounded-xl bg-danger-50 p-3 text-danger-600"
      >
        <li class="font-semibold">
          Нарушены обязательные условия:
        </li>
        <li
          v-for="violation in placement.violations"
          :key="violation.message"
          class="flex gap-2"
        >
          <AppIcon
            name="x"
            class="mt-0.5 size-4 shrink-0"
          />
          {{ violation.message }}
        </li>
      </ul>

      <div
        v-if="!placement.placeId"
        class="rounded-xl bg-danger-50 p-3 text-danger-600"
      >
        <p class="mb-1 font-semibold">
          Почему без места
        </p>
        <ul class="space-y-1">
          <li
            v-for="reason in placement.unplacedReasons"
            :key="reason"
            class="flex gap-2"
          >
            <AppIcon
              name="alert"
              class="mt-0.5 size-4 shrink-0"
            />
            {{ reason }}
          </li>
        </ul>
      </div>

      <div v-else>
        <p class="mb-2 font-semibold">
          Почему {{ placement.mode === 'manual' ? 'такая оценка' : 'это место' }}
        </p>
        <ul class="divide-y divide-line rounded-xl border border-line">
          <li class="flex justify-between gap-3 px-3 py-1.5 text-muted">
            <span>Базовые баллы</span>
            <span class="tabular-nums">{{ baseScore }}</span>
          </li>
          <li
            v-for="factor in placement.factors"
            :key="factor.label"
            class="flex justify-between gap-3 px-3 py-1.5"
          >
            <span>{{ factor.label }}</span>
            <span
              class="shrink-0 font-semibold tabular-nums"
              :class="factor.points > 0 ? 'text-glow-700' : factor.points < 0 ? 'text-danger-600' : 'text-muted'"
            >{{ factor.points > 0 ? '+' : '' }}{{ factor.points }}</span>
          </li>
          <li class="flex justify-between gap-3 bg-mist/60 px-3 py-1.5 font-semibold">
            <span>Итого (от 0 до 100)</span>
            <span class="tabular-nums">{{ placement.score }}</span>
          </li>
        </ul>
      </div>

      <ul
        v-if="placement.warnings.length"
        class="space-y-1 text-ember-600"
      >
        <li
          v-for="warning in placement.warnings"
          :key="warning"
          class="flex gap-2"
        >
          <AppIcon
            name="info"
            class="mt-0.5 size-4 shrink-0"
          />
          {{ warning }}
        </li>
      </ul>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-soft"
          @click="emit('change')"
        >
          <AppIcon
            name="hand"
            class="size-4"
          />
          Выбрать место вручную
        </button>
        <button
          v-if="placement.mode === 'manual'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-mist"
          @click="emit('auto')"
        >
          <AppIcon
            name="refresh"
            class="size-4"
          />
          Вернуть автоподбор
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ghost, Place, Placement } from '../../domain'
import AppIcon from '../ui/AppIcon.vue'
import FitBadge from '../ui/FitBadge.vue'
import ConditionChips from '../ConditionChips.vue'
import DeadlineTag from './DeadlineTag.vue'

const props = defineProps<{ ghost: Ghost, placement: Placement, place: Place | undefined, today: string }>()
const emit = defineEmits<{ change: [], auto: [] }>()
const open = ref(false)

const status = computed(() => {
  if (!props.placement.placeId) {
    return 'unplaced'
  }
  return props.placement.violations.length ? 'violations' : props.placement.warnings.length ? 'warnings' : 'ok'
})
const baseScore = 50
</script>
