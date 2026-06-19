<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef } from "vue"
import { Icon } from "@iconify/vue"
import DiceTypeControl from "@/components/tools/DiceTypeControl.vue"
import NumInput from "@/components/ui/NumInput.vue"
import { useSpring } from "@/composables/useSpring"
import { vLongTap } from "@/directives/longTap"
import type { DiceLauncher, DiceType } from "@/lib/dice/diceLauncher"

const diceContainerRef = ref<HTMLDivElement | null>(null)
const diceLauncher = shallowRef<DiceLauncher | null>(null)
const num = ref(4)
const diceType = ref<DiceType>(6)
const thrown = ref(false)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

const boardSpring = useSpring(1, { stiffness: 0.1, damping: 0.13 })

async function initDiceLauncher() {
  if (!diceContainerRef.value || diceLauncher.value) return

  try {
    const { DiceLauncher: Launcher } = await import("@/lib/dice/diceLauncher")
    diceLauncher.value = new Launcher(diceContainerRef.value)
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : "No se pudo cargar el tirador de dados"
  } finally {
    isLoading.value = false
  }
}

function throwDices() {
  if (!diceLauncher.value) return

  thrown.value = true
  diceLauncher.value.throw(diceType.value, num.value)
}

function onKeydown(event: KeyboardEvent) {
  if (event.code === "Space") {
    event.preventDefault()
    throwDices()
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown)
  await nextTick()
  await initDiceLauncher()
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown)
  diceLauncher.value?.dispose()
  diceLauncher.value = null
})
</script>

<template>
  <section class="flex flex-1 flex-col gap-4 pb-10">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Utilidades</p>
      <h1 class="text-3xl font-bold text-primary">Dados</h1>
      <p class="text-gray-400">
        Toca el tablero, mantén pulsado o pulsa espacio para lanzar.
      </p>
    </div>

    <DiceTypeControl v-model="diceType" />

    <div
      v-long-tap="{
        start: () => boardSpring.set(0.9),
        end: () => boardSpring.set(1),
        action: () => {},
      }"
      class="flex cursor-pointer select-none transition-transform"
      :style="{ transform: `scale(${boardSpring.value.value})` }"
      role="button"
      tabindex="0"
      aria-label="Lanzar dados"
      @click="throwDices"
      @keydown.enter.prevent="throwDices"
    >
      <div class="relative flex w-full rounded-2xl border-4 border-dashed border-primary p-2">
        <div
          v-if="!thrown && !isLoading && !loadError"
          class="absolute inset-0 grid place-items-center text-dark"
        >
          <Icon icon="fluent:tap-single-24-regular" class="h-24 w-24" aria-hidden="true" />
        </div>

        <p
          v-if="isLoading"
          class="absolute inset-0 grid place-items-center text-sm text-dark"
        >
          Cargando dados 3D...
        </p>

        <p
          v-if="loadError"
          class="absolute inset-0 grid place-items-center p-4 text-center text-sm text-secondary"
        >
          {{ loadError }}
        </p>

        <div
          ref="diceContainerRef"
          class="aspect-square w-full overflow-hidden rounded-lg bg-primary"
        />
      </div>
    </div>

    <NumInput v-model="num" :min="1" :max="12" />
  </section>
</template>
