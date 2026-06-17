<script setup lang="ts">
import { computed } from "vue"
import type { MonthlyTrendStat } from "@/domain/types/dashboard"

const props = defineProps<{
  items: MonthlyTrendStat[]
}>()

const maxTotal = computed(() =>
  Math.max(...props.items.map(item => item.boardCount + item.escapeCount), 1),
)
</script>

<template>
  <section class="space-y-4 rounded-xl border-2 border-gray-700 bg-dark/60 p-4">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
      Tendencia mensual
    </h2>

    <p v-if="items.length === 0" class="text-sm text-gray-500">Sin partidas registradas.</p>

    <ul v-else class="space-y-4">
      <li v-for="item in items" :key="item.label" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="capitalize text-gray-300">{{ item.label }}</span>
          <span class="text-gray-500">
            {{ item.boardCount + item.escapeCount }} partidas
          </span>
        </div>
        <div class="flex h-3 overflow-hidden rounded-full bg-gray-800">
          <div
            class="h-full bg-board"
            :style="{ width: `${(item.boardCount / maxTotal) * 100}%` }"
          />
          <div
            class="h-full bg-tertiary"
            :style="{ width: `${(item.escapeCount / maxTotal) * 100}%` }"
          />
        </div>
        <div class="flex gap-3 text-xs text-gray-500">
          <span class="text-board">{{ item.boardCount }} mesa</span>
          <span class="text-tertiary">{{ item.escapeCount }} escape</span>
        </div>
      </li>
    </ul>
  </section>
</template>
