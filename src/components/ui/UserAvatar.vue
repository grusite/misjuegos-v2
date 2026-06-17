<script setup lang="ts">
import { computed } from "vue"
import { getAvatarColor } from "@/lib/utils/avatarColor"

const props = withDefaults(
  defineProps<{
    displayName: string
    avatarUrl?: string | null
    email?: string | null
    colorClass?: string | null
    variant?: "light" | "dark"
  }>(),
  {
    avatarUrl: null,
    email: null,
    colorClass: null,
    variant: "light",
  },
)

const initial = computed(() =>
  props.displayName.charAt(0).toUpperCase(),
)

const bgColor = computed(
  () => props.colorClass ?? getAvatarColor(props.displayName),
)

const textClasses = computed(() =>
  props.variant === "dark"
    ? "text-gray-100"
    : "text-dark",
)

const emailClasses = computed(() =>
  props.variant === "dark" ? "text-gray-400" : "text-stone-600",
)
</script>

<template>
  <div
    class="flex flex-1 items-center gap-3"
    :class="textClasses"
  >
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      class="h-10 w-10 flex-none rounded-full"
      alt=""
      referrerpolicy="no-referrer"
    />
    <div
      v-else
      class="flex h-10 w-10 flex-none items-center justify-center rounded-full text-2xl text-white"
      :class="bgColor"
    >
      {{ initial }}
    </div>
    <div class="leading-tight">
      <div class="font-medium">{{ displayName }}</div>
      <div
        v-if="email"
        class="text-sm"
        :class="emailClasses"
      >
        {{ email }}
      </div>
    </div>
  </div>
</template>
