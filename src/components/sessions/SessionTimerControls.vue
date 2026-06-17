<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import { outcomeToneStyles } from "@/lib/utils/outcomeStyles"

const props = defineProps<{
  isPaused: boolean
  disabled?: boolean
  isSaving?: boolean
  canWrite?: boolean
}>()

const emit = defineEmits<{
  start: []
  pause: []
  reset: []
}>()

const isDisabled = computed(() => !props.canWrite || props.isSaving || props.disabled)

const controls = computed(() => [
  {
    key: "start",
    label: "Iniciar",
    icon: "mdi:play",
    tone: "success" as const,
    active: props.isPaused,
    disabled: isDisabled.value || !props.isPaused,
    handler: () => emit("start"),
  },
  {
    key: "pause",
    label: "Pausar",
    icon: "mdi:pause",
    tone: "failure" as const,
    active: !props.isPaused,
    disabled: isDisabled.value || props.isPaused,
    handler: () => emit("pause"),
  },
  {
    key: "reset",
    label: "Reset",
    icon: "mdi:backup-restore",
    tone: "unknown" as const,
    active: false,
    disabled: isDisabled.value,
    handler: () => emit("reset"),
  },
])

function buttonClasses(
  tone: keyof typeof outcomeToneStyles,
  active: boolean,
) {
  if (active) return outcomeToneStyles[tone].selected

  return `border-gray-700 text-gray-400 ${outcomeToneStyles[tone].idle}`
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="control in controls"
      :key="control.key"
      type="button"
      class="flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors disabled:opacity-50"
      :class="buttonClasses(control.tone, control.active)"
      :disabled="control.disabled"
      :aria-label="control.label"
      :aria-pressed="control.active"
      @click="control.handler"
    >
      <Icon
        :icon="control.icon"
        class="h-5 w-5 shrink-0"
        aria-hidden="true"
      />
      <span>{{ control.label }}</span>
    </button>
  </div>
</template>
