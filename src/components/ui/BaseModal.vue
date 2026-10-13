<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-150"
      leave-active-class="transition duration-100"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
        @mousedown.self="emit('close')"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          :class="wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'"
        >
          <header class="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 class="text-base font-semibold">
              {{ title }}
            </h2>
            <button
              type="button"
              data-close
              class="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink"
              aria-label="Закрыть"
              @click="emit('close')"
            >
              <AppIcon
                name="x"
                class="size-5"
              />
            </button>
          </header>
          <div class="overflow-y-auto px-5 py-5">
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="flex flex-wrap justify-end gap-2 border-t border-line bg-mist/60 px-5 py-3"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ open: boolean, title: string, wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
let lastFocus: HTMLElement | null = null

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    lastFocus = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKey)
    await nextTick()
    panel.value?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus()
  }
  else {
    document.removeEventListener('keydown', onKey)
    lastFocus?.focus()
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
