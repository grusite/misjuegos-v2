<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { outcomeToneStyles } from "@/lib/utils/outcomeStyles"

const props = defineProps<{
  modelValue: boolean | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean | null]
}>()

const options: Array<{
  value: boolean | null
  label: string
  icon: string
  tone: keyof typeof outcomeToneStyles
}> = [
  {
    value: true,
    label: "Escapamos",
    icon: "mdi:door-open",
    tone: "success",
  },
  {
    value: false,
    label: "No escapamos",
    icon: "mdi:door-closed-lock",
    tone: "failure",
  },
  {
    value: null,
    label: "Sin definir",
    icon: "mdi:help-circle-outline",
    tone: "unknown",
  },
]

function select(value: boolean | null) {
  if (props.disabled) return
  emit("update:modelValue", value)
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="option in options"
      :key="String(option.value)"
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
