<script setup lang="ts">
import { useAuth } from "@/composables/useAuth"

const { profile } = useAuth()
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Partidas</p>
      <h1 class="text-3xl font-bold text-primary">
        Hola, {{ profile?.displayName }}
      </h1>
      <p class="text-gray-400">
        Lista de partidas y nueva sesión llegan en la Fase 5.
      </p>
    </div>
  </section>
</template>
