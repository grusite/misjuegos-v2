<script setup lang="ts">
type UiButtonVariant = "primary" | "secondary" | "tertiary" | "board" | "ghost"

const props = withDefaults(
  defineProps<{
    variant?: UiButtonVariant
    size?: "default" | "compact"
    type?: "button" | "submit" | "reset"
    disabled?: boolean
  }>(),
  {
    variant: "primary",
    size: "default",
    type: "button",
    disabled: false,
  },
)

const variantClasses: Record<UiButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-dark hover:bg-primary/90 disabled:opacity-50",
  secondary:
    "border-secondary bg-secondary text-dark hover:bg-secondary/90 disabled:opacity-50",
  tertiary:
    "border-tertiary bg-tertiary text-dark hover:bg-tertiary/90 disabled:opacity-50",
  board:
    "border-board bg-board text-dark hover:bg-board/90 disabled:opacity-50",
  ghost:
    "border-gray-700 text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50",
}

const sizeClasses: Record<"default" | "compact", string> = {
  default: "rounded-lg border-4 px-6 py-3 text-lg font-medium",
  compact: "rounded-lg border-2 px-4 py-2 text-sm font-semibold",
}
</script>

<template>
  <button
    :type="props.type ?? 'button'"
    :disabled="props.disabled"
    class="transition-colors"
    :class="[sizeClasses[props.size ?? 'default'], variantClasses[props.variant ?? 'primary']]"
  >
    <slot />
  </button>
</template>
