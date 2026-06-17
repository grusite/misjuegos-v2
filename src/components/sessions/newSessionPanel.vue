<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import SessionParticipantPicker from "@/components/sessions/SessionParticipantPicker.vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { Participant } from "@/domain/types/participant"
import type { BggSearchResult } from "@/services/bgg/bggService"

const props = defineProps<{
  participants: Participant[]
  selfParticipantId?: string | null
  bggResults: BggSearchResult[]
  isSaving?: boolean
  createParticipant?: (displayName: string) => Promise<Participant | null>
}>()

const emit = defineEmits<{
  searchBgg: [query: string]
  submit: [
    payload: {
      title: string
      notes?: string
      selectedParticipants: string[]
      bggSelection?: BggSearchResult | null
    },
  ]
  cancel: []
}>()

const form = reactive({
  title: "",
  notes: "",
  bggQuery: "",
  selectedParticipants: [] as string[],
  bggSelectionId: "",
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

const selectedBgg = computed(() =>
  props.bggResults.find(result => String(result.bggId) === form.bggSelectionId) ?? null,
)

const canSubmit = computed(() => form.title.trim().length > 0)

function handleSubmit() {
  if (!canSubmit.value) return

  emit("submit", {
    title: form.title,
    notes: form.notes,
    selectedParticipants: form.selectedParticipants,
    bggSelection: selectedBgg.value,
  })
}
</script>

<template>
  <section class="space-y-4 rounded-2xl border-4 border-board bg-dark p-4">
    <h2 class="text-2xl font-bold text-board">Nueva partida</h2>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Nombre del juego</span>
      <input
        v-model="form.title"
        type="text"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-board focus:outline-none"
        placeholder="Ej. Azul, Terraforming Mars..."
      />
    </label>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Buscar en BGG (opcional)</span>
      <div class="flex gap-2">
        <input
          v-model="form.bggQuery"
          type="search"
          class="min-w-0 flex-1 rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-board focus:outline-none"
          placeholder="BoardGameGeek search..."
        />
        <UiButton
          type="button"
          variant="ghost"
          class="!px-4 !py-2 !text-base"
          @click="emit('searchBgg', form.bggQuery)"
        >
          Buscar
        </UiButton>
      </div>
      <select
        v-if="bggResults.length > 0"
        v-model="form.bggSelectionId"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-board focus:outline-none"
      >
        <option value="">Sin selección</option>
        <option
          v-for="result in bggResults"
          :key="result.bggId"
          :value="String(result.bggId)"
        >
          {{ result.title }}{{ result.yearPublished ? ` (${result.yearPublished})` : "" }}
        </option>
      </select>
    </label>

    <SessionParticipantPicker
      v-model="form.selectedParticipants"
      :participants="participants"
      :self-participant-id="selfParticipantId"
      :create-participant="createParticipant"
      accent="board"
    />

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Notas (opcional)</span>
      <textarea
        v-model="form.notes"
        rows="3"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-board focus:outline-none"
        placeholder="Detalles de la sesión..."
      />
    </label>

    <div class="flex gap-2">
      <UiButton
        type="button"
        variant="board"
        class="flex-1"
        :disabled="!canSubmit || isSaving"
        @click="handleSubmit"
      >
        {{ isSaving ? "Guardando..." : "Crear partida" }}
      </UiButton>
      <UiButton
        type="button"
        variant="ghost"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>
    </div>
  </section>
</template>
