<script setup lang="ts">
defineProps<{
  open: boolean
}>()
</script>

<template>
  <div
    class="hamburger flex w-6 flex-col gap-1"
    :class="{ open }"
  >
    <div class="h-[3px] w-full rounded bg-dark" />
    <div class="h-[3px] w-full rounded bg-dark" />
    <div class="h-[3px] w-full rounded bg-dark" />
  </div>
</template>

<style scoped>
.hamburger {
  transition: transform 0.2s ease-in-out;
}

.hamburger.open {
  transform: rotate(180deg);
}

.hamburger div {
  transition: 0.2s ease-in-out;
}

.hamburger.open div:nth-child(1) {
  transform: translate(0, 7px) rotate(45deg);
}

.hamburger.open div:nth-child(2) {
  opacity: 0;
}

.hamburger.open div:nth-child(3) {
  transform: translate(0, -7px) rotate(-45deg);
}
</style>
