import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { PlayerTeamFormValues } from "@/domain/schemas/playerTeam"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import { DbError, getDbErrorMessage } from "@/services/errors"
import { playerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"

export function usePlayerTeams() {
  const authStore = useAuthStore()
  const ownerId = computed(() => authStore.profile?.id ?? null)

  const teams = ref<PlayerTeamWithMembers[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  async function load() {
    if (!ownerId.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      teams.value = await playerTeamsRepository.listForOwner(ownerId.value)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  function teamNameConflictMessage(error: unknown): string {
    if (error instanceof DbError && error.code === "23505") {
      return "Ya existe un equipo con ese nombre"
    }

    return getDbErrorMessage(error)
  }

  async function createTeam(values: PlayerTeamFormValues) {
    if (!ownerId.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      const created = await playerTeamsRepository.create(ownerId.value, {
        name: values.name,
        description: values.description || null,
        participantIds: values.participantIds,
      })

      teams.value = sortTeams([...teams.value, created])
    } catch (error) {
      errorMessage.value = teamNameConflictMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateTeam(id: string, values: PlayerTeamFormValues) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const updated = await playerTeamsRepository.update(id, {
        name: values.name,
        description: values.description || null,
        participantIds: values.participantIds,
      })

      teams.value = sortTeams(
        teams.value.map(team => (team.id === id ? updated : team)),
      )
    } catch (error) {
      errorMessage.value = teamNameConflictMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function removeTeam(id: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await playerTeamsRepository.remove(id)
      teams.value = teams.value.filter(team => team.id !== id)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  function sortTeams(list: PlayerTeamWithMembers[]): PlayerTeamWithMembers[] {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"))
  }

  onMounted(() => {
    void load()
  })

  return {
    teams,
    isLoading,
    isSaving,
    errorMessage,
    load,
    createTeam,
    updateTeam,
    removeTeam,
  }
}
