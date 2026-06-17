<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useAuth } from "@/composables/useAuth"
import { useUiStore } from "@/stores/uiStore"

const { profile, logout } = useAuth()
const uiStore = useUiStore()

const navLinks = [
  { name: "Partidas", to: "/", disabled: false },
  { name: "Amigos", to: "/participants", disabled: true },
  { name: "Dashboard", to: "/dashboard", disabled: true },
] as const
</script>

<template>
  <div class="min-h-screen bg-dark">
    <header
      class="fixed inset-x-0 top-0 z-30 border-b-4 border-dashed border-primary/30 bg-dark/95 backdrop-blur-sm"
    >
      <div class="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border-4 border-primary text-primary"
          aria-label="Abrir menú"
          @click="uiStore.toggleNav()"
        >
          <span class="text-xl leading-none">☰</span>
        </button>

        <RouterLink to="/" class="flex items-center gap-2">
          <img src="/logo.svg" alt="" class="h-8 w-5" />
          <span class="text-lg font-bold text-primary">MisJuegos</span>
        </RouterLink>

        <button
          type="button"
          class="rounded-lg px-3 py-1 text-sm text-gray-400 hover:text-primary"
          @click="logout"
        >
          Salir
        </button>
      </div>
    </header>

    <nav
      v-show="uiStore.isNavOpen"
      class="fixed inset-0 z-40 flex bg-primary"
    >
      <button
        type="button"
        class="absolute inset-0"
        aria-label="Cerrar menú"
        @click="uiStore.closeNav()"
      />

      <div class="relative mx-auto flex w-full max-w-lg flex-col p-6 pt-24">
        <img src="/logo.svg" alt="MisJuegos" class="mb-8 h-12 w-8" />

        <ul class="flex flex-1 flex-col gap-2">
          <li v-for="link in navLinks" :key="link.name">
            <RouterLink
              v-if="!link.disabled"
              :to="link.to"
              class="block rounded-lg border-4 border-transparent p-4 text-2xl font-bold text-dark hover:border-dark"
              @click="uiStore.closeNav()"
            >
              {{ link.name }}
            </RouterLink>
            <span
              v-else
              class="block p-4 text-2xl font-bold text-dark/40"
              title="Próximamente"
            >
              {{ link.name }}
            </span>
          </li>
        </ul>

        <div class="border-t-4 border-dashed border-dark pt-4 text-dark">
          <p class="font-semibold">{{ profile?.displayName }}</p>
          <p class="text-sm opacity-70">Sesión con Google</p>
        </div>
      </div>
    </nav>

    <main class="mx-auto min-h-screen max-w-lg px-4 pb-8 pt-24">
      <slot />
    </main>
  </div>
</template>
