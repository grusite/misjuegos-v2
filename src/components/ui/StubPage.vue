<script setup lang="ts">
defineProps<{
  title: string
  phase: string
  description?: string
}>()
</script>

<template>
  <section class="space-y-4 py-8">
    <p class="text-sm uppercase tracking-widest text-gray-500">{{ phase }}</p>
    <h1 class="text-3xl font-bold text-primary">{{ title }}</h1>
    <p class="text-gray-400">
      {{
        description ??
          "Esta sección llegará en una fase posterior. El menú ya está conectado."
      }}
    </p>
  </section>
</template>
