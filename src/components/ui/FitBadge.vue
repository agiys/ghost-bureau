<template>
  <span
    class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
    :class="look.cls"
    :title="`Совпадение ${score} из 100`"
  >
    {{ score }}
    <span class="font-medium">{{ look.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Fit } from '../../domain'

const props = defineProps<{ fit: Fit, score: number }>()

const look = computed(() => ({
  great: { label: 'Отлично', cls: 'bg-glow-100 text-glow-700' },
  good: { label: 'Подходит', cls: 'bg-spirit-100 text-spirit-700' },
  poor: { label: 'С натяжкой', cls: 'bg-ember-50 text-ember-600' },
}[props.fit]))
</script>
