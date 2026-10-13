<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="(d, i) in paths[name]"
      :key="i"
      :d="d"
    />
  </svg>
</template>

<script setup lang="ts">
export type IconName =
  | 'ghost' | 'home' | 'alert' | 'check' | 'x' | 'chevron' | 'plus' | 'pencil' | 'trash' | 'download' | 'upload'
  | 'chart' | 'list' | 'sparkles' | 'clipboard' | 'refresh' | 'hand' | 'thermometer' | 'clock' | 'info' | 'lock'

defineProps<{ name: IconName }>()

const paths: Record<IconName, string[]> = {
  ghost: ['M12 3c-4.4 0-7.5 3.3-7.5 7.6V20l2.3-1.6L9.2 20l2.8-1.8 2.8 1.8 2.4-1.6 2.3 1.6v-9.4C19.5 6.3 16.4 3 12 3Z', 'M9.5 11h.01M14.5 11h.01'],
  home: ['M3 11.5 12 4l9 7.5', 'M5.5 9.5V20h13V9.5', 'M10 20v-5h4v5'],
  alert: ['M12 4 2.8 19.5h18.4L12 4Z', 'M12 10v4.5M12 17h.01'],
  check: ['m5 12.5 4.5 4.5L19 7.5'],
  x: ['M6 6l12 12M18 6 6 18'],
  chevron: ['m8 10 4 4 4-4'],
  plus: ['M12 5v14M5 12h14'],
  pencil: ['M4 20h4L19 9l-4-4L4 16v4Z', 'm13.5 6.5 4 4'],
  trash: ['M4 7h16', 'M9.5 7V4.5h5V7', 'M6.5 7l1 13h9l1-13'],
  download: ['M12 4v11', 'm7.5 10.5 4.5 4.5 4.5-4.5', 'M5 20h14'],
  upload: ['M12 15V4', 'm7.5 8.5 4.5-4.5 4.5 4.5', 'M5 20h14'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M3 20h18'],
  list: ['M8 6h12M8 12h12M8 18h12', 'M4 6h.01M4 12h.01M4 18h.01'],
  sparkles: ['M12 3v3M12 18v3M3 12h3M18 12h3', 'm6.3 6.3 2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1'],
  clipboard: ['M9 4h6v3H9z', 'M9 5.5H6.5V20h11V5.5H15', 'm9.5 13 2 2 3.5-4'],
  refresh: ['M19.5 12a7.5 7.5 0 1 1-2.2-5.3', 'M19.5 4.5v4h-4'],
  hand: ['M8 12V6.5a1.5 1.5 0 0 1 3 0V11', 'M11 10V5a1.5 1.5 0 0 1 3 0v6', 'M14 10.5V7a1.5 1.5 0 0 1 3 0v6.5c0 4-2.5 6.5-6 6.5-2.8 0-4.3-1.5-5.6-4L4 12.7a1.4 1.4 0 0 1 2.3-1.6L8 13.5'],
  thermometer: ['M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z', 'M12 9v7'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5M12 8h.01'],
  lock: ['M6.5 11h11v9h-11z', 'M9 11V8a3 3 0 0 1 6 0v3'],
}
</script>
