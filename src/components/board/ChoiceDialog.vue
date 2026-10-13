<template>
  <BaseModal
    :open="ghostId !== null"
    :title="pending ? 'Поселить с нарушениями?' : `Место для: ${ghost?.name ?? ''}`"
    wide
    @close="emit('close')"
  >
    <div
      v-if="pending && pendingPlace"
      class="space-y-4 text-sm"
    >
      <p>
        <b>{{ ghost?.name }}</b> → <b>{{ pendingPlace.name }}</b>. Так нельзя по правилам бюро:
      </p>
      <ul class="space-y-1.5 rounded-xl bg-danger-50 p-3 text-danger-600">
        <li
          v-for="violation in pending.preview.violations"
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
      <ul
        v-if="pending.preview.warnings.length"
        class="space-y-1 text-ember-600"
      >
        <li
          v-for="warning in pending.preview.warnings"
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
      <p class="text-muted">
        Если вы знаете больше, чем система, поселите всё равно: решение будет помечено «вручную» и попадёт в отчёт как нарушение.
      </p>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <p
        v-if="!options.length"
        class="rounded-xl bg-mist p-4 text-sm text-muted"
      >
        В бюро пока нет мест. Добавьте их на вкладке «Места».
      </p>
      <button
        v-for="option in options"
        :key="option.place.id"
        type="button"
        class="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition hover:border-spirit-500"
        :class="current?.placeId === option.place.id ? 'border-spirit-500 bg-spirit-50' : 'border-line'"
        :data-place="option.place.id"
        @click="pick(option.place.id, option.preview)"
      >
        <span class="min-w-0 flex-1">
          <span class="block font-medium">{{ option.place.name }}</span>
          <span class="text-xs text-muted">занято {{ option.taken }} из {{ option.place.capacity }}</span>
        </span>
        <span
          v-if="option.preview?.violations.length"
          class="shrink-0 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-semibold text-danger-600"
          :title="option.preview.violations.map(v => v.message).join('\n')"
        >
          {{ option.preview.violations.length }} {{ option.preview.violations.length === 1 ? 'нарушение' : 'нарушения' }}
        </span>
        <FitBadge
          v-if="option.preview?.fit && option.preview.score !== null"
          :fit="option.preview.fit"
          :score="option.preview.score"
        />
      </button>
    </div>

    <template #footer>
      <template v-if="pending">
        <button
          type="button"
          class="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-mist"
          @click="pending = null"
        >
          Выбрать другое
        </button>
        <button
          type="button"
          class="rounded-lg bg-danger-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
          @click="apply(pending.placeId)"
        >
          Всё равно поселить
        </button>
      </template>
      <button
        v-else
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-mist"
        @click="apply(null)"
      >
        Оставить без места
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { previewChoice } from '../../domain'
import type { Placement } from '../../domain'
import { useBureau } from '../../state/bureau'
import AppIcon from '../ui/AppIcon.vue'
import BaseModal from '../ui/BaseModal.vue'
import FitBadge from '../ui/FitBadge.vue'

const props = defineProps<{ ghostId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { state, plan, chooseManually } = useBureau()
const pending = ref<{ placeId: string, preview: Placement } | null>(null)

watch(() => props.ghostId, () => {
  pending.value = null
})

const ghost = computed(() => state.data.ghosts.find(g => g.id === props.ghostId))
const current = computed(() => plan.value.placements.find(p => p.ghostId === props.ghostId))

const options = computed(() => {
  if (!props.ghostId) {
    return []
  }
  const ghostId = props.ghostId
  return state.data.places
    .map((place) => {
      const preview = previewChoice(state.data, state.today, ghostId, place.id)
      const load = plan.value.loads.find(l => l.placeId === place.id)
      const taken = (load?.occupants.filter(id => id !== ghostId).length ?? 0)
      return { place, preview, taken }
    })
    .sort((a, b) => (a.preview?.violations.length ?? 0) - (b.preview?.violations.length ?? 0) || (b.preview?.score ?? 0) - (a.preview?.score ?? 0))
})

function pick(placeId: string, preview: Placement | undefined) {
  if (!props.ghostId || !preview) {
    return
  }
  if (preview.violations.length) {
    pending.value = { placeId, preview }
    return
  }
  apply(placeId)
}

function apply(placeId: string | null) {
  if (props.ghostId) {
    chooseManually(props.ghostId, placeId)
  }
  pending.value = null
  emit('close')
}

const pendingPlace = computed(() => state.data.places.find(p => p.id === pending.value?.placeId))
</script>
