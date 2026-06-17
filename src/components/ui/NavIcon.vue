<script setup lang="ts">
import { Icon } from "@iconify/vue"

defineProps<{
  icon: string
}>()
</script>

<template>
  <Icon
    :icon="icon"
    class="h-7 w-7 shrink-0"
    aria-hidden="true"
  />
</template>
