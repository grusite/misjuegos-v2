<script setup lang="ts">
import { computed } from "vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { ParticipantLinkCandidate } from "@/domain/types/participantLink"

const props = defineProps<{
  open: boolean
  displayName: string
  candidates: ParticipantLinkCandidate[]
  searchResults: ParticipantLinkCandidate[]
  searchQuery: string
  isSearching: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  select: [participantId: string]
  decline: []
  "update:searchQuery": [value: string]
}>()

const hasCandidates = computed(() => props.candidates.length > 0)
const hasSearchResults = computed(() => props.searchResults.length > 0)
const showSearchHint = computed(
  () => props.searchQuery.trim().length > 0 && props.searchQuery.trim().length < 2,
)

function sessionLabel(count: number): string {
  if (count === 0) return "Sin partidas registradas"
  if (count === 1) return "1 partida en el historial"
  return `${count} partidas en el historial`
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-link-title"
    >
      <div class="absolute inset-0 bg-black/70" aria-hidden="true" />

      <div
        class="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-4 border-primary bg-dark sm:rounded-3xl"
      >
        <header class="space-y-2 border-b border-gray-800 p-5">
          <p class="text-xs uppercase tracking-widest text-gray-500">Primera vez</p>
          <h2 id="participant-link-title" class="text-2xl font-bold text-primary">
            ¿Eres alguno de estos amigos?
          </h2>
          <p class="text-sm text-gray-300">
            Hola, <span class="font-semibold text-white">{{ displayName }}</span
            >. Si ya apareces en partidas importadas, enlázate para recuperar tu historial.
          </p>
        </header>

        <div class="flex-1 space-y-4 overflow-y-auto p-5">
          <section v-if="hasCandidates" class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Sugerencias por tu nombre
            </p>
            <button
              v-for="candidate in candidates"
              :key="`suggested-${candidate.id}`"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-700 bg-gray-900/60 p-4 text-left transition hover:border-primary hover:bg-gray-900"
              :disabled="isSubmitting"
              @click="emit('select', candidate.id)"
            >
              <ParticipantBubble
                :display-name="candidate.displayName"
                :color-class="candidate.color"
                size="md"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-white">{{ candidate.displayName }}</p>
                <p class="text-sm text-gray-400">{{ sessionLabel(candidate.sessionCount) }}</p>
              </div>
              <span
                v-if="candidate.matchKind === 'exact'"
                class="rounded-full bg-primary/20 px-2 py-1 text-xs font-semibold text-primary"
              >
                Coincide
              </span>
            </button>
          </section>

          <section class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Buscar otro amigo sin cuenta
            </p>
            <SearchInput
              :model-value="searchQuery"
              placeholder="Nombre o alias (mín. 2 letras)..."
              @update:model-value="emit('update:searchQuery', $event)"
            />
            <p v-if="showSearchHint" class="text-xs text-gray-500">
              Escribe al menos 2 caracteres para buscar.
            </p>
            <p v-else-if="isSearching" class="text-sm text-gray-400">Buscando...</p>
            <template v-else-if="hasSearchResults">
              <button
                v-for="candidate in searchResults"
                :key="`search-${candidate.id}`"
                type="button"
                class="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-700 bg-gray-900/60 p-4 text-left transition hover:border-primary hover:bg-gray-900"
                :disabled="isSubmitting"
                @click="emit('select', candidate.id)"
              >
                <ParticipantBubble
                  :display-name="candidate.displayName"
                  :color-class="candidate.color"
                  size="md"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-white">{{ candidate.displayName }}</p>
                  <p class="text-sm text-gray-400">{{ sessionLabel(candidate.sessionCount) }}</p>
                </div>
              </button>
            </template>
            <p
              v-else-if="searchQuery.trim().length >= 2"
              class="rounded-xl bg-gray-900/80 p-4 text-sm text-gray-400"
            >
              No hay amigos sin cuenta con ese nombre.
            </p>
          </section>

          <p
            v-if="!hasCandidates && searchQuery.trim().length < 2"
            class="rounded-xl bg-gray-900/80 p-4 text-sm text-gray-400"
          >
            No encontramos coincidencias con tu nombre. Busca arriba por otro nombre o crea tu
            ficha nueva.
          </p>
        </div>

        <footer class="space-y-2 border-t border-gray-800 p-5">
          <UiButton
            type="button"
            variant="ghost"
            class="w-full"
            :disabled="isSubmitting"
            @click="emit('decline')"
          >
            No soy ninguno — crear mi ficha
          </UiButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
