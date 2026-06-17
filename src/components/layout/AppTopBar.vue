<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import HamburgerButton from "@/components/layout/HamburgerButton.vue"
import NavDrawer from "@/components/layout/NavDrawer.vue"
import { useUiStore } from "@/stores/uiStore"

const uiStore = useUiStore()
const menuButtonRef = ref<HTMLElement | null>(null)
const menuButtonPosition = ref({
  top: 0,
  left: 0,
  width: 40,
  height: 40,
})

function updateMenuButtonPosition() {
  const element = menuButtonRef.value
  if (!element) return

  const rect = element.getBoundingClientRect()
  menuButtonPosition.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

watch(
  () => uiStore.isNavOpen,
  isOpen => {
    if (!isOpen) return
    updateMenuButtonPosition()
  },
)

onMounted(() => {
  window.addEventListener("resize", updateMenuButtonPosition)
  window.addEventListener("scroll", updateMenuButtonPosition, true)
})

onUnmounted(() => {
  window.removeEventListener("resize", updateMenuButtonPosition)
  window.removeEventListener("scroll", updateMenuButtonPosition, true)
})

function handleLogoClick() {
  uiStore.notifyHomeClick()
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-dark/30 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md"
  >
    <div class="relative m-auto flex max-w-lg items-center justify-between gap-8">
      <RouterLink
        :to="{ name: 'sessions' }"
        class="shrink-0"
        aria-label="MisJuegos inicio"
        @click="handleLogoClick"
      >
        <img
          src="/logo.svg"
          alt=""
          class="h-10 w-6 text-primary"
        />
      </RouterLink>

      <NavDrawer
        :open="uiStore.isNavOpen"
        :source="menuButtonRef"
      />

      <button
        ref="menuButtonRef"
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark"
        :class="{ invisible: uiStore.isNavOpen }"
        :aria-expanded="uiStore.isNavOpen"
        :aria-label="uiStore.isNavOpen ? 'Cerrar menú' : 'Abrir menú'"
        :tabindex="uiStore.isNavOpen ? -1 : 0"
        @click="uiStore.toggleNav()"
      >
        <HamburgerButton :open="uiStore.isNavOpen" />
      </button>
    </div>
  </header>

  <Teleport to="body">
    <button
      v-if="uiStore.isNavOpen"
      type="button"
      class="fixed z-[110] flex items-center justify-center rounded-full bg-primary transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark"
      :style="{
        top: `${menuButtonPosition.top}px`,
        left: `${menuButtonPosition.left}px`,
        width: `${menuButtonPosition.width}px`,
        height: `${menuButtonPosition.height}px`,
      }"
      aria-expanded="true"
      aria-label="Cerrar menú"
      @click="uiStore.toggleNav()"
    >
      <HamburgerButton :open="true" />
    </button>
  </Teleport>
</template>
