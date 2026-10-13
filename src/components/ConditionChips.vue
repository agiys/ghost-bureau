<template>
  <ul
    v-if="conditions.length"
    class="flex flex-wrap gap-1.5"
  >
    <li
      v-for="condition in conditions"
      :key="condition"
      class="rounded-md px-2 py-0.5 text-xs font-medium"
      :class="isHard(condition) ? 'bg-ink/[0.06] text-ink' : 'bg-spirit-50 text-spirit-700'"
      :title="isHard(condition) ? 'Обязательное условие' : 'Пожелание: влияет на баллы'"
    >
      {{ CONDITION_LABELS[condition] }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { CONDITION_LABELS, isHard } from '../domain'
import type { Condition } from '../domain'

defineProps<{ conditions: Condition[] }>()
</script>
