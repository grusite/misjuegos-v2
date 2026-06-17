<script setup lang="ts">
import { computed } from "vue"
import type { TopGameStat } from "@/domain/types/dashboard"

const props = defineProps<{
  title: string
  items: TopGameStat[]
  barClass?: string
}>()

const maxCount = computed(() => Math.max(...props.items.map(item => item.count), 1))
</script>

<template>
  <section class="space-y-4 rounded-xl border-2 border-gray-700 bg-dark/60 p-4">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">{{ title }}</h2>

    <p v-if="items.length === 0" class="text-sm text-gray-500">Sin datos todavía.</p>

    <ul v-else class="space-y-3">
      <li v-for="item in items" :key="item.title" class="space-y-1">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="min-w-0 truncate text-gray-200">{{ item.title }}</span>
          <span class="shrink-0 font-semibold text-gray-400">{{ item.count }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            class="h-full rounded-full transition-all"
            :class="barClass ?? 'bg-board'"
            :style="{ width: `${(item.count / maxCount) * 100}%` }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
