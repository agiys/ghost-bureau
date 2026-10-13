<template>
  <article class="mx-auto max-w-4xl space-y-6">
    <header class="space-y-1">
      <h2 class="text-lg font-semibold">
        AI Worklog
      </h2>
      <p class="text-sm text-muted">
        Как приложение делалось с AI: инструменты, этапы, промпты, мои решения и ошибки AI.
      </p>
    </header>

    <dl class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-card border border-line bg-white p-4 shadow-card sm:col-span-1">
        <dt class="flex items-center gap-1.5 text-sm text-muted">
          <AppIcon
            name="clock"
            class="size-4"
          />
          Время разработки
        </dt>
        <dd class="mt-1 font-semibold">
          {{ worklog.totalTime }}
        </dd>
      </div>
      <div class="rounded-card border border-line bg-white p-4 shadow-card sm:col-span-2">
        <dt class="text-sm text-muted">
          Токены
        </dt>
        <dd class="mt-1 text-sm">
          {{ worklog.tokens }}
        </dd>
      </div>
    </dl>

    <section class="rounded-card border border-line bg-white p-4 shadow-card">
      <h3 class="mb-2 font-semibold">
        Инструменты
      </h3>
      <ul class="space-y-1 text-sm">
        <li
          v-for="tool in worklog.tools"
          :key="tool.name"
        >
          <b>{{ tool.name }}</b> — {{ tool.detail }}
        </li>
      </ul>
    </section>

    <section class="space-y-3">
      <h3 class="font-semibold">
        Этапы
      </h3>
      <ol class="space-y-3">
        <li
          v-for="(stage, index) in worklog.stages"
          :key="stage.title"
          class="rounded-card border border-line bg-white p-4 shadow-card"
        >
          <p class="mb-2 font-semibold">
            {{ index + 1 }}. {{ stage.title }}
          </p>
          <div class="grid gap-3 text-sm sm:grid-cols-2">
            <p><span class="font-medium text-spirit-700">Я:</span> {{ stage.me }}</p>
            <p><span class="font-medium text-glow-700">AI:</span> {{ stage.ai }}</p>
          </div>
          <ul class="mt-3 space-y-1.5">
            <li
              v-for="prompt in stage.prompts"
              :key="prompt"
              class="rounded-lg bg-mist px-3 py-2 font-mono text-xs leading-relaxed text-ink/80"
            >
              {{ prompt }}
            </li>
          </ul>
        </li>
      </ol>
    </section>

    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-card border border-line bg-white p-4 shadow-card">
        <h3 class="mb-2 font-semibold">
          Решения, которые я принял сам
        </h3>
        <ul class="list-disc space-y-1.5 pl-5 text-sm">
          <li
            v-for="item in worklog.myDecisions"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </section>
      <section class="rounded-card border border-line bg-white p-4 shadow-card">
        <h3 class="mb-2 font-semibold">
          Где AI ошибся
        </h3>
        <ul class="list-disc space-y-1.5 pl-5 text-sm">
          <li
            v-for="item in worklog.aiMistakes"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </section>
      <section class="rounded-card border border-line bg-white p-4 shadow-card">
        <h3 class="mb-2 font-semibold">
          Что доработано после проверки
        </h3>
        <ul class="list-disc space-y-1.5 pl-5 text-sm">
          <li
            v-for="item in worklog.reworked"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </section>
      <section class="rounded-card border border-line bg-white p-4 shadow-card">
        <h3 class="mb-2 font-semibold">
          Что улучшил бы в реальном продукте
        </h3>
        <ul class="list-disc space-y-1.5 pl-5 text-sm">
          <li
            v-for="item in worklog.nextSteps"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { worklog } from '../../content/worklog'
import AppIcon from '../ui/AppIcon.vue'
</script>
