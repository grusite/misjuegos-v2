<script setup lang="ts">
import { computed, ref } from "vue"
import { Icon } from "@iconify/vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import UiButton from "@/components/ui/UiButton.vue"
import { participantFormSchema } from "@/domain/schemas/participant"
import type { Participant } from "@/domain/types/participant"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import { getDbErrorMessage } from "@/services/errors"

const selectedIds = defineModel<string[]>({ required: true })

const props = withDefaults(
  defineProps<{
    participants: Participant[]
    selfParticipantId?: string | null
    accent?: "board" | "tertiary"
    createParticipant?: (displayName: string) => Promise<Participant | null>
    applySelection?: (participantIds: string[]) => Promise<boolean>
    label?: string
    triggerLabel?: string
    doneLabel?: string
    hideTrigger?: boolean
    disabled?: boolean
  }>(),
  {
    selfParticipantId: null,
    accent: "board",
    createParticipant: undefined,
    applySelection: undefined,
    label: "Participantes",
    triggerLabel: "Elegir",
    doneLabel: "Listo",
    hideTrigger: false,
    disabled: false,
  },
)

const isOpen = ref(false)
const searchQuery = ref("")
const isCreating = ref(false)
const isApplying = ref(false)
const createError = ref<string | null>(null)
let snapshotOnOpen: string[] = []

const trimmedQuery = computed(() => searchQuery.value.trim())

const listCountLabel = computed(() => {
  const count = props.participants.length
  return count === 1 ? "1 en tu lista" : `${count} en tu lista`
})

const canCreateFromSearch = computed(() => {
  if (!props.createParticipant || !trimmedQuery.value) return false

  const parsed = participantFormSchema.safeParse({ displayName: trimmedQuery.value })
  if (!parsed.success) return false

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
  const count = selectedIds.value.length
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

function openPicker() {
  snapshotOnOpen = [...selectedIds.value]
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
  }

  closePicker()
}

async function handleDone() {
  if (props.applySelection) {
    isApplying.value = true
    createError.value = null

    try {
      const saved = await props.applySelection(selectedIds.value)
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

function toggleParticipant(participantId: string) {
  if (isSelected(participantId)) {
    if (selectedIds.value.length === 1) return

    selectedIds.value = selectedIds.value.filter(id => id !== participantId)
    return
  }

  selectedIds.value = [...selectedIds.value, participantId]
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
      <p class="text-xs text-gray-500">{{ countLabel }}</p>
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
        v-if="selectedParticipants.length > 0"
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
        Elige quién jugó
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
        aria-label="Elegir participantes"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/60"
          aria-label="Cerrar selector de participantes"
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
                Participantes
              </h3>
              <p class="text-xs text-gray-500">
                {{ listCountLabel }} · todos visibles al desplazar
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
            placeholder="Buscar o escribir nombre nuevo"
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

          <p
            v-if="participants.length === 0 && !trimmedQuery"
            class="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center text-sm text-gray-500"
          >
            Aún no tienes amigos. Escribe un nombre arriba para crear uno.
          </p>

          <ul
            v-else-if="participants.length > 0"
            class="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-2"
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
