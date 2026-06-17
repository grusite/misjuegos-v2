<script setup lang="ts">
import { computed } from "vue"
import { getAvatarColor } from "@/lib/utils/avatarColor"

const props = withDefaults(
  defineProps<{
    displayName: string
    avatarUrl?: string | null
    colorClass?: string | null
    size?: "sm" | "md"
    ringClass?: string
  }>(),
  {
    avatarUrl: null,
    colorClass: null,
    size: "sm",
    ringClass: "ring-dark",
  },
)

const initial = computed(() => props.displayName.charAt(0).toUpperCase())

const bgColor = computed(
  () => props.colorClass ?? getAvatarColor(props.displayName),
)

const sizeClasses = computed(() =>
  props.size === "md" ? "h-8 w-8 text-sm" : "h-7 w-7 text-xs",
)
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden rounded-full ring-2"
    :class="[sizeClasses, ringClass]"
    :title="displayName"
  >
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      class="h-full w-full object-cover"
      alt=""
      referrerpolicy="no-referrer"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center font-semibold text-white"
      :class="bgColor"
    >
      {{ initial }}
    </div>
  </div>
</template>
