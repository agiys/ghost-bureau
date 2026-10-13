<template>
  <BaseModal
    :open="open"
    :title="title"
    @close="emit('close')"
  >
    <p class="text-sm">
      {{ text }}
    </p>
    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-mist"
        @click="emit('close')"
      >
        Отмена
      </button>
      <button
        type="button"
        class="rounded-lg bg-danger-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
        @click="emit('confirm')"
      >
        {{ action }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '../ui/BaseModal.vue'

defineProps<{ open: boolean, title: string, text: string, action: string }>()
const emit = defineEmits<{ confirm: [], close: [] }>()
</script>
