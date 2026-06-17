<script setup lang="ts">
import { computed, reactive } from "vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { Participant } from "@/domain/types/participant"
import type { BggSearchResult } from "@/services/bgg/bggService"

const props = defineProps<{
  participants: Participant[]
  bggResults: BggSearchResult[]
  isSaving?: boolean
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

const selectedBgg = computed(() =>
  props.bggResults.find(result => String(result.bggId) === form.bggSelectionId) ?? null,
)

const canSubmit = computed(() => form.title.trim().length > 0)

function toggleParticipant(participantId: string) {
  if (form.selectedParticipants.includes(participantId)) {
    form.selectedParticipants = form.selectedParticipants.filter(id => id !== participantId)
    return
  }

  form.selectedParticipants = [...form.selectedParticipants, participantId]
}

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
  <section class="space-y-4 rounded-2xl border-4 border-primary bg-dark p-4">
    <h2 class="text-2xl font-bold text-primary">Nueva partida</h2>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Nombre del juego</span>
      <input
        v-model="form.title"
        type="text"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
        placeholder="Ej. Azul, Terraforming Mars..."
      />
    </label>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Buscar en BGG (opcional)</span>
      <div class="flex gap-2">
        <input
          v-model="form.bggQuery"
          type="search"
          class="min-w-0 flex-1 rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
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
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
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

    <div class="space-y-2">
      <p class="text-sm text-gray-400">Participantes</p>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="participant in participants"
          :key="participant.id"
          type="button"
          class="rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors"
          :class="
            form.selectedParticipants.includes(participant.id)
              ? 'border-primary bg-primary/20 text-primary'
              : 'border-gray-700 text-gray-300 hover:border-primary/50'
          "
          @click="toggleParticipant(participant.id)"
        >
          {{ participant.displayName }}
        </button>
      </div>
    </div>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Notas (opcional)</span>
      <textarea
        v-model="form.notes"
        rows="3"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
        placeholder="Detalles de la sesión..."
      />
    </label>

    <div class="flex gap-2">
      <UiButton
        type="button"
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
