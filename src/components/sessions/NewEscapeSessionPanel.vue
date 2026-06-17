<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import SessionParticipantPicker from "@/components/sessions/SessionParticipantPicker.vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { EscapeRoomCatalogEntry } from "@/domain/types/catalog"
import type { Participant } from "@/domain/types/participant"

const props = defineProps<{
  participants: Participant[]
  selfParticipantId?: string | null
  escapeCatalog: EscapeRoomCatalogEntry[]
  isSaving?: boolean
  createParticipant?: (displayName: string) => Promise<Participant | null>
}>()

const emit = defineEmits<{
  submit: [
    payload: {
      catalogId?: string | null
      title: string
      city?: string
      venue?: string
      company?: string
      notes?: string
      selectedParticipants: string[]
    },
  ]
  cancel: []
}>()

const form = reactive({
  mode: "existing" as "existing" | "new",
  catalogId: "",
  title: "",
  city: "",
  venue: "",
  company: "",
  notes: "",
  selectedParticipants: [] as string[],
})

watch(
  () => [props.participants, props.selfParticipantId] as const,
  ([participants, selfParticipantId]) => {
    if (form.selectedParticipants.length > 0) return

    const defaultId = selfParticipantId ?? participants[0]?.id
    if (defaultId) form.selectedParticipants = [defaultId]
  },
  { immediate: true },
)

watch(
  () => form.catalogId,
  catalogId => {
    if (!catalogId || form.mode !== "existing") return

    const entry = props.escapeCatalog.find(room => room.id === catalogId)
    if (!entry) return

    form.title = entry.title
    form.city = entry.escapeRoomDetails.city ?? ""
    form.venue = entry.escapeRoomDetails.venue ?? ""
    form.company = entry.escapeRoomDetails.company ?? ""
  },
)

const canSubmit = computed(() => {
  if (form.mode === "existing") return form.catalogId.length > 0
  return form.title.trim().length > 0
})

function handleSubmit() {
  if (!canSubmit.value) return

  emit("submit", {
    catalogId: form.mode === "existing" ? form.catalogId : null,
    title: form.title.trim(),
    city: form.city.trim() || undefined,
    venue: form.venue.trim() || undefined,
    company: form.company.trim() || undefined,
    notes: form.notes.trim() || undefined,
    selectedParticipants: form.selectedParticipants,
  })
}
</script>

<template>
  <section class="space-y-4 rounded-2xl border-4 border-tertiary bg-dark p-4">
    <h2 class="text-2xl font-bold text-tertiary">Nueva escape room</h2>

    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors"
        :class="
          form.mode === 'existing'
            ? 'border-tertiary bg-tertiary text-dark'
            : 'border-gray-700 text-gray-400'
        "
        @click="form.mode = 'existing'"
      >
        Sala existente
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors"
        :class="
          form.mode === 'new'
            ? 'border-tertiary bg-tertiary text-dark'
            : 'border-gray-700 text-gray-400'
        "
        @click="form.mode = 'new'"
      >
        Sala nueva
      </button>
    </div>

    <label v-if="form.mode === 'existing'" class="block space-y-2">
      <span class="text-sm text-gray-400">Catálogo de escape rooms</span>
      <select
        v-model="form.catalogId"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-tertiary focus:outline-none"
      >
        <option value="">Selecciona una sala...</option>
        <option v-for="room in escapeCatalog" :key="room.id" :value="room.id">
          {{ room.title }}
          <template v-if="room.escapeRoomDetails.city">
            — {{ room.escapeRoomDetails.city }}
          </template>
        </option>
      </select>
      <p v-if="escapeCatalog.length === 0" class="text-xs text-gray-500">
        No hay salas guardadas. Crea una nueva.
      </p>
    </label>

    <template v-if="form.mode === 'new' || form.catalogId">
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Nombre de la sala</span>
        <input
          v-model="form.title"
          type="text"
          :readonly="form.mode === 'existing'"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-tertiary focus:outline-none read-only:opacity-70"
          placeholder="Ej. La Maldición del Faraón"
        />
        <p class="text-xs text-gray-500">
          Nombre de la experiencia en el catálogo (como en BoardGameGeek o la web del local).
        </p>
      </label>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block space-y-2">
          <span class="text-sm text-gray-400">Ciudad</span>
          <input
            v-model="form.city"
            type="text"
            :readonly="form.mode === 'existing'"
            class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-tertiary focus:outline-none read-only:opacity-70"
            placeholder="Madrid"
          />
        </label>
        <label class="block space-y-2">
          <span class="text-sm text-gray-400">Sitio</span>
          <input
            v-model="form.venue"
            type="text"
            :readonly="form.mode === 'existing'"
            class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-tertiary focus:outline-none read-only:opacity-70"
            placeholder="The City"
          />
        </label>
      </div>

      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Empresa (opcional)</span>
        <input
          v-model="form.company"
          type="text"
          :readonly="form.mode === 'existing'"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-tertiary focus:outline-none read-only:opacity-70"
          placeholder="Nombre de la franquicia o local"
        />
      </label>
    </template>

    <SessionParticipantPicker
      v-model="form.selectedParticipants"
      :participants="participants"
      :self-participant-id="selfParticipantId"
      :create-participant="createParticipant"
      accent="tertiary"
    />

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Notas (opcional)</span>
      <textarea
        v-model="form.notes"
        rows="3"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-tertiary focus:outline-none"
        placeholder="Detalles de la sesión..."
      />
    </label>

    <div class="flex gap-2">
      <UiButton
        type="button"
        variant="tertiary"
        class="flex-1"
        :disabled="!canSubmit || isSaving"
        @click="handleSubmit"
      >
        {{ isSaving ? "Guardando..." : "Crear escape" }}
      </UiButton>
      <UiButton type="button" variant="ghost" @click="emit('cancel')">
        Cancelar
      </UiButton>
    </div>
  </section>
</template>
