<template>
  <div class="space-y-1">
    <label
      :for="forId"
      class="block text-sm font-medium"
    >{{ label }}</label>
    <slot />
    <p
      v-if="error"
      class="text-xs text-danger-600"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="text-xs text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string, error?: string, hint?: string, forId: string }>()
</script>
