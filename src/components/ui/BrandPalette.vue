<script setup lang="ts">
const brandColors = [
  { name: "dark", class: "bg-dark border-gray-600", hex: "#0f0e17" },
  { name: "primary", class: "bg-primary border-dark", hex: "#facc15" },
  { name: "secondary", class: "bg-secondary border-dark", hex: "#f25f4c" },
  { name: "tertiary", class: "bg-tertiary border-dark", hex: "#e53170" },
] as const
</script>

<template>
  <section class="rounded-2xl border-4 border-dashed border-primary/40 p-6">
    <h2 class="mb-4 text-xl font-bold text-primary">Paleta MisJuegos</h2>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div v-for="color in brandColors" :key="color.name" class="space-y-2 text-center">
        <div
          class="mx-auto h-16 w-16 rounded-xl border-4"
          :class="color.class"
          :aria-label="color.name"
        />
        <p class="font-semibold capitalize">{{ color.name }}</p>
        <p class="text-sm text-gray-400">{{ color.hex }}</p>
      </div>
    </div>
  </section>
</template>
