<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import { formatStarRating, getStarIcons } from "@/lib/utils/starRating"

const props = withDefaults(
  defineProps<{
    rating: number | null
    size?: "sm" | "md"
    accent?: "primary" | "tertiary"
    showLabel?: boolean
  }>(),
  {
    size: "sm",
    accent: "primary",
    showLabel: false,
  },
)

const iconClass = props.size === "md" ? "h-5 w-5" : "h-4 w-4"
const accentClass = props.accent === "tertiary" ? "text-tertiary" : "text-primary"

const starIcons = computed(() =>
  props.rating === null || props.rating <= 0 ? [] : getStarIcons(props.rating),
)
</script>

<template>
  <div
    v-if="starIcons.length > 0"
    class="inline-flex items-center gap-1"
    :aria-label="`${formatStarRating(rating!)} de 5 estrellas`"
  >
    <Icon
      v-for="(kind, index) in starIcons"
      :key="index"
      :icon="
        kind === 'full'
          ? 'ph:star-fill'
          : kind === 'half'
            ? 'ph:star-half-fill'
            : 'ph:star'
      "
      :class="[iconClass, kind === 'empty' ? 'text-gray-600' : accentClass]"
      aria-hidden="true"
    />
    <span v-if="showLabel" class="text-xs text-gray-400">
      {{ formatStarRating(rating!) }}
    </span>
  </div>
</template>
