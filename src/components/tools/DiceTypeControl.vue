<script setup lang="ts">
import type { DiceType } from "@/lib/dice/diceLauncher"

const diceTypes = [4, 6, 8, 10, 12, 20] as const satisfies readonly DiceType[]

defineProps<{
  modelValue: DiceType
}>()

const emit = defineEmits<{
  "update:modelValue": [value: DiceType]
}>()
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
    <button
      v-for="type in diceTypes"
      :key="type"
      type="button"
      class="rounded-lg p-2 text-lg font-bold transition-colors duration-300"
      :class="
        modelValue === type
          ? 'bg-primary text-dark'
          : 'border-2 border-gray-700 text-primary hover:border-primary'
      "
      :aria-pressed="modelValue === type"
      @click="emit('update:modelValue', type)"
    >
      D{{ type }}
    </button>
  </div>
</template>
