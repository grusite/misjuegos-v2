<script setup lang="ts">
import { ref } from "vue"
import { RouterLink } from "vue-router"
import HamburgerButton from "@/components/layout/HamburgerButton.vue"
import NavDrawer from "@/components/layout/NavDrawer.vue"
import { useScrollHeader } from "@/composables/useScrollHeader"
import { useUiStore } from "@/stores/uiStore"

const uiStore = useUiStore()
const menuButtonRef = ref<HTMLElement | null>(null)
const { isScrolled } = useScrollHeader()
</script>

<template>
  <div class="fixed inset-x-0 top-0 z-30 p-4 transition-[background-color,backdrop-filter] duration-300">
    <div class="relative m-auto flex max-w-lg items-start justify-between gap-8">
      <div
        class="absolute inset-0 backdrop-blur-sm transition-colors duration-300"
        :class="isScrolled ? 'bg-dark/40' : 'bg-dark/80'"
      />

      <RouterLink
        to="/"
        class="relative z-50"
        aria-label="MisJuegos inicio"
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
        class="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark"
        :aria-expanded="uiStore.isNavOpen"
        :aria-label="uiStore.isNavOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="uiStore.toggleNav()"
      >
        <HamburgerButton :open="uiStore.isNavOpen" />
      </button>
    </div>
  </div>
</template>
