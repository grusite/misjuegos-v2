<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue"
import UiButton from "@/components/ui/UiButton.vue"

const durationMs = 60_000

const startAt = ref(0)
const active = ref(false)
const rotating = ref(false)
const isInitializing = ref(false)
const delta = ref(1)
let frameId: number | null = null

const remainingSeconds = computed(() =>
  ((durationMs - delta.value * durationMs) / 1000).toFixed(2),
)

function stop() {
  active.value = false
  rotating.value = false
  isInitializing.value = false
  startAt.value = 0
  delta.value = 1

  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }
}

function loop() {
  delta.value = Math.min(1, (Date.now() - startAt.value) / durationMs)

  if (delta.value < 1 && active.value) {
    frameId = requestAnimationFrame(loop)
  } else {
    stop()
  }
}

function start() {
  if (isInitializing.value) return

  isInitializing.value = true
  rotating.value = true

  window.setTimeout(() => {
    delta.value = 0
    rotating.value = false

    window.setTimeout(() => {
      startAt.value = Date.now()
      active.value = true
      isInitializing.value = false
      loop()
    }, 300)
  }, 600)
}

onUnmounted(() => {
  stop()
})
</script>

<template>
  <section class="space-y-6 pb-10">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Utilidades</p>
      <h1 class="text-3xl font-bold text-primary">Cuenta atrás</h1>
      <p class="text-gray-400">Temporizador de arena de 60 segundos.</p>
    </div>

    <div class="aspect-square w-full rounded-2xl border-4 border-dashed border-primary p-2">
      <div class="overflow-hidden rounded-lg bg-primary">
        <svg
          viewBox="0 0 100 100"
          class="w-full"
          :class="{ 'sand-timer-rotating': rotating }"
        >
          <mask id="sand">
            <polygon
              points="40,10 60,10 60,40 51,50 60,60 60,90 40,90 40,60 49,50 40,40"
              stroke="white"
              stroke-width="2"
              stroke-linejoin="round"
              fill="white"
            />
          </mask>
          <mask id="sand-top">
            <polygon
              points="40,10 60,10 60,40 51,50 49,50 40,40"
              stroke="white"
              stroke-width="0"
              stroke-linejoin="round"
              fill="white"
            />
          </mask>
          <mask id="sand-bottom">
            <polygon
              points="51,50 60,60 60,90 40,90 40,60 49,50"
              stroke="white"
              stroke-width="2"
              stroke-linejoin="round"
              fill="white"
            />
          </mask>
          <polygon
            points="40,10 60,10 60,40 51,50 60,60 60,90 40,90 40,60 49,50 40,40"
            stroke="#0f0e17"
            stroke-width="13"
            stroke-linejoin="round"
            fill="#0f0e17"
          />
          <g mask="url(#sand-top)">
            <rect
              x="0"
              y="0"
              :transform="`translate(0, ${15 + 35 * delta})`"
              width="100"
              height="100"
              fill="#facc15"
            />
          </g>
          <g mask="url(#sand-bottom)">
            <line
              class="sand-timer-line"
              :class="{ 'sand-timer-dash': active }"
              x2="50"
              y2="100"
              x1="50"
              y1="50"
              stroke-width="1"
              stroke-dasharray="2"
              stroke="#facc15"
              :opacity="active ? 1 : 0"
            />
            <polygon
              points="35,5 50,0 65,5 65,100 35,100"
              :transform="`translate(0, ${91 - 32 * delta})`"
              fill="#facc15"
            />
          </g>
        </svg>
      </div>
    </div>

    <p class="text-center text-4xl text-primary">{{ remainingSeconds }}</p>

    <div class="flex justify-center gap-4">
      <UiButton
        type="button"
        variant="primary"
        class="px-6 py-3 text-lg"
        :disabled="active || isInitializing"
        @click="start"
      >
        Iniciar
      </UiButton>
      <UiButton
        type="button"
        variant="ghost"
        class="border-2 border-primary px-6 py-3 text-lg text-primary"
        :disabled="!active"
        @click="stop"
      >
        Parar
      </UiButton>
    </div>
  </section>
</template>

<style scoped>
.sand-timer-rotating {
  animation: sand-timer-flip 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes sand-timer-flip {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}

.sand-timer-dash {
  animation: sand-timer-dash 400ms infinite linear;
}

@keyframes sand-timer-dash {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -4;
  }
}
</style>
