<script setup lang="ts">
import { computed, ref } from "vue"
import ParticipantCard from "@/components/participants/ParticipantCard.vue"
import ParticipantForm from "@/components/participants/ParticipantForm.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import { useParticipants } from "@/composables/useParticipants"
import type { ParticipantFormValues } from "@/domain/schemas/participant"

const {
  filteredParticipants,
  isLoading,
  isSaving,
  errorMessage,
  searchQuery,
  createParticipant,
  updateParticipant,
  removeParticipant,
  addAlias,
  removeAlias,
} = useParticipants()

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; id: string }

const formMode = ref<FormMode>({ type: "closed" })
const expandedId = ref<string | null>(null)

const editingParticipant = computed(() => {
  const mode = formMode.value
  if (mode.type !== "edit") return null

  return (
    filteredParticipants.value.find(
      participant => participant.id === mode.id,
    ) ?? null
  )
})

function openCreateForm() {
  formMode.value = { type: "create" }
}

function openEditForm(id: string) {
  formMode.value = { type: "edit", id }
  expandedId.value = id
}

function closeForm() {
  formMode.value = { type: "closed" }
}

function toggleExpanded(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function handleCreate(values: ParticipantFormValues) {
  await createParticipant(values)
  closeForm()
}

async function handleUpdate(values: ParticipantFormValues) {
  if (formMode.value.type !== "edit") return

  await updateParticipant(formMode.value.id, values)
  closeForm()
}

async function handleRemove(id: string) {
  await removeParticipant(id)
  if (expandedId.value === id) expandedId.value = null
  if (formMode.value.type === "edit" && formMode.value.id === id) {
    closeForm()
  }
}
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-secondary">Amigos</p>
      <h1 class="text-3xl font-bold text-primary">Participantes</h1>
      <p class="text-gray-400">
        Jugadores sin cuenta y alias para importar partidas.
      </p>
    </div>

    <SearchInput
      v-model="searchQuery"
      placeholder="Buscar gente"
    />

    <button
      v-if="formMode.type === 'closed'"
      type="button"
      class="mt-2 w-full rounded-lg border-2 border-dashed border-gray-600 p-4 text-gray-300 transition-colors hover:border-primary hover:text-primary"
      @click="openCreateForm"
    >
      + Añadir jugador
    </button>

    <ParticipantForm
      v-if="formMode.type === 'create'"
      submit-label="Añadir"
      :is-saving="isSaving"
      :initial-values="{ displayName: searchQuery }"
      @submit="handleCreate"
      @cancel="closeForm"
    />

    <ParticipantForm
      v-else-if="formMode.type === 'edit' && editingParticipant"
      submit-label="Guardar"
      :is-saving="isSaving"
      :initial-values="{ displayName: editingParticipant.displayName }"
      @submit="handleUpdate"
      @cancel="closeForm"
    />

    <p
      v-if="errorMessage"
      class="rounded-lg bg-secondary/20 p-4 text-secondary"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <p
      v-if="isLoading"
      class="text-gray-400"
    >
      Cargando participantes…
    </p>

    <TransitionGroup
      v-else
      name="slide"
      tag="div"
      class="space-y-3"
    >
      <ParticipantCard
        v-for="participant in filteredParticipants"
        :key="participant.id"
        :participant="participant"
        :is-expanded="expandedId === participant.id"
        :is-saving="isSaving"
        @toggle="toggleExpanded(participant.id)"
        @edit="openEditForm(participant.id)"
        @remove="handleRemove(participant.id)"
        @add-alias="addAlias(participant.id, $event)"
        @remove-alias="removeAlias(participant.id, $event)"
      />
    </TransitionGroup>

    <p
      v-if="!isLoading && filteredParticipants.length === 0"
      class="rounded-lg border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
    >
      {{
        searchQuery.trim()
          ? "No hay participantes con ese nombre."
          : "Aún no has añadido participantes."
      }}
    </p>
  </section>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
