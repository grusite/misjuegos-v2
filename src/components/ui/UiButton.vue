<script setup lang="ts">
type UiButtonVariant = "primary" | "secondary" | "ghost"

const props = withDefaults(
  defineProps<{
    variant?: UiButtonVariant
    type?: "button" | "submit" | "reset"
    disabled?: boolean
  }>(),
  {
    variant: "primary",
    type: "button",
    disabled: false,
  },
)

const variantClasses: Record<UiButtonVariant, string> = {
  primary:
    "border-4 border-primary bg-primary text-dark hover:bg-primary/90 disabled:opacity-50",
  secondary:
    "border-4 border-secondary bg-secondary text-dark hover:bg-secondary/90 disabled:opacity-50",
  ghost:
    "border-4 border-gray-700 text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50",
}
</script>

<template>
  <button
    :type="props.type ?? 'button'"
    :disabled="props.disabled"
    class="rounded-lg px-6 py-3 text-lg font-medium transition-colors"
    :class="variantClasses[props.variant ?? 'primary']"
  >
    <slot />
  </button>
</template>
