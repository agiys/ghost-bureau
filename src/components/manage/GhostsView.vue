<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">
          Заявки привидений
        </h2>
        <p class="text-sm text-muted">
          Сортировка по дедлайну. Изменения сразу пересчитывают распределение.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="state.data.ghosts.length"
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-ink"
          @click="clearing = true"
        >
          Очистить все
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink-soft"
          @click="openForm(null)"
        >
          <AppIcon
            name="plus"
            class="size-4"
          />
          Новая заявка
        </button>
      </div>
    </div>

    <div
      v-if="!sorted.length"
      class="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center"
    >
      <p class="font-semibold">
        Список заявок пуст
      </p>
      <p class="mt-1 text-sm text-muted">
        Добавьте первую заявку или загрузите демо-данные.
      </p>
      <button
        type="button"
        class="mt-4 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-mist"
        @click="loadScenario('demo')"
      >
        Загрузить демо
      </button>
    </div>

    <ul
      v-else
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card"
    >
      <li
        v-for="ghost in sorted"
        :key="ghost.id"
        class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
      >
        <div class="min-w-48 flex-1 space-y-1">
          <p class="font-medium">
            {{ ghost.name }}
          </p>
          <p class="flex flex-wrap gap-x-3 text-xs text-muted">
            <span>тревожность {{ ghost.anxiety }}/10</span>
            <span>любит {{ ghost.favoriteTemp }}°</span>
            <DeadlineTag
              :deadline="ghost.deadline"
              :today="state.today"
            />
          </p>
        </div>
        <ConditionChips
          class="flex-1"
          :conditions="ghost.conditions"
        />
        <div class="flex gap-1">
          <button
            type="button"
            class="grid size-9 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink"
            :aria-label="`Изменить ${ghost.name}`"
            @click="openForm(ghost)"
          >
            <AppIcon
              name="pencil"
              class="size-4"
            />
          </button>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-50 hover:text-danger-600"
            :aria-label="`Удалить ${ghost.name}`"
            @click="removing = ghost"
          >
            <AppIcon
              name="trash"
              class="size-4"
            />
          </button>
        </div>
      </li>
    </ul>

    <GhostForm
      :open="formOpen"
      :ghost="editing"
      @close="formOpen = false"
    />
    <ConfirmDialog
      :open="removing !== null"
      title="Удалить заявку?"
      :text="`Заявка «${removing?.name}» и ручное решение по ней будут удалены.`"
      action="Удалить"
      @close="removing = null"
      @confirm="removeGhost(removing!.id); removing = null"
    />
    <ConfirmDialog
      :open="clearing"
      title="Очистить все заявки?"
      text="Все заявки и ручные решения будут удалены. Места останутся."
      action="Очистить"
      @close="clearing = false"
      @confirm="clearGhosts(); clearing = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ghost } from '../../domain'
import { useBureau } from '../../state/bureau'
import ConditionChips from '../ConditionChips.vue'
import DeadlineTag from '../board/DeadlineTag.vue'
import AppIcon from '../ui/AppIcon.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import GhostForm from './GhostForm.vue'

const { state, removeGhost, clearGhosts, loadScenario } = useBureau()
const editing = ref<Ghost | null>(null)
const formOpen = ref(false)
const removing = ref<Ghost | null>(null)
const clearing = ref(false)

const sorted = computed(() => [...state.data.ghosts].sort((a, b) => a.deadline.localeCompare(b.deadline)))

function openForm(ghost: Ghost | null) {
  editing.value = ghost
  formOpen.value = true
}
</script>
