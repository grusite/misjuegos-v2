<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue"

defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/60"
        aria-label="Cerrar"
        @click="emit('cancel')"
      />

      <div class="relative w-full max-w-sm space-y-4 rounded-2xl border-4 border-primary bg-dark p-5">
        <h2 class="text-xl font-bold text-primary">{{ title }}</h2>
        <p class="text-sm text-gray-300">{{ message }}</p>

        <div class="flex gap-2">
          <UiButton
            type="button"
            variant="ghost"
            class="flex-1"
            @click="emit('cancel')"
          >
            {{ cancelLabel ?? "Cancelar" }}
          </UiButton>
          <UiButton
            type="button"
            variant="secondary"
            class="flex-1"
            @click="emit('confirm')"
          >
            {{ confirmLabel ?? "Confirmar" }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
