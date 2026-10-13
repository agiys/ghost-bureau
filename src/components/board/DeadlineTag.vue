<template>
  <span
    class="inline-flex items-center gap-1"
    :class="days < 0 ? 'font-semibold text-danger-600' : days <= 3 ? 'font-medium text-ember-600' : ''"
  >
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { daysBetween, formatDay } from '../../domain'

const props = defineProps<{ deadline: string, today: string }>()

const days = computed(() => daysBetween(props.today, props.deadline))
const text = computed(() => {
  if (days.value < 0) {
    return `просрочен ${formatDay(props.deadline)}`
  }
  if (days.value === 0) {
    return 'сегодня'
  }
  return `до ${formatDay(props.deadline)} · ${days.value} дн.`
})
</script>
