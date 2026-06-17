<script setup lang="ts">
import { RouterView } from "vue-router"
import AppTopBar from "@/components/layout/AppTopBar.vue"
</script>

<template>
  <div class="min-h-screen bg-dark">
    <AppTopBar />

    <main class="m-auto min-h-screen max-w-lg p-4 pt-20">
      <RouterView />
    </main>
  </div>
</template>
