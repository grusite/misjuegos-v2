import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { PlayerTeamFormValues } from "@/domain/schemas/playerTeam"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import { DbError, getDbErrorMessage } from "@/services/errors"
import { playerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"
import {
  removeTeamPhotoFile,
  uploadTeamPhotoFile,
} from "@/services/playerTeams/teamPhotoStorage"

export type TeamAvatarInput = {
  file?: File | null
  remove?: boolean
}

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
      teams.value = await playerTeamsRepository.listAccessible(ownerId.value)
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

  async function applyTeamAvatar(
    teamId: string,
    avatar: TeamAvatarInput | undefined,
    previousPath: string | null,
  ): Promise<PlayerTeamWithMembers | null> {
    if (!ownerId.value || !avatar) return null

    if (avatar.remove) {
      await removeTeamPhotoFile(previousPath)
      return playerTeamsRepository.update(teamId, { photoPath: null })
    }

    if (!avatar.file) return null

    const photoPath = await uploadTeamPhotoFile({
      userId: ownerId.value,
      teamId,
      file: avatar.file,
      previousPath,
    })

    return playerTeamsRepository.update(teamId, { photoPath })
  }

  async function createTeam(values: PlayerTeamFormValues, avatar?: TeamAvatarInput) {
    if (!ownerId.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      const created = await playerTeamsRepository.create(ownerId.value, {
        name: values.name,
        description: values.description || null,
        participantIds: values.participantIds,
      })

      const withAvatar = (await applyTeamAvatar(created.id, avatar, null)) ?? created
      teams.value = sortTeams([...teams.value, withAvatar])
    } catch (error) {
      errorMessage.value = teamNameConflictMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateTeam(
    id: string,
    values: PlayerTeamFormValues,
    avatar?: TeamAvatarInput,
  ) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const current = teams.value.find(team => team.id === id)
      const updated = await playerTeamsRepository.update(id, {
        name: values.name,
        description: values.description || null,
        participantIds: values.participantIds,
      })

      const withAvatar =
        (await applyTeamAvatar(id, avatar, current?.photoPath ?? null)) ?? updated

      teams.value = sortTeams(
        teams.value.map(team => (team.id === id ? withAvatar : team)),
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
      const current = teams.value.find(team => team.id === id)
      await playerTeamsRepository.remove(id)
      await removeTeamPhotoFile(current?.photoPath)
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
