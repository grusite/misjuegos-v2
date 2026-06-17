<script setup lang="ts">
const search = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <label class="block">
    <span class="sr-only">{{ placeholder ?? "Buscar" }}</span>
    <input
      v-model="search"
      type="search"
      class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:border-primary focus:outline-none"
      :placeholder="placeholder ?? 'Buscar'"
    />
  </label>
</template>
