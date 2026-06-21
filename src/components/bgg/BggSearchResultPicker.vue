<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import type { BggSearchResult } from "@/services/bgg/bggService"

const props = withDefaults(
  defineProps<{
    results: BggSearchResult[]
    modelValue: string
    accent?: "board" | "wishlist"
  }>(),
  {
    accent: "board",
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const selectedBorderClass = computed(() =>
  props.accent === "wishlist" ? "border-primary bg-primary/10" : "border-board bg-board/10",
)

function toggleSelection(bggId: number) {
  const next = String(bggId) === props.modelValue ? "" : String(bggId)
  emit("update:modelValue", next)
}

function formatYear(yearPublished: number | null) {
  return yearPublished ? String(yearPublished) : "—"
}
</script>

<template>
  <ul
    class="max-h-72 space-y-2 overflow-y-auto pr-1"
    role="listbox"
    aria-label="Resultados de BoardGameGeek"
  >
    <li
      v-for="result in results"
      :key="result.bggId"
      role="option"
      :aria-selected="modelValue === String(result.bggId)"
    >
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-xl border-4 p-2 text-left transition active:scale-[0.99]"
        :class="
          modelValue === String(result.bggId)
            ? selectedBorderClass
            : 'border-gray-700 hover:border-gray-500'
        "
        @click="toggleSelection(result.bggId)"
      >
        <div
          class="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-gray-700 bg-gray-900"
        >
          <img
            v-if="result.thumbnailUrl"
            :src="result.thumbnailUrl"
            :alt="result.title"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <Icon
            v-else
            icon="mdi:dice-multiple"
            class="text-2xl text-gray-500"
            aria-hidden="true"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-gray-100">
            {{ result.title }}
          </p>
          <p class="text-sm text-gray-400">
            {{ formatYear(result.yearPublished) }}
          </p>
        </div>

        <Icon
          v-if="modelValue === String(result.bggId)"
          icon="mdi:check-circle"
          class="shrink-0 text-xl"
          :class="accent === 'wishlist' ? 'text-primary' : 'text-board'"
          aria-hidden="true"
        />
      </button>
    </li>
  </ul>
</template>
