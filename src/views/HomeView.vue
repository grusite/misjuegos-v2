<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue"
import BrandPalette from "@/components/ui/BrandPalette.vue"
import { useAuth } from "@/composables/useAuth"

const { profile } = useAuth()
</script>

<template>
  <AppShell>
    <section class="space-y-8">
      <div class="space-y-2">
        <p class="text-sm uppercase tracking-widest text-secondary">Fase 1</p>
        <h1 class="text-3xl font-bold text-primary">
          Hola, {{ profile?.displayName }}
        </h1>
        <p class="text-gray-400">
          Supabase local, perfiles y Google OAuth listos. Siguiente: capa de
          repositorios.
        </p>
      </div>

      <BrandPalette />

      <div class="rounded-2xl border-4 border-dashed border-tertiary/50 p-6">
        <h2 class="mb-2 text-lg font-bold text-tertiary">Próximas fases</h2>
        <ul class="list-inside list-disc space-y-1 text-gray-300">
          <li>Fase 2 — Repositorios</li>
          <li>Fase 5 — Partidas, mensajes y puntuaciones</li>
          <li>Fase 8 — Import Escape Babel</li>
        </ul>
      </div>
    </section>
  </AppShell>
</template>
