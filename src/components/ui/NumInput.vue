<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { stepNumInput } from "@/lib/utils/numInput"

const num = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    skip?: number
  }>(),
  {
    min: 1,
    max: 40,
    skip: -1,
  },
)

function dec() {
  num.value = stepNumInput(num.value, "dec", {
    min: props.min,
    max: props.max,
    skip: props.skip,
  })
}

function inc() {
  num.value = stepNumInput(num.value, "inc", {
    min: props.min,
    max: props.max,
    skip: props.skip,
  })
}
</script>

<template>
  <div class="flex text-primary">
    <button
      type="button"
      class="px-6 transition-transform active:scale-125"
      aria-label="Disminuir"
      @click="dec"
    >
      <Icon icon="ph:minus-bold" class="h-12 w-12" aria-hidden="true" />
    </button>
    <div class="flex-1 text-center text-6xl font-bold">{{ num }}</div>
    <button
      type="button"
      class="px-6 transition-transform active:scale-125"
      aria-label="Aumentar"
      @click="inc"
    >
      <Icon icon="ph:plus-bold" class="h-12 w-12" aria-hidden="true" />
    </button>
  </div>
</template>
