<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import { Icon } from "@iconify/vue"
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

watch(
  () => props.participants,
  participants => {
    if (form.selectedParticipants.length === 0 && participants.length > 0) {
      form.selectedParticipants = [participants[0].id]
    }
  },
  { immediate: true },
)

const selectedBgg = computed(() =>
  props.bggResults.find(result => String(result.bggId) === form.bggSelectionId) ?? null,
)

const canSubmit = computed(() => form.title.trim().length > 0)

function isParticipantSelected(participantId: string) {
  return form.selectedParticipants.includes(participantId)
}

function toggleParticipant(participantId: string) {
  if (isParticipantSelected(participantId)) {
    if (form.selectedParticipants.length === 1) return
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

    <div class="space-y-2">
      <div class="flex items-baseline justify-between gap-2">
        <p class="text-sm text-gray-400">Participantes</p>
        <p class="text-xs text-gray-500">Toca para añadir o quitar</p>
      </div>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="participant in participants"
          :key="participant.id"
          type="button"
          class="flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors"
          :class="
            isParticipantSelected(participant.id)
              ? 'border-board bg-board text-dark'
              : 'border-gray-700 text-gray-300 hover:border-board/50'
          "
          :aria-pressed="isParticipantSelected(participant.id)"
          @click="toggleParticipant(participant.id)"
        >
          <Icon
            :icon="
              isParticipantSelected(participant.id)
                ? 'mdi:check-circle'
                : 'mdi:circle-outline'
            "
            class="h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ participant.displayName }}</span>
        </button>
      </div>
    </div>

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
