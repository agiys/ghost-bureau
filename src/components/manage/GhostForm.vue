<template>
  <BaseModal
    :open="open"
    :title="ghost ? 'Изменить заявку' : 'Новая заявка'"
    @close="emit('close')"
  >
    <form
      id="ghost-form"
      class="space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <FormField
        label="Имя"
        for-id="ghost-name"
        :error="visibleErrors.name"
      >
        <input
          id="ghost-name"
          v-model="form.name"
          class="w-full rounded-lg border border-line px-3 py-2"
          maxlength="60"
          placeholder="Например, Леди Сквозняк"
        >
      </FormField>
      <div class="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Тревожность, 1–10"
          for-id="ghost-anxiety"
          :error="visibleErrors.anxiety"
        >
          <input
            id="ghost-anxiety"
            v-model.number="form.anxiety"
            type="number"
            min="1"
            max="10"
            class="w-full rounded-lg border border-line px-3 py-2"
          >
        </FormField>
        <FormField
          label="Любимая t°"
          for-id="ghost-temp"
          :error="visibleErrors.favoriteTemp"
        >
          <input
            id="ghost-temp"
            v-model.number="form.favoriteTemp"
            type="number"
            min="-30"
            max="40"
            class="w-full rounded-lg border border-line px-3 py-2"
          >
        </FormField>
        <FormField
          label="Дедлайн"
          for-id="ghost-deadline"
          :error="visibleErrors.deadline"
        >
          <input
            id="ghost-deadline"
            v-model="form.deadline"
            type="date"
            class="w-full rounded-lg border border-line px-3 py-2"
          >
        </FormField>
      </div>
      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">
          Особые условия
        </legend>
        <p class="text-xs text-muted">
          Обязательные отсекают неподходящие места, пожелания только меняют баллы.
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            v-for="condition in ALL_CONDITIONS"
            :key="condition"
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-spirit-500 has-checked:bg-spirit-50"
          >
            <input
              v-model="form.conditions"
              type="checkbox"
              :value="condition"
              class="size-4 accent-spirit-600"
            >
            <span class="flex-1">{{ CONDITION_LABELS[condition] }}</span>
            <span class="text-[11px] text-muted">{{ isHard(condition) ? 'обязательно' : 'пожелание' }}</span>
          </label>
        </div>
      </fieldset>
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
        form="ghost-form"
        class="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        Сохранить
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { addDays, ALL_CONDITIONS, CONDITION_LABELS, ghostErrors, isHard } from '../../domain'
import type { Condition, Ghost } from '../../domain'
import { useBureau } from '../../state/bureau'
import BaseModal from '../ui/BaseModal.vue'
import FormField from './FormField.vue'

const props = defineProps<{ open: boolean, ghost: Ghost | null }>()
const emit = defineEmits<{ close: [] }>()
const { state, saveGhost } = useBureau()

const form = reactive({ name: '', anxiety: 5, favoriteTemp: 12, deadline: '', conditions: [] as Condition[] })
const touched = ref(false)

watch(() => props.open, (open) => {
  if (!open) {
    return
  }
  touched.value = false
  const source = props.ghost
  Object.assign(form, source
    ? { name: source.name, anxiety: source.anxiety, favoriteTemp: source.favoriteTemp, deadline: source.deadline, conditions: [...source.conditions] }
    : { name: '', anxiety: 5, favoriteTemp: 12, deadline: addDays(state.today, 7), conditions: [] })
})

const errors = computed(() => ghostErrors({ ...form, name: form.name.trim() }))
const visibleErrors = computed(() => (touched.value ? errors.value : {}))

function submit() {
  touched.value = true
  if (Object.keys(errors.value).length) {
    return
  }
  saveGhost({ ...form, name: form.name.trim(), conditions: [...form.conditions], id: props.ghost?.id })
  emit('close')
}
</script>
