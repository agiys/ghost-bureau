<template>
  <BaseModal
    :open="open"
    :title="place ? 'Изменить место' : 'Новое место'"
    @close="emit('close')"
  >
    <form
      id="place-form"
      class="space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <FormField
        label="Название"
        for-id="place-name"
        :error="visibleErrors.name"
      >
        <input
          id="place-name"
          v-model="form.name"
          class="w-full rounded-lg border border-line px-3 py-2"
          maxlength="60"
          placeholder="Например, Маяк на Тёмном мысе"
        >
      </FormField>
      <div class="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Вместимость"
          for-id="place-capacity"
          :error="visibleErrors.capacity"
        >
          <input
            id="place-capacity"
            v-model.number="form.capacity"
            type="number"
            min="1"
            max="50"
            class="w-full rounded-lg border border-line px-3 py-2"
          >
        </FormField>
        <FormField
          label="Температура"
          for-id="place-temp"
          :error="visibleErrors.temperature"
        >
          <input
            id="place-temp"
            v-model.number="form.temperature"
            type="number"
            min="-30"
            max="40"
            class="w-full rounded-lg border border-line px-3 py-2"
          >
        </FormField>
        <FormField
          label="Люди бывают"
          for-id="place-humans"
          :error="visibleErrors.humans"
        >
          <select
            id="place-humans"
            v-model="form.humans"
            class="w-full rounded-lg border border-line bg-white px-3 py-2"
          >
            <option
              v-for="value in humans"
              :key="value"
              :value="value"
            >
              {{ HUMAN_LABELS[value] }}
            </option>
          </select>
        </FormField>
      </div>
      <div
        v-for="scale in scales"
        :key="scale.key"
        class="space-y-1"
      >
        <label
          :for="`place-${scale.key}`"
          class="flex justify-between text-sm font-medium"
        >
          <span>{{ scale.label }}</span>
          <span class="tabular-nums text-muted">{{ form[scale.key] }}/10</span>
        </label>
        <input
          :id="`place-${scale.key}`"
          v-model.number="form[scale.key]"
          type="range"
          min="0"
          max="10"
          class="w-full accent-spirit-600"
        >
        <div class="flex justify-between text-[11px] text-muted">
          <span>{{ scale.low }}</span><span>{{ scale.high }}</span>
        </div>
      </div>
      <div class="flex flex-wrap gap-4 text-sm">
        <label class="flex items-center gap-2">
          <input
            v-model="form.hasAttic"
            type="checkbox"
            class="size-4 accent-spirit-600"
          > Есть чердак
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="form.hasMirrors"
            type="checkbox"
            class="size-4 accent-spirit-600"
          > Есть зеркала
        </label>
      </div>
      <FormField
        label="Предел тревожности (необязательно)"
        for-id="place-max-anxiety"
        :error="visibleErrors.maxAnxiety"
        hint="Например, библиотека принимает только спокойных: до 6. Пусто — без ограничений."
      >
        <input
          id="place-max-anxiety"
          v-model="maxAnxietyText"
          inputmode="numeric"
          class="w-32 rounded-lg border border-line px-3 py-2"
          placeholder="—"
        >
      </FormField>
    </form>
    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-mist"
        @click="emit('close')"
      >
        Отмена
      </button>
      <button
        type="submit"
        form="place-form"
        class="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        Сохранить
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { HUMAN_LABELS, placeErrors } from '../../domain'
import type { HumanPresence, Place } from '../../domain'
import { useBureau } from '../../state/bureau'
import BaseModal from '../ui/BaseModal.vue'
import FormField from './FormField.vue'

const props = defineProps<{ open: boolean, place: Place | null }>()
const emit = defineEmits<{ close: [] }>()
const { savePlace } = useBureau()

const blank = (): Omit<Place, 'id'> => ({ name: '', capacity: 2, lighting: 3, noise: 3, humidity: 5, temperature: 12, humans: 'none', hasAttic: false, hasMirrors: false, maxAnxiety: null })
const form = reactive(blank())
const maxAnxietyText = ref('')
const touched = ref(false)

watch(() => props.open, (open) => {
  if (!open) {
    return
  }
  touched.value = false
  const { id: _id, ...rest } = props.place ?? { id: '', ...blank() }
  Object.assign(form, rest)
  maxAnxietyText.value = rest.maxAnxiety === null ? '' : String(rest.maxAnxiety)
})

const parsedMaxAnxiety = computed(() => (maxAnxietyText.value.trim() === '' ? null : Number(maxAnxietyText.value)))
const errors = computed(() => placeErrors({ ...form, name: form.name.trim(), maxAnxiety: parsedMaxAnxiety.value }))
const visibleErrors = computed(() => (touched.value ? errors.value : {}))
const humans: HumanPresence[] = ['none', 'occasional', 'constant']
const scales = [
  { key: 'lighting', label: 'Освещение', low: 'темно', high: 'ярко' },
  { key: 'noise', label: 'Шум', low: 'тихо', high: 'громко' },
  { key: 'humidity', label: 'Влажность', low: 'сухо', high: 'сыро' },
] as const

function submit() {
  touched.value = true
  if (Object.keys(errors.value).length) {
    return
  }
  savePlace({ ...form, name: form.name.trim(), maxAnxiety: parsedMaxAnxiety.value, id: props.place?.id })
  emit('close')
}
</script>
