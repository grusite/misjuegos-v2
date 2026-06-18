<script setup lang="ts">
import { computed, ref } from "vue"
import SessionParticipantPicker from "@/components/sessions/SessionParticipantPicker.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import type { Participant } from "@/domain/types/participant"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import type {
  SessionDatePreset,
  SessionListFilterState,
} from "@/services/sessions/sessionListFilters"
import { countActiveSessionFilters } from "@/services/sessions/sessionListFilters"

const filters = defineModel<SessionListFilterState>({ required: true })

const props = defineProps<{
  participants: Participant[]
  playerTeams: PlayerTeamWithMembers[]
  selfParticipantId: string | null
}>()

const emit = defineEmits<{
  clear: []
}>()

const isExpanded = ref(false)

const activeFilterCount = computed(() => countActiveSessionFilters(filters.value))

const datePresetOptions: Array<{ value: SessionDatePreset; label: string }> = [
  { value: "all", label: "Todas las fechas" },
  { value: "this_month", label: "Este mes" },
  { value: "this_year", label: "Este año" },
  { value: "custom", label: "Rango personalizado" },
]

const canUseOnlyMine = computed(() => Boolean(props.selfParticipantId))

function dateChipClasses(value: SessionDatePreset): string {
  const isActive = filters.value.datePreset === value
  return isActive
    ? "border-primary bg-primary/20 text-primary"
    : "border-gray-700 text-gray-400 hover:border-gray-500"
}

function toggleOnlyMine() {
  if (!canUseOnlyMine.value) return

  filters.value = {
    ...filters.value,
    onlyMine: !filters.value.onlyMine,
    participantIds: filters.value.onlyMine ? filters.value.participantIds : [],
  }
}

function onParticipantIdsChange(ids: string[]) {
  filters.value = {
    ...filters.value,
    participantIds: ids,
    onlyMine: false,
  }
}

function onTeamChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  filters.value = {
    ...filters.value,
    playerTeamId: value || null,
  }
}

function onDatePresetChange(preset: SessionDatePreset) {
  filters.value = {
    ...filters.value,
    datePreset: preset,
    dateFrom: preset === "custom" ? filters.value.dateFrom : null,
    dateTo: preset === "custom" ? filters.value.dateTo : null,
  }
}

function clearFilters() {
  emit("clear")
  isExpanded.value = false
}
</script>

<template>
  <div class="space-y-3">
    <SearchInput
      v-model="filters.search"
      placeholder="Buscar por juego, ciudad o local..."
    />

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors"
        :class="
          isExpanded
            ? 'border-primary bg-primary/20 text-primary'
            : 'border-gray-700 text-gray-300 hover:border-gray-500'
        "
        @click="isExpanded = !isExpanded"
      >
        Filtros
        <span
          v-if="activeFilterCount > 0"
          class="ml-1 rounded-full bg-primary px-1.5 text-xs text-dark"
        >
          {{ activeFilterCount }}
        </span>
      </button>

      <button
        v-if="activeFilterCount > 0"
        type="button"
        class="rounded-full border-2 border-gray-700 px-3 py-1 text-sm font-semibold text-gray-400 transition-colors hover:border-secondary hover:text-secondary"
        @click="clearFilters"
      >
        Limpiar
      </button>
    </div>

    <div
      v-if="isExpanded"
      class="space-y-4 rounded-xl border-4 border-dashed border-gray-700 p-4"
    >
      <div class="space-y-2">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Jugadores</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            :class="
              filters.onlyMine
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            "
            :disabled="!canUseOnlyMine"
            @click="toggleOnlyMine"
          >
            Yo
          </button>
        </div>

        <SessionParticipantPicker
          :model-value="filters.participantIds"
          :participants="participants"
          :teams="playerTeams"
          :self-participant-id="selfParticipantId"
          accent="board"
          label="Jugador"
          trigger-label="Elegir jugadores"
          done-label="Aplicar"
          :min-selection="0"
          :disabled="filters.onlyMine"
          @update:model-value="onParticipantIdsChange"
        />
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-widest text-gray-500" for="team-filter">
          Equipo
        </label>
        <select
          id="team-filter"
          class="w-full rounded-lg border-2 border-gray-700 bg-dark px-3 py-2 text-sm text-gray-200"
          :value="filters.playerTeamId ?? ''"
          @change="onTeamChange"
        >
          <option value="">Cualquier equipo</option>
          <option v-for="team in playerTeams" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Fechas</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in datePresetOptions"
            :key="option.value"
            type="button"
            class="rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors"
            :class="dateChipClasses(option.value)"
            @click="onDatePresetChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div
          v-if="filters.datePreset === 'custom'"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <label class="space-y-1 text-sm text-gray-400">
            Desde
            <input
              type="date"
              class="w-full rounded-lg border-2 border-gray-700 bg-dark px-3 py-2 text-gray-200"
              :value="filters.dateFrom ?? ''"
              @input="
                filters = {
                  ...filters,
                  dateFrom: ($event.target as HTMLInputElement).value || null,
                }
              "
            />
          </label>
          <label class="space-y-1 text-sm text-gray-400">
            Hasta
            <input
              type="date"
              class="w-full rounded-lg border-2 border-gray-700 bg-dark px-3 py-2 text-gray-200"
              :value="filters.dateTo ?? ''"
              @input="
                filters = {
                  ...filters,
                  dateTo: ($event.target as HTMLInputElement).value || null,
                }
              "
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
