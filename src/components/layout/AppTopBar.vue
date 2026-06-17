<script setup lang="ts">
import { ref } from "vue"
import { RouterLink } from "vue-router"
import HamburgerButton from "@/components/layout/HamburgerButton.vue"
import NavDrawer from "@/components/layout/NavDrawer.vue"
import { useUiStore } from "@/stores/uiStore"

const uiStore = useUiStore()
const menuButtonRef = ref<HTMLElement | null>(null)

function handleLogoClick() {
  uiStore.notifyHomeClick()
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 border-b border-white/5 bg-dark/30 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md"
    :class="uiStore.isNavOpen ? 'z-[100]' : 'z-40'"
  >
    <div class="relative m-auto flex max-w-lg items-center justify-between gap-8">
      <RouterLink
        :to="{ name: 'sessions' }"
        class="relative z-[1] shrink-0"
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
        class="relative z-[2] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark"
        :aria-expanded="uiStore.isNavOpen"
        :aria-label="uiStore.isNavOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="uiStore.toggleNav()"
      >
        <HamburgerButton :open="uiStore.isNavOpen" />
      </button>
    </div>
  </header>
</template>
