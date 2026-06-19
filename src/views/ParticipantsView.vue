<script setup lang="ts">
import { computed, ref } from "vue"
import FriendCard from "@/components/friends/FriendCard.vue"
import PeopleSearchResultRow from "@/components/friends/PeopleSearchResultRow.vue"
import ParticipantForm from "@/components/participants/ParticipantForm.vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import { useFriends } from "@/composables/useFriends"
import type { ParticipantFormValues } from "@/domain/schemas/participant"

const {
  filteredFriends,
  searchResults,
  searchQuery,
  aliasMap,
  isLoading,
  isSearching,
  isSaving,
  errorMessage,
  loadAliasesForParticipant,
  managedParticipantId,
  addSearchResult,
  createGhostFriend,
  disableFriend,
  addAlias,
  removeAlias,
} = useFriends()

const showCreateForm = ref(false)
const expandedId = ref<string | null>(null)

const showSearchPanel = computed(() => searchQuery.value.trim().length >= 2)

async function handleToggleFriend(friendshipId: string) {
  const friend = filteredFriends.value.find(item => item.friendshipId === friendshipId)
  if (!friend) return

  const nextExpanded = expandedId.value === friendshipId ? null : friendshipId
  expandedId.value = nextExpanded

  const participantId = managedParticipantId(friend)
  if (nextExpanded && participantId) {
    await loadAliasesForParticipant(participantId)
  }
}

async function handleCreate(values: ParticipantFormValues) {
  await createGhostFriend(values)
  showCreateForm.value = false
}

function canManageAliases(friend: (typeof filteredFriends.value)[number]) {
  return Boolean(managedParticipantId(friend))
}
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Amigos</p>
      <h1 class="text-3xl font-bold text-primary">Participantes</h1>
      <p class="text-gray-400">
        Busca usuarios con cuenta o jugadores sin login. También puedes crear uno nuevo.
      </p>
    </div>

    <SearchInput
      v-model="searchQuery"
      placeholder="Buscar usuarios o amigos sin cuenta..."
    />

    <section v-if="showSearchPanel" class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Resultados
      </p>
      <p v-if="isSearching" class="text-sm text-gray-400">Buscando...</p>
      <div v-else-if="searchResults.length > 0" class="space-y-2">
        <PeopleSearchResultRow
          v-for="result in searchResults"
          :key="`${result.kind}-${result.profileId ?? result.participantId}`"
          :result="result"
          :is-saving="isSaving"
          @add="addSearchResult(result)"
        />
      </div>
      <p
        v-else
        class="rounded-xl border-2 border-dashed border-gray-700 p-4 text-center text-sm text-gray-500"
      >
        No hay coincidencias. Puedes crear un jugador sin cuenta abajo.
      </p>
    </section>

    <button
      v-if="!showCreateForm"
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-gray-600 p-4 text-gray-300 transition-colors hover:border-primary hover:text-primary"
      @click="showCreateForm = true"
    >
      + Crear jugador sin cuenta
    </button>

    <ParticipantForm
      v-else
      submit-label="Crear y añadir"
      :is-saving="isSaving"
      :initial-values="{ displayName: searchQuery }"
      @submit="handleCreate"
      @cancel="showCreateForm = false"
    />

    <p
      v-if="errorMessage"
      class="rounded-lg bg-secondary/20 p-4 text-secondary"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <section class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Mis amigos
      </p>

      <p v-if="isLoading" class="text-gray-400">Cargando amigos...</p>

      <TransitionGroup
        v-else
        name="slide"
        tag="div"
        class="space-y-3"
      >
        <FriendCard
          v-for="friend in filteredFriends"
          :key="friend.friendshipId"
          :friend="friend"
          :aliases="aliasMap[managedParticipantId(friend) ?? ''] ?? []"
          :can-manage-aliases="canManageAliases(friend)"
          :is-expanded="expandedId === friend.friendshipId"
          :is-saving="isSaving"
          @toggle="handleToggleFriend(friend.friendshipId)"
          @disable="disableFriend(friend.friendshipId)"
          @add-alias="
            managedParticipantId(friend) &&
              addAlias(managedParticipantId(friend)!, $event)
          "
          @remove-alias="
            managedParticipantId(friend) &&
              removeAlias(managedParticipantId(friend)!, $event)
          "
        />
      </TransitionGroup>

      <p
        v-if="!isLoading && filteredFriends.length === 0"
        class="rounded-lg border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
      >
        {{
          searchQuery.trim()
            ? "No tienes amigos con ese nombre."
            : "Aún no tienes amigos. Busca arriba o crea un jugador sin cuenta."
        }}
      </p>
    </section>
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
