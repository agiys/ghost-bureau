<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">
          Места переселения
        </h2>
        <p class="text-sm text-muted">
          Шкалы от 0 до 10. Чердак, зеркала, люди и предел тревожности — обязательные ограничения.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-soft"
        @click="openForm(null)"
      >
        <AppIcon
          name="plus"
          class="size-4"
        />
        Новое место
      </button>
    </div>

    <div
      v-if="!state.data.places.length"
      class="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center"
    >
      <p class="font-semibold">
        Мест пока нет
      </p>
      <p class="mt-1 text-sm text-muted">
        Без мест никого не расселить. Добавьте место или загрузите демо-данные.
      </p>
      <button
        type="button"
        class="mt-4 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-mist"
        @click="loadScenario('demo')"
      >
        Загрузить демо
      </button>
    </div>

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      <article
        v-for="place in state.data.places"
        :key="place.id"
        class="flex flex-col rounded-card border border-line bg-white p-4 shadow-card"
      >
        <div class="mb-3 flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="font-semibold">
              {{ place.name }}
            </h3>
            <p
              class="text-xs"
              :class="occupancy(place.id) > place.capacity ? 'font-semibold text-danger-600' : 'text-muted'"
            >
              занято {{ occupancy(place.id) }} из {{ place.capacity }}
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              class="grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink"
              :aria-label="`Изменить ${place.name}`"
              @click="openForm(place)"
            >
              <AppIcon
                name="pencil"
                class="size-4"
              />
            </button>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger-50 hover:text-danger-600"
              :aria-label="`Удалить ${place.name}`"
              @click="removing = place"
            >
              <AppIcon
                name="trash"
                class="size-4"
              />
            </button>
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt class="text-muted">
            Освещение
          </dt><dd class="tabular-nums">
            {{ place.lighting }}/10
          </dd>
          <dt class="text-muted">
            Шум
          </dt><dd class="tabular-nums">
            {{ place.noise }}/10
          </dd>
          <dt class="text-muted">
            Влажность
          </dt><dd class="tabular-nums">
            {{ place.humidity }}/10
          </dd>
          <dt class="text-muted">
            Температура
          </dt><dd class="tabular-nums">
            {{ place.temperature }}°
          </dd>
          <dt class="text-muted">
            Люди
          </dt><dd>{{ HUMAN_LABELS[place.humans] }}</dd>
        </dl>
        <ul class="mt-3 flex flex-wrap gap-1.5 text-xs">
          <li
            v-if="place.hasAttic"
            class="rounded-md bg-mist px-2 py-0.5"
          >
            чердак
          </li>
          <li
            v-if="place.hasMirrors"
            class="rounded-md bg-mist px-2 py-0.5"
          >
            зеркала
          </li>
          <li
            v-if="place.maxAnxiety !== null"
            class="rounded-md bg-ember-50 px-2 py-0.5 text-ember-600"
          >
            тревожность до {{ place.maxAnxiety }}
          </li>
        </ul>
      </article>
    </div>

    <PlaceForm
      :open="formOpen"
      :place="editing"
      @close="formOpen = false"
    />
    <ConfirmDialog
      :open="removing !== null"
      title="Удалить место?"
      :text="`«${removing?.name}» исчезнет, а привидения оттуда будут распределены заново.`"
      action="Удалить"
      @close="removing = null"
      @confirm="removePlace(removing!.id); removing = null"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HUMAN_LABELS } from '../../domain'
import type { Place } from '../../domain'
import { useBureau } from '../../state/bureau'
import AppIcon from '../ui/AppIcon.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import PlaceForm from './PlaceForm.vue'

const { state, plan, removePlace, loadScenario } = useBureau()
const editing = ref<Place | null>(null)
const formOpen = ref(false)
const removing = ref<Place | null>(null)

function openForm(place: Place | null) {
  editing.value = place
  formOpen.value = true
}

const occupancy = (id: string) => plan.value.loads.find(l => l.placeId === id)?.occupants.length ?? 0
</script>
