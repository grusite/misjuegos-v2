<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import UiButton from "@/components/ui/UiButton.vue"
import { useAuth } from "@/composables/useAuth"

const router = useRouter()
const { loginMock } = useAuth()

const isLoading = ref(false)

async function handleGoogleLogin() {
  isLoading.value = true
  // Placeholder until Supabase Google OAuth is wired in Phase 1.
  loginMock("Usuario demo")
  await router.push({ name: "home" })
  isLoading.value = false
}
</script>

<template>
  <main class="fixed inset-0 flex flex-col items-center justify-center gap-12 bg-dark p-6">
    <div class="flex flex-col items-center gap-4 text-center">
      <img src="/logo.svg" alt="MisJuegos" class="w-28" />
      <h1 class="text-3xl font-bold text-primary">MisJuegos</h1>
      <p class="max-w-sm text-gray-400">
        Partidas de juegos de mesa y escape rooms con amigos.
      </p>
    </div>

    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiButton
        class="w-full"
        :disabled="isLoading"
        @click="handleGoogleLogin"
      >
        {{ isLoading ? "Entrando…" : "Entrar con Google" }}
      </UiButton>

      <p class="text-center text-sm text-gray-500">
        OAuth real en Fase 1. Por ahora usa login demo para probar el router.
      </p>
    </div>
  </main>
</template>
