<template>
  <div
    v-if="state.notice"
    class="flex flex-wrap items-start gap-3 rounded-card border p-4 text-sm"
    :class="state.notice.kind === 'error' ? 'border-danger-600/30 bg-danger-50' : 'border-glow-600/30 bg-glow-100'"
    :role="state.notice.kind === 'error' ? 'alert' : 'status'"
  >
    <AppIcon
      :name="state.notice.kind === 'error' ? 'alert' : 'check'"
      class="mt-0.5 size-5 shrink-0"
      :class="state.notice.kind === 'error' ? 'text-danger-600' : 'text-glow-700'"
    />
    <div class="min-w-48 flex-1">
      <p
        class="font-semibold"
        :class="state.notice.kind === 'error' ? 'text-danger-600' : 'text-glow-700'"
      >
        {{ state.notice.title }}
      </p>
      <p
        v-if="state.notice.text"
        class="mt-0.5 text-ink/80"
      >
        {{ state.notice.text }}
      </p>
      <div
        v-if="state.notice.actions?.length"
        class="mt-3 flex flex-wrap gap-2"
      >
        <button
          v-if="state.notice.actions.includes('download-raw')"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 font-medium hover:bg-mist"
          @click="downloadRawSave"
        >
          <AppIcon
            name="download"
            class="size-4"
          />
          Скачать как есть
        </button>
        <button
          v-if="state.notice.actions.includes('reset')"
          type="button"
          class="rounded-lg bg-ink px-3 py-1.5 font-medium text-white hover:bg-ink-soft"
          @click="resetToDemo"
        >
          Начать с демо-данных
        </button>
        <button
          v-if="state.notice.actions.includes('reload')"
          type="button"
          class="rounded-lg bg-ink px-3 py-1.5 font-medium text-white hover:bg-ink-soft"
          @click="reload"
        >
          Перезагрузить страницу
        </button>
      </div>
    </div>
    <button
      v-if="!state.notice.actions?.includes('reset')"
      type="button"
      class="grid size-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/60 hover:text-ink"
      aria-label="Закрыть сообщение"
      @click="dismissNotice"
    >
      <AppIcon
        name="x"
        class="size-4"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useBureau } from '../state/bureau'
import AppIcon from './ui/AppIcon.vue'

const { state, dismissNotice, resetToDemo, downloadRawSave } = useBureau()

function reload() {
  window.location.reload()
}
</script>
