<script setup lang="ts">
import { ref } from "vue"
import UiButton from "@/components/ui/UiButton.vue"
import { useAuth } from "@/composables/useAuth"

const { loginWithGoogle, isLoading } = useAuth()

const errorMessage = ref<string | null>(null)

async function handleGoogleLogin() {
  errorMessage.value = null

  try {
    await loginWithGoogle()
  } catch {
    errorMessage.value =
      "No se pudo iniciar sesión. Comprueba la configuración de Google OAuth."
  }
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

      <p
        v-if="errorMessage"
        class="text-center text-sm text-secondary"
        role="alert"
      >
        {{ errorMessage }}
      </p>
    </div>
  </main>
</template>
