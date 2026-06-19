<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useSpring } from "@/composables/useSpring"
import { vLongTap } from "@/directives/longTap"
import NumInput from "@/components/ui/NumInput.vue"

const num = ref(2)
const ready = ref(false)

const angleSpring = useSpring(0, { stiffness: 0.002, damping: 0.08 })
const boardSpring = useSpring(1, { stiffness: 0.1, damping: 0.13 })

watch(num, () => {
  ready.value = false
})

const steps = computed(() => {
  const stepAngle = 360 / num.value
  return Array.from({ length: num.value }, (_, index) => {
    const lineAngle = stepAngle * index
    return {
      lineAngle,
      nAngle: lineAngle + stepAngle / 2,
    }
  })
})

const active = computed(() => Math.floor((angleSpring.value.value % 360) / (360 / num.value)))

function turn() {
  angleSpring.add(360 * 3 + Math.random() * 360)
  ready.value = true
}

function onKeydown(event: KeyboardEvent) {
  if (event.code === "Space") {
    event.preventDefault()
    turn()
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown)
})
</script>

<template>
  <section class="flex flex-1 flex-col gap-4 pb-8">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Utilidades</p>
      <h1 class="text-3xl font-bold text-primary">Ruleta</h1>
      <p class="text-gray-400">
        Mantén pulsado o pulsa espacio para girar. El segmento activo se resalta al parar.
      </p>
    </div>

    <div
      v-long-tap="{
        start: () => boardSpring.set(0.9),
        end: () => boardSpring.set(1),
        action: turn,
      }"
      class="relative flex aspect-square w-full select-none rounded-full border-4 border-dashed border-primary p-2 transition-transform"
      :style="{ transform: `scale(${boardSpring.value.value})` }"
    >
      <div class="relative flex flex-1 items-center justify-center rounded-full bg-primary">
        <svg viewBox="0 0 100 100" class="absolute inset-0">
          <g
            :transform="`rotate(${angleSpring.value.value}) scale(0.7)`"
            style="transform-origin: center"
          >
            <polygon points="50,0 42,30 50,26 58,30" fill="#0f0e17" />
            <line x1="50" y1="20" x2="50" y2="90" stroke="#0f0e17" stroke-width="3" />
            <polygon points="45,99 45,85 50,80 55,85 55,99 50,95" fill="#0f0e17" />
          </g>

          <g v-for="(step, index) in steps" :key="index">
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="50"
              stroke="#0f0e17"
              stroke-width="0.2"
              :transform="`rotate(${step.lineAngle} 50 50)`"
            />
            <g :transform="`rotate(${step.nAngle} 50 50)`">
              <circle
                cx="50"
                cy="7"
                :r="ready && active === index ? 5.5 : 0"
                :fill="ready && active === index ? '#0f0e17' : '#facc15'"
                class="transition-all duration-700 ease-out"
              />
              <text
                x="50"
                y="9.5"
                font-size="8px"
                text-anchor="middle"
                :fill="ready && active === index ? '#facc15' : '#0f0e17'"
                class="transition-all duration-700 ease-out"
              >
                {{ index + 1 }}
              </text>
            </g>
          </g>

          <circle cx="50" cy="50" r="3.5" fill="#0f0e17" />
          <circle cx="50" cy="50" r="1.5" fill="#facc15" />
        </svg>
      </div>
    </div>

    <NumInput v-model="num" :min="2" :max="40" />
  </section>
</template>
