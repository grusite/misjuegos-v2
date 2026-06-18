<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import SessionParticipantPicker from "@/components/sessions/SessionParticipantPicker.vue"
import UiButton from "@/components/ui/UiButton.vue"
import {
  playerTeamFormSchema,
  type PlayerTeamFormValues,
} from "@/domain/schemas/playerTeam"
import type { Participant } from "@/domain/types/participant"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

const props = defineProps<{
  participants: Participant[]
  selfParticipantId?: string | null
  initialTeam?: PlayerTeamWithMembers | null
  isSaving?: boolean
  submitLabel: string
  createParticipant?: (displayName: string) => Promise<Participant | null>
}>()

const emit = defineEmits<{
  submit: [values: PlayerTeamFormValues]
  cancel: []
}>()

const form = reactive({
  name: props.initialTeam?.name ?? "",
  description: props.initialTeam?.description ?? "",
  participantIds: props.initialTeam?.members.map(member => member.id) ?? [],
})

const fieldErrors = reactive({
  name: null as string | null,
  participantIds: null as string | null,
})

const selectedParticipantIds = computed({
  get: () => form.participantIds,
  set: value => {
    form.participantIds = value
  },
})

watch(
  () => props.initialTeam,
  team => {
    if (!team) return

    form.name = team.name
    form.description = team.description ?? ""
    form.participantIds = team.members.map(member => member.id)
  },
)

watch(
  () => [props.participants, props.selfParticipantId] as const,
  ([participants, selfParticipantId]) => {
    if (form.participantIds.length > 0 || props.initialTeam) return

    const defaultId = selfParticipantId ?? participants[0]?.id
    if (defaultId) form.participantIds = [defaultId]
  },
  { immediate: true },
)

function handleSubmit() {
  const parsed = playerTeamFormSchema.safeParse({
    name: form.name,
    description: form.description || undefined,
    participantIds: form.participantIds,
  })

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors
    fieldErrors.name = flattened.name?.[0] ?? null
    fieldErrors.participantIds = flattened.participantIds?.[0] ?? null
    return
  }

  fieldErrors.name = null
  fieldErrors.participantIds = null
  emit("submit", parsed.data)
}
</script>

<template>
  <form
    class="space-y-4 rounded-xl border-2 border-primary/40 bg-dark p-4"
    @submit.prevent="handleSubmit"
  >
    <h2 class="text-2xl font-bold text-primary">
      {{ initialTeam ? "Editar equipo" : "Nuevo equipo" }}
    </h2>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Nombre del equipo</span>
      <input
        v-model="form.name"
        type="text"
        class="w-full rounded-lg border-2 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
        placeholder="Ej. Los habituales, Escapists..."
      />
      <p
        v-if="fieldErrors.name"
        class="text-sm text-secondary"
      >
        {{ fieldErrors.name }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Descripción (opcional)</span>
      <textarea
        v-model="form.description"
        rows="2"
        class="w-full rounded-lg border-2 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
        placeholder="Notas sobre el grupo..."
      />
    </label>

    <SessionParticipantPicker
      v-model="selectedParticipantIds"
      :participants="participants"
      :self-participant-id="selfParticipantId"
      :create-participant="createParticipant"
      label="Jugadores del equipo"
      trigger-label="Elegir"
      done-label="Listo"
      accent="board"
    />
    <p
      v-if="fieldErrors.participantIds"
      class="text-sm text-secondary"
    >
      {{ fieldErrors.participantIds }}
    </p>

    <div class="flex gap-2">
      <UiButton
        type="submit"
        class="flex-1"
        :disabled="isSaving || !form.name.trim()"
      >
        {{ isSaving ? "Guardando..." : submitLabel }}
      </UiButton>
      <UiButton
        type="button"
        variant="ghost"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>
    </div>
  </form>
</template>
