<script setup lang="ts">
import { ref } from "vue"
import { Icon } from "@iconify/vue"
import UiButton from "@/components/ui/UiButton.vue"

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    compact?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    compact: false,
    placeholder: "Escribe un mensaje...",
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: string]
  send: [files: File[]]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const nextFiles = [...pendingFiles.value, ...Array.from(input.files)]
  pendingFiles.value = nextFiles
  previewUrls.value = nextFiles.map(file => URL.createObjectURL(file))
  input.value = ""
}

function removePendingFile(index: number) {
  pendingFiles.value = pendingFiles.value.filter((_, itemIndex) => itemIndex !== index)
  previewUrls.value = pendingFiles.value.map(file => URL.createObjectURL(file))
}

function canSend() {
  return props.modelValue.trim().length > 0 || pendingFiles.value.length > 0
}

function handleSend() {
  if (!canSend() || props.disabled) return

  emit("send", [...pendingFiles.value])
  pendingFiles.value = []
  previewUrls.value = []
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="previewUrls.length > 0"
      class="flex flex-wrap gap-2"
    >
      <figure
        v-for="(url, index) in previewUrls"
        :key="url"
        class="relative"
      >
        <img
          :src="url"
          alt=""
          class="h-16 w-16 rounded-lg border border-gray-700 object-cover"
        />
        <button
          type="button"
          class="absolute -right-1 -top-1 rounded-full bg-dark p-1 text-secondary"
          aria-label="Quitar imagen"
          :disabled="disabled"
          @click="removePendingFile(index)"
        >
          <Icon icon="mdi:close" class="h-3 w-3" aria-hidden="true" />
        </button>
      </figure>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        class="shrink-0 rounded-lg border-2 border-gray-600 px-3 py-2 text-gray-300 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        aria-label="Adjuntar imagen"
        :disabled="disabled"
        @click="openFilePicker"
      >
        <Icon icon="mdi:image-plus" class="h-5 w-5" aria-hidden="true" />
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        class="hidden"
        @change="handleFileChange"
      />

      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="min-w-0 flex-1 rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none disabled:opacity-50"
        :disabled="disabled"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="handleSend"
      />

      <UiButton
        :disabled="disabled || !canSend()"
        :size="compact ? 'compact' : 'default'"
        @click="handleSend"
      >
        Enviar
      </UiButton>
    </div>
  </div>
</template>
