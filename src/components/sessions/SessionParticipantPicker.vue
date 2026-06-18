<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Icon } from "@iconify/vue"
import TeamBadge from "@/components/teams/TeamBadge.vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import UiButton from "@/components/ui/UiButton.vue"
import { participantFormSchema } from "@/domain/schemas/participant"
import type { Participant } from "@/domain/types/participant"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import {
  findMatchingTeamId,
  teamMemberIds,
} from "@/lib/utils/teamSelection"
import { getDbErrorMessage } from "@/services/errors"

const selectedIds = defineModel<string[]>({ required: true })
const selectedTeamId = defineModel<string | null>("selectedTeamId", { default: null })

const props = withDefaults(
  defineProps<{
    participants: Participant[]
    teams?: PlayerTeamWithMembers[]
    selfParticipantId?: string | null
    accent?: "board" | "tertiary"
    createParticipant?: (displayName: string) => Promise<Participant | null>
    applySelection?: (
      participantIds: string[],
      teamId: string | null,
    ) => Promise<boolean>
    label?: string
    triggerLabel?: string
    doneLabel?: string
    hideTrigger?: boolean
    disabled?: boolean
    minSelection?: number
  }>(),
  {
    teams: () => [],
    selfParticipantId: null,
    accent: "board",
    createParticipant: undefined,
    applySelection: undefined,
    label: "Participantes",
    triggerLabel: "Elegir",
    doneLabel: "Listo",
    hideTrigger: false,
    disabled: false,
    minSelection: 1,
  },
)

const isOpen = ref(false)
const searchQuery = ref("")
const isCreating = ref(false)
const isApplying = ref(false)
const createError = ref<string | null>(null)
let snapshotOnOpen: string[] = []
let snapshotTeamOnOpen: string | null = null

const trimmedQuery = computed(() => searchQuery.value.trim())

const selectedTeam = computed(
  () => props.teams.find(team => team.id === selectedTeamId.value) ?? null,
)

const listCountLabel = computed(() => {
  const teamCount = props.teams.length
  const peopleCount = props.participants.length
  return `${teamCount} equipos · ${peopleCount} amigos`
})

const canCreateFromSearch = computed(() => {
  if (!props.createParticipant || !trimmedQuery.value) return false

  const parsed = participantFormSchema.safeParse({ displayName: trimmedQuery.value })
  if (!parsed.success) return false

  const matchesTeam = props.teams.some(
    team => team.name.toLowerCase() === parsed.data.displayName.toLowerCase(),
  )
  if (matchesTeam) return false

  return !props.participants.some(
    participant =>
      participant.displayName.toLowerCase() === parsed.data.displayName.toLowerCase(),
  )
})

const createValidationError = computed(() => {
  if (!trimmedQuery.value) return null

  const parsed = participantFormSchema.safeParse({ displayName: trimmedQuery.value })
  if (parsed.success) return null

  return parsed.error.issues[0]?.message ?? "Nombre no válido"
})

const selectedParticipants = computed(() =>
  props.participants.filter(participant => selectedIds.value.includes(participant.id)),
)

const countLabel = computed(() => {
  if (selectedTeam.value) {
    return `Equipo «${selectedTeam.value.name}» · ${selectedIds.value.length} jugadores`
  }

  const count = selectedIds.value.length
  if (count === 0) {
    return props.minSelection === 0 ? "Sin filtro de jugadores" : "0 jugadores"
  }
  return count === 1 ? "1 jugador seleccionado" : `${count} jugadores seleccionados`
})

const accentBorderClass = computed(() =>
  props.accent === "tertiary" ? "border-tertiary" : "border-board",
)

const accentTextClass = computed(() =>
  props.accent === "tertiary" ? "text-tertiary" : "text-board",
)

const accentSelectedRowClass = computed(() =>
  props.accent === "tertiary"
    ? "border-tertiary bg-tertiary/15"
    : "border-board bg-board/15",
)

const accentHoverClass = computed(() =>
  props.accent === "tertiary" ? "hover:border-tertiary/50" : "hover:border-board/50",
)

const maxVisible = 5
const visibleSelected = computed(() => selectedParticipants.value.slice(0, maxVisible))
const hiddenSelectedCount = computed(() =>
  Math.max(0, selectedParticipants.value.length - maxVisible),
)

const filteredTeams = computed(() => {
  const query = trimmedQuery.value.toLowerCase()

  const list = query
    ? props.teams.filter(team => {
        const matchesName = team.name.toLowerCase().includes(query)
        const matchesMember = team.members.some(member =>
          member.displayName.toLowerCase().includes(query),
        )
        return matchesName || matchesMember
      })
    : [...props.teams]

  return list.sort((left, right) => left.name.localeCompare(right.name, "es"))
})

