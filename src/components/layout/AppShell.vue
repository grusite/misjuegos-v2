<script setup lang="ts">
import { RouterView } from "vue-router"
import AppTopBar from "@/components/layout/AppTopBar.vue"
</script>

<template>
  <div class="min-h-screen bg-dark">
    <AppTopBar />

    <main class="m-auto min-h-screen max-w-lg scroll-pt-24 p-4 pt-[calc(4.75rem+env(safe-area-inset-top))]">
      <RouterView />
    </main>
  </div>
</template>
