<template>
  <section class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold">
        Чеклист проверки
      </h2>
      <p class="text-sm text-muted">
        Сценарии, которые проверял перед сдачей. Каждый сценарий подгружается при нажатии по кнопке; автотесты дублируют их в коде.
      </p>
    </div>
    <ol class="space-y-3">
      <li
        v-for="(check, index) in checks"
        :key="check.title"
        class="flex flex-wrap items-start gap-4 rounded-card border border-line bg-white p-4 shadow-card"
      >
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-glow-100 text-glow-700">
          <AppIcon
            name="check"
            class="size-4"
          />
        </span>
        <div class="min-w-56 flex-1 space-y-1 text-sm">
          <p class="font-semibold">
            {{ index + 1 }}. {{ check.title }}
          </p>
          <p><span class="text-muted">Действие:</span> {{ check.steps }}</p>
          <p><span class="text-muted">Ожидаю:</span> {{ check.expect }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-mist"
          @click="run(check)"
        >
          {{ check.corrupt ? 'Испортить сохранение' : 'Открыть сценарий' }}
        </button>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { ScenarioId } from '../../domain'
import { useBureau } from '../../state/bureau'
import AppIcon from '../ui/AppIcon.vue'

const emit = defineEmits<{ goto: [tab: 'board' | 'report'] }>()
const { loadScenario, simulateCorruptedSave } = useBureau()

interface Check {
  title: string
  steps: string
  expect: string
  scenario?: ScenarioId
  corrupt?: boolean
}

const checks: Check[] = [
  { title: 'Обычный день', scenario: 'demo', steps: 'Открыть "Распределение", нажать на любую заявку.', expect: '9 из 11 расселены. У призраков есть место, баллы и расчёт по факторам. "Опоздавший" и "Графиня" без места с причинами.' },
  { title: 'Пустой список заявок', scenario: 'empty', steps: 'Загрузить сценарий.', expect: 'Пустая страница с кнопками "Добавить заявку" и "Загрузить демо", отчёт без ошибок.' },
  { title: 'Заявка без подходящего места', scenario: 'no_place', steps: 'Раскрыть карточку "Графиня Без-Отражения".', expect: 'Причины сгруппированы: нет чердака, есть зеркала, слишком светло, ограничение по тревожности и названиями мест.' },
  { title: 'Место переполнено', scenario: 'overflow', steps: 'Посмотреть "Загрузку мест" и "Отчет".', expect: 'Часовня 3/1 красным, "Перегружено" первым в отчете, у троих ручных решений есть нарушения.' },
  { title: 'Ручной выбор конфликтует с условиями', scenario: 'manual_conflict', steps: 'Раскрыть "Тихоню Агату", затем "Выбрать место вручную" → "Замок Грейхолл".', expect: 'В библиотеке два нарушения и совет "Есть место лучше: Часовня". У замка окно подтверждения: зеркала и люди; после "Всё равно поселить" решение помечено "вручную".' },
  { title: 'Сообщение об ошибке', corrupt: true, steps: 'Нажать кнопку и сохранение в браузере будет испорчено.', expect: 'Красное сообщение "Сохранённые данные не читаются" с причиной; данные не перезаписаны; можно скачать их или вернуть демо.' },
]

function run(check: Check) {
  if (check.corrupt) {
    simulateCorruptedSave()
  }
  else if (check.scenario) {
    loadScenario(check.scenario)
  }
  emit('goto', 'board')
}
</script>
