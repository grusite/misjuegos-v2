<script setup lang="ts">
import { computed, ref } from "vue"
import TeamCard from "@/components/teams/TeamCard.vue"
import TeamForm from "@/components/teams/TeamForm.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import { useParticipants } from "@/composables/useParticipants"
import { usePlayerTeams } from "@/composables/usePlayerTeams"
import type { PlayerTeamFormValues } from "@/domain/schemas/playerTeam"
import type { Participant } from "@/domain/types/participant"

const {
  teams,
  isLoading,
  isSaving,
  errorMessage,
  createTeam,
  updateTeam,
  removeTeam,
} = usePlayerTeams()

const {
  participants,
  ownerId,
  createParticipant,
} = useParticipants()

const searchQuery = ref("")

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; id: string }

const formMode = ref<FormMode>({ type: "closed" })

const selfParticipantId = computed(
  () => participants.value.find(participant => participant.profileId === ownerId.value)?.id ?? null,
)

const filteredTeams = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return teams.value

  return teams.value.filter(team => {
    const matchesName = team.name.toLowerCase().includes(query)
    const matchesDescription = team.description?.toLowerCase().includes(query) ?? false
    const matchesMember = team.members.some(member =>
      member.displayName.toLowerCase().includes(query),
    )

    return matchesName || matchesDescription || matchesMember
  })
})

const editingTeam = computed(() => {
  const mode = formMode.value
  if (mode.type !== "edit") return null

  return teams.value.find(team => team.id === mode.id) ?? null
})

function openCreateForm() {
  formMode.value = { type: "create" }
}

function openEditForm(id: string) {
  formMode.value = { type: "edit", id }
}

function closeForm() {
  formMode.value = { type: "closed" }
}

async function createFriendParticipant(displayName: string): Promise<Participant | null> {
  try {
    await createParticipant({ displayName })
    return (
      participants.value.find(
        participant => participant.displayName.toLowerCase() === displayName.toLowerCase(),
      ) ?? null
    )
  } catch {
    return null
  }
}

async function handleCreate(values: PlayerTeamFormValues) {
  await createTeam(values)
  closeForm()
}

async function handleUpdate(values: PlayerTeamFormValues) {
  if (formMode.value.type !== "edit") return

  await updateTeam(formMode.value.id, values)
  closeForm()
}

async function handleRemove(id: string) {
  if (!window.confirm("¿Eliminar este equipo?")) return

  await removeTeam(id)
  if (formMode.value.type === "edit" && formMode.value.id === id) {
    closeForm()
  }
}
</script>

<template>
  <section class="space-y-4 pb-8">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Grupos</p>
      <h1 class="text-3xl font-bold text-primary">Equipos</h1>
      <p class="text-gray-400">
        Crea grupos de jugadores para rellenar partidas con un toque.
      </p>
    </div>

    <SearchInput
      v-model="searchQuery"
      placeholder="Buscar equipos o jugadores"
    />

    <p
      v-if="errorMessage"
      class="rounded-lg bg-secondary/20 p-4 text-secondary"
    >
      {{ errorMessage }}
    </p>

    <TeamForm
      v-if="formMode.type === 'create'"
      :participants="participants"
      :self-participant-id="selfParticipantId"
      :create-participant="createFriendParticipant"
      submit-label="Crear equipo"
      :is-saving="isSaving"
      @submit="handleCreate"
      @cancel="closeForm"
    />

    <TeamForm
      v-else-if="formMode.type === 'edit' && editingTeam"
      :initial-team="editingTeam"
      :participants="participants"
      :self-participant-id="selfParticipantId"
      :create-participant="createFriendParticipant"
      submit-label="Guardar"
      :is-saving="isSaving"
      @submit="handleUpdate"
      @cancel="closeForm"
    />

    <button
      v-if="formMode.type === 'closed'"
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-gray-600 p-4 text-gray-300 transition-colors hover:border-primary hover:text-primary"
      @click="openCreateForm"
    >
      + Crear equipo
    </button>

    <p
      v-if="isLoading"
      class="text-gray-400"
    >
      Cargando equipos...
    </p>

    <div
      v-else
      class="space-y-3"
    >
      <TeamCard
        v-for="team in filteredTeams"
        :key="team.id"
        :team="team"
        :is-saving="isSaving"
        @edit="openEditForm(team.id)"
        @remove="handleRemove(team.id)"
      />

      <p
        v-if="filteredTeams.length === 0"
        class="rounded-xl border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
      >
        {{
          teams.length === 0
            ? "Todavía no tienes equipos. Crea uno con tu grupo habitual."
            : "No hay equipos con esta búsqueda."
        }}
      </p>
    </div>
  </section>
</template>
