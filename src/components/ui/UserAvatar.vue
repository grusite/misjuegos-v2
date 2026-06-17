<script setup lang="ts">
import { computed } from "vue"
import { getAvatarColor } from "@/lib/utils/avatarColor"

const props = defineProps<{
  displayName: string
  avatarUrl?: string | null
  email?: string | null
}>()

const initial = computed(() =>
  props.displayName.charAt(0).toUpperCase(),
)

const bgColor = computed(() => getAvatarColor(props.displayName))
</script>

<template>
  <div class="flex flex-1 items-center gap-3 text-dark">
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
      <div v-if="email" class="text-sm text-stone-600">{{ email }}</div>
    </div>
  </div>
</template>