const filteredParticipants = computed(() => {
  const query = trimmedQuery.value.toLowerCase()
  const selected = new Set(selectedIds.value)

  const list = query
    ? props.participants.filter(participant =>
        participant.displayName.toLowerCase().includes(query),
      )
    : [...props.participants]

  return list.sort((left, right) => {
    if (left.id === props.selfParticipantId) return -1
    if (right.id === props.selfParticipantId) return 1

    const leftSelected = selected.has(left.id)
    const rightSelected = selected.has(right.id)
    if (leftSelected && !rightSelected) return -1
    if (!leftSelected && rightSelected) return 1

    return left.displayName.localeCompare(right.displayName, "es")
  })
})

function syncTeamFromParticipants() {
  selectedTeamId.value = findMatchingTeamId(props.teams, selectedIds.value)
}

watch(selectedIds, () => {
  if (!isOpen.value) syncTeamFromParticipants()
})

function openPicker() {
  snapshotOnOpen = [...selectedIds.value]
  snapshotTeamOnOpen = selectedTeamId.value
  searchQuery.value = ""
  createError.value = null
  isOpen.value = true
}

function closePicker() {
  isOpen.value = false
  createError.value = null
}

function cancelPicker() {
  if (props.applySelection) {
    selectedIds.value = [...snapshotOnOpen]
    selectedTeamId.value = snapshotTeamOnOpen
  }

  closePicker()
}

async function handleDone() {
  syncTeamFromParticipants()

  if (props.applySelection) {
    isApplying.value = true
    createError.value = null

    try {
      const saved = await props.applySelection(
        selectedIds.value,
        selectedTeamId.value,
      )
      if (!saved) {
        createError.value = "No se pudieron guardar los jugadores"
        return
      }
    } catch (error) {
      createError.value = getDbErrorMessage(error)
      return
    } finally {
      isApplying.value = false
    }
  }

  closePicker()
}

defineExpose({ openPicker })

async function handleCreateFromSearch() {
  if (!props.createParticipant || !canCreateFromSearch.value || isCreating.value) return

  isCreating.value = true
  createError.value = null

  try {
    const created = await props.createParticipant(trimmedQuery.value)
    if (!created) {
      createError.value = "No se pudo crear el amigo"
      return
    }

    if (!isSelected(created.id)) {
      selectedIds.value = [...selectedIds.value, created.id]
      selectedTeamId.value = null
    }

    searchQuery.value = ""
  } catch (error) {
    createError.value = getDbErrorMessage(error)
  } finally {
    isCreating.value = false
  }
}

function isSelected(participantId: string) {
  return selectedIds.value.includes(participantId)
}

function isTeamSelected(teamId: string) {
  return selectedTeamId.value === teamId
}

function selectTeam(team: PlayerTeamWithMembers) {
  if (isTeamSelected(team.id)) {
    selectedTeamId.value = null
    if (props.minSelection > 0 && props.selfParticipantId) {
      selectedIds.value = [props.selfParticipantId]
    } else {
      selectedIds.value = []
    }
    return
  }

  selectedTeamId.value = team.id
  selectedIds.value = teamMemberIds(team)
}

function toggleParticipant(participantId: string) {
  if (isSelected(participantId)) {
    if (selectedIds.value.length <= props.minSelection) return

    selectedIds.value = selectedIds.value.filter(id => id !== participantId)
    selectedTeamId.value = null
    return
  }

  selectedIds.value = [...selectedIds.value, participantId]
  selectedTeamId.value = null
}

