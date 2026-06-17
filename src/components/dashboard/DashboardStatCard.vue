<script setup lang="ts">
import { Icon } from "@iconify/vue"

defineProps<{
  title: string
  value: string | number
  subValue?: string
  icon: string
  accentClass?: string
}>()
</script>

<template>
  <article class="rounded-xl border-2 border-gray-700 bg-dark/60 p-4">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ title }}</h3>
      <Icon :icon="icon" class="h-5 w-5 shrink-0" :class="accentClass ?? 'text-primary'" />
    </div>
    <p class="text-2xl font-bold text-gray-100">{{ value }}</p>
    <p v-if="subValue" class="mt-1 text-sm text-gray-400">{{ subValue }}</p>
  </article>
</template>
