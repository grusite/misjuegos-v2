<script setup lang="ts">
import { Icon } from "@iconify/vue"
import type { SessionOutcome } from "@/domain/types/rows"
import { outcomeToneStyles } from "@/lib/utils/outcomeStyles"

const props = defineProps<{
  modelValue: SessionOutcome | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: SessionOutcome]
}>()

const options: Array<{
  value: SessionOutcome
  label: string
  icon: string
  tone: keyof typeof outcomeToneStyles
}> = [
  {
    value: "win",
    label: "Victoria",
    icon: "mdi:trophy",
    tone: "success",
  },
  {
    value: "loss",
    label: "Derrota",
    icon: "mdi:thumb-down-outline",
    tone: "failure",
  },
  {
    value: "draw",
    label: "Empate",
    icon: "mdi:handshake-outline",
    tone: "neutral",
  },
  {
    value: "unknown",
    label: "Sin definir",
    icon: "mdi:help-circle-outline",
    tone: "unknown",
  },
]

function select(value: SessionOutcome) {
  if (props.disabled) return
  emit("update:modelValue", value)
}
</script>

<template>
  <div class="grid grid-cols-4 gap-2">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors disabled:opacity-50"
      :class="
        modelValue === option.value
          ? outcomeToneStyles[option.tone].selected
          : `border-gray-700 text-gray-400 ${outcomeToneStyles[option.tone].idle}`
      "
      :disabled="disabled"
      :aria-pressed="modelValue === option.value"
      @click="select(option.value)"
    >
      <Icon :icon="option.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>