function participantLabel(participant: Participant) {
  if (participant.id === props.selfParticipantId) {
    return `${participant.displayName} (tú)`
  }

  return participant.displayName
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="!hideTrigger"
      class="flex items-baseline justify-between gap-2"
    >
      <p class="text-sm text-gray-400">{{ label }}</p>
      <p class="max-w-[55%] truncate text-right text-xs text-gray-500">{{ countLabel }}</p>
    </div>

    <button
      v-if="!hideTrigger"
      type="button"
      class="flex w-full items-center gap-3 rounded-lg border-2 border-gray-700 bg-dark/60 px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      :class="accentHoverClass"
      :disabled="disabled"
      @click="openPicker"
    >
      <div
        v-if="selectedTeam"
        class="min-w-0 flex-1"
      >
        <TeamBadge
          :team="selectedTeam"
          :accent="accent"
          size="sm"
          :show-name="true"
        />
      </div>

      <div
        v-else-if="selectedParticipants.length > 0"
        class="flex min-w-0 flex-1 items-center"
      >
        <div class="flex items-center">
          <ParticipantBubble
            v-for="(participant, index) in visibleSelected"
            :key="participant.id"
            :display-name="participant.displayName"
            :avatar-url="participant.avatarUrl"
            :color-class="participant.color"
            class="-ml-2 first:ml-0"
            :style="{ zIndex: visibleSelected.length - index }"
          />
          <span
            v-if="hiddenSelectedCount > 0"
            class="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-gray-200 ring-2 ring-dark"
          >
            +{{ hiddenSelectedCount }}
          </span>
        </div>
      </div>

      <p
        v-else
        class="min-w-0 flex-1 text-sm text-gray-500"
      >
        Elige equipo o jugadores
      </p>

      <span
        class="shrink-0 text-sm font-semibold"
        :class="accentTextClass"
      >
        {{ triggerLabel }}
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="Elegir jugadores y equipos"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/60"
          aria-label="Cerrar selector"
          @click="cancelPicker"
        />

        <div
          class="relative mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl border-4 bg-dark p-4"
          :class="accentBorderClass"
        >
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3
                class="text-lg font-bold"
                :class="accentTextClass"
              >
                Jugadores y equipos
              </h3>
              <p class="text-xs text-gray-500">
                {{ listCountLabel }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-100"
              aria-label="Cerrar"
              @click="cancelPicker"
            >
              <Icon
                icon="mdi:close"
                class="h-6 w-6"
                aria-hidden="true"
              />
            </button>
          </div>

          <SearchInput
            v-model="searchQuery"
            placeholder="Buscar equipo, amigo o crear uno nuevo"
            class="mb-3"
          />

          <p
            v-if="createError"
            class="mb-3 rounded-lg bg-secondary/20 p-3 text-sm text-secondary"
            role="alert"
          >
            {{ createError }}
          </p>

          <button
            v-if="canCreateFromSearch"
            type="button"
            class="mb-3 flex w-full items-center gap-3 rounded-lg border-2 border-dashed px-3 py-2.5 text-left transition-colors disabled:opacity-60"
            :class="`${accentBorderClass} ${accentHoverClass}`"
            :disabled="isCreating"
            @click="handleCreateFromSearch"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
              :class="getAvatarColor(trimmedQuery)"
            >
              <Icon
                icon="mdi:plus"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <span class="min-w-0 flex-1 font-medium text-gray-100">
              {{
                isCreating
                  ? "Creando amigo..."
                  : `Crear amigo «${trimmedQuery}»`
              }}
            </span>
          </button>

          <p
            v-else-if="createValidationError && trimmedQuery"
            class="mb-3 text-sm text-secondary"
          >
            {{ createValidationError }}
          </p>

          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-2">
            <section v-if="filteredTeams.length > 0">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Equipos
              </p>
              <ul class="space-y-2">
                <li
                  v-for="team in filteredTeams"
                  :key="team.id"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors"
                    :class="
                      isTeamSelected(team.id)
                        ? accentSelectedRowClass
                        : `border-gray-700 text-gray-200 ${accentHoverClass}`
                    "
                    :aria-pressed="isTeamSelected(team.id)"
                    @click="selectTeam(team)"
                  >
                    <TeamBadge
                      :team="team"
                      :accent="accent"
                      size="sm"
                      :show-name="false"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium">{{ team.name }}</p>
                      <p class="text-xs text-gray-500">
                        {{ team.members.length }} jugadores
                      </p>
                    </div>
                    <Icon
                      :icon="
                        isTeamSelected(team.id)
                          ? 'mdi:check-circle'
                          : 'mdi:circle-outline'
                      "
                      class="h-6 w-6 shrink-0"
                      :class="isTeamSelected(team.id) ? accentTextClass : 'text-gray-500'"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              </ul>
            </section>

            <section>
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Amigos
              </p>

              <p
                v-if="participants.length === 0 && !trimmedQuery"
                class="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center text-sm text-gray-500"
              >
                Aún no tienes amigos. Escribe un nombre arriba para crear uno.
              </p>

              <ul
                v-else-if="participants.length > 0"
                class="space-y-2"
              >
                <li
                  v-for="participant in filteredParticipants"
                  :key="participant.id"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors"
                    :class="
                      isSelected(participant.id)
                        ? accentSelectedRowClass
                        : `border-gray-700 text-gray-200 ${accentHoverClass}`
                    "
                    :aria-pressed="isSelected(participant.id)"
                    @click="toggleParticipant(participant.id)"
                  >
                    <ParticipantBubble
                      :display-name="participant.displayName"
                      :avatar-url="participant.avatarUrl"
                      :color-class="participant.color"
                      size="md"
                    />
                    <span class="min-w-0 flex-1 truncate font-medium">
                      {{ participantLabel(participant) }}
                    </span>
                    <Icon
                      :icon="
                        isSelected(participant.id)
                          ? 'mdi:check-circle'
                          : 'mdi:circle-outline'
                      "
                      class="h-6 w-6 shrink-0"
                      :class="isSelected(participant.id) ? accentTextClass : 'text-gray-500'"
                      aria-hidden="true"
                    />
                  </button>
                </li>

                <li
                  v-if="filteredParticipants.length === 0 && trimmedQuery && !canCreateFromSearch"
                  class="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center text-sm text-gray-500"
                >
                  No hay coincidencias para «{{ trimmedQuery }}».
                </li>
              </ul>
            </section>
          </div>

          <UiButton
            type="button"
            :variant="accent"
            class="mt-3 w-full"
            :disabled="isApplying || isCreating"
            @click="handleDone"
          >
            {{ isApplying ? "Guardando..." : doneLabel }}
          </UiButton>
        </div>
      </div>
    </Teleport>
  </div>
</template>
