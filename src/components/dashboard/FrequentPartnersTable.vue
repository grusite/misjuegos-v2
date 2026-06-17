<script setup lang="ts">
import type { FrequentPartnerStat } from "@/domain/types/dashboard"

defineProps<{
  items: FrequentPartnerStat[]
}>()
</script>

<template>
  <section class="space-y-4 rounded-xl border-2 border-gray-700 bg-dark/60 p-4">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
      Compañeros frecuentes
    </h2>

    <p v-if="items.length === 0" class="text-sm text-gray-500">
      Aparecerán cuando compartas partidas con otros jugadores.
    </p>

    <ul v-else class="divide-y divide-gray-800">
      <li
        v-for="(item, index) in items"
        :key="item.displayName"
        class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-primary">
            {{ index + 1 }}
          </span>
          <span class="truncate text-gray-200">{{ item.displayName }}</span>
        </div>
        <span class="shrink-0 text-sm font-semibold text-gray-400">
          {{ item.sessionCount }} partidas
        </span>
      </li>
    </ul>
  </section>
</template>
