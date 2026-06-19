<script setup lang="ts">
import { computed, ref } from "vue"
import { Icon } from "@iconify/vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { AppPhoto } from "@/domain/types/photo"

const props = withDefaults(
  defineProps<{
    authorDisplayName: string
    content: string
    createdAt: string
    photos?: AppPhoto[]
    compact?: boolean
    canManage?: boolean
    isSaving?: boolean
  }>(),
  {
    photos: () => [],
    compact: false,
    canManage: false,
    isSaving: false,
  },
)

const emit = defineEmits<{
  save: [content: string]
  delete: []
}>()

const isEditing = ref(false)
const draft = ref("")
const expandedPhotoUrl = ref<string | null>(null)

const hasVisibleText = computed(() => props.content.trim().length > 0)

function formatMessageDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", props.compact
    ? { timeStyle: "short" }
    : { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(isoDate))
}

function startEdit() {
  draft.value = props.content
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  draft.value = ""
}

function saveEdit() {
  const normalized = draft.value.trim()
  if (!normalized && props.photos.length === 0) return

  emit("save", normalized)
  isEditing.value = false
  draft.value = ""
}
</script>

<template>
  <article class="rounded-lg border border-gray-700 bg-dark/60 p-3">
    <div class="mb-1 flex items-baseline justify-between gap-2">
      <p class="truncate text-xs font-semibold text-primary">
        {{ authorDisplayName }}
      </p>
      <div class="flex shrink-0 items-center gap-1">
        <time class="text-xs text-gray-500" :datetime="createdAt">
          {{ formatMessageDate(createdAt) }}
        </time>
        <template v-if="canManage && !isEditing">
          <button
            type="button"
            class="rounded p-1 text-gray-500 transition-colors hover:text-primary disabled:opacity-50"
            aria-label="Editar mensaje"
            :disabled="isSaving"
            @click="startEdit"
          >
            <Icon icon="mdi:pencil-outline" class="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded p-1 text-gray-500 transition-colors hover:text-secondary disabled:opacity-50"
            aria-label="Eliminar mensaje"
            :disabled="isSaving"
            @click="emit('delete')"
          >
            <Icon icon="mdi:trash-can-outline" class="h-4 w-4" aria-hidden="true" />
          </button>
        </template>
      </div>
    </div>

    <div v-if="isEditing" class="space-y-2">
      <textarea
        v-model="draft"
        rows="2"
        maxlength="2000"
        class="w-full rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none"
        :disabled="isSaving"
        @keydown.enter.exact.prevent="saveEdit"
      />
      <div class="flex justify-end gap-2">
        <UiButton
          type="button"
          variant="ghost"
          size="compact"
          :disabled="isSaving"
          @click="cancelEdit"
        >
          Cancelar
        </UiButton>
        <UiButton
          type="button"
          variant="primary"
          size="compact"
          :disabled="isSaving || (!draft.trim() && photos.length === 0)"
          @click="saveEdit"
        >
          Guardar
        </UiButton>
      </div>
    </div>

    <template v-else>
      <p v-if="hasVisibleText" class="text-sm text-gray-100">{{ content }}</p>

      <div
        v-if="photos.length > 0"
        class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        <button
          v-for="photo in photos"
          :key="photo.id"
          type="button"
          class="overflow-hidden rounded-lg border border-gray-700"
          @click="expandedPhotoUrl = photo.publicUrl"
        >
          <img
            :src="photo.publicUrl"
            :alt="photo.caption ?? 'Imagen del mensaje'"
            class="aspect-square w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="expandedPhotoUrl"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
        role="dialog"
        aria-modal="true"
        @click="expandedPhotoUrl = null"
      >
        <img
          :src="expandedPhotoUrl"
          alt="Vista ampliada"
          class="max-h-[90vh] max-w-full rounded-lg object-contain"
          @click.stop
        />
      </div>
    </Teleport>
  </article>
</template>
