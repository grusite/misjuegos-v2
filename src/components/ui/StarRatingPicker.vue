<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import { formatStarRating, getStarIcons } from "@/lib/utils/starRating"

const rating = defineModel<number | null>({ required: true })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    accent?: "primary" | "tertiary"
  }>(),
  {
    accent: "tertiary",
  },
)

const accentClass = computed(() =>
  props.accent === "tertiary" ? "text-tertiary" : "text-primary",
)

const starIcons = computed(() =>
  rating.value === null ? [] : getStarIcons(rating.value),
)

function setRating(value: number) {
  if (props.disabled) return
  rating.value = rating.value === value ? null : value
}

function clearRating() {
  if (props.disabled) return
  rating.value = null
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <div
        v-for="(kind, index) in starIcons.length > 0 ? starIcons : Array(5).fill('empty')"
        :key="index"
        class="relative h-8 w-8"
      >
        <button
          type="button"
          class="absolute inset-y-0 left-0 z-10 w-1/2 disabled:opacity-50"
          :disabled="disabled"
          :aria-label="`${index + 0.5} estrellas`"
          @click="setRating(index + 0.5)"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 z-10 w-1/2 disabled:opacity-50"
          :disabled="disabled"
          :aria-label="`${index + 1} estrella${index === 0 ? '' : 's'}`"
          @click="setRating(index + 1)"
        />
        <Icon
          :icon="
            kind === 'full'
              ? 'ph:star-fill'
              : kind === 'half'
                ? 'ph:star-half-fill'
                : 'ph:star'
          "
          class="pointer-events-none h-8 w-8"
          :class="kind === 'empty' ? 'text-gray-600' : accentClass"
          aria-hidden="true"
        />
      </div>

      <span v-if="rating !== null" class="text-sm font-semibold text-gray-300">
        {{ formatStarRating(rating) }}
      </span>

      <button
        v-if="rating !== null"
        type="button"
        class="text-xs font-semibold text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline disabled:opacity-50"
        :disabled="disabled"
        @click="clearRating"
      >
        Quitar
      </button>
    </div>
    <p v-if="rating === null" class="text-xs text-gray-500">
      Toca a la izquierda o derecha de cada estrella para medias (1–5).
    </p>
  </div>
</template>
