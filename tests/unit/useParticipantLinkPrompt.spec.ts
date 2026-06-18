import { beforeEach, describe, expect, it, vi } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { useParticipantLinkPrompt } from "@/composables/useParticipantLinkPrompt"
import { useAuthStore } from "@/stores/authStore"

vi.mock("@/services/auth/authService", () => ({
  ensureProfile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/services/accountLinking/participantLinkService", () => ({
  findParticipantLinkCandidates: vi.fn(),
  claimParticipantLink: vi.fn(),
  skipParticipantLinkPrompt: vi.fn(),
  fetchParticipantLinkPromptCompleted: vi.fn(),
}))

vi.mock("@/services/participants/participantsRepository", () => ({
  participantsRepository: {
    findByProfileId: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/services/participants/participantBootstrap", () => ({
  ensureSelfParticipant: vi.fn().mockResolvedValue({ id: "self-1" }),
  deduplicateLinkedParticipants: vi.fn().mockResolvedValue(undefined),
  syncFriendsFromAllSessions: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/services/cache/memoryCache", () => ({
  appDataCache: {
    invalidate: vi.fn(),
  },
}))

import {
  findParticipantLinkCandidates,
  fetchParticipantLinkPromptCompleted,
  skipParticipantLinkPrompt,
  claimParticipantLink,
} from "@/services/accountLinking/participantLinkService"
import { participantsRepository } from "@/services/participants/participantsRepository"

function setProfile(displayName: string, id = "user-1") {
  const authStore = useAuthStore()
  authStore.$patch({
    profile: {
      id,
      displayName,
      avatarUrl: null,
    },
  })
}

describe("useParticipantLinkPrompt", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(fetchParticipantLinkPromptCompleted).mockResolvedValue(false)
    vi.mocked(participantsRepository.findByProfileId).mockResolvedValue(null)
  })

  it("opens the modal when candidates exist", async () => {
    setProfile("Eduardo")

    vi.mocked(findParticipantLinkCandidates).mockResolvedValue([
      {
        id: "p-edu",
        displayName: "Eduardo",
        color: "#fff",
        sessionCount: 12,
        matchKind: "exact",
      },
    ])

    const prompt = useParticipantLinkPrompt()
    const pending = await prompt.evaluatePrompt()

    expect(findParticipantLinkCandidates).toHaveBeenCalledWith("Eduardo")
    expect(pending).toBe(true)
    expect(prompt.isOpen.value).toBe(true)
    expect(prompt.candidates.value).toHaveLength(1)
  })

  it("auto-completes when prompt was already answered", async () => {
    setProfile("Jorge Martin")

    vi.mocked(fetchParticipantLinkPromptCompleted).mockResolvedValue(true)

    const prompt = useParticipantLinkPrompt()
    const pending = await prompt.evaluatePrompt()

    expect(pending).toBe(false)
    expect(findParticipantLinkCandidates).not.toHaveBeenCalled()
  })

  it("claims a participant on confirm", async () => {
    setProfile("Eduardo")

    vi.mocked(findParticipantLinkCandidates).mockResolvedValue([
      {
        id: "p-edu",
        displayName: "Eduardo",
        color: null,
        sessionCount: 3,
        matchKind: "exact",
      },
    ])
    vi.mocked(participantsRepository.getById).mockResolvedValue({
      id: "p-edu",
      ownerId: "owner-1",
      profileId: null,
      displayName: "Eduardo",
      color: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    const prompt = useParticipantLinkPrompt()
    await prompt.evaluatePrompt()
    await prompt.confirmLink("p-edu")

    expect(claimParticipantLink).toHaveBeenCalledWith("p-edu")
    expect(prompt.state.value).toBe("completed")
  })

  it("opens the modal when no candidates match", async () => {
    setProfile("Nuevo", "user-2")

    vi.mocked(findParticipantLinkCandidates).mockResolvedValue([])

    const prompt = useParticipantLinkPrompt()
    const pending = await prompt.evaluatePrompt()

    expect(skipParticipantLinkPrompt).not.toHaveBeenCalled()
    expect(pending).toBe(true)
    expect(prompt.isOpen.value).toBe(true)
    expect(prompt.candidates.value).toHaveLength(0)
  })

  it("re-evaluates after switching profile", async () => {
    setProfile("Eduardo", "user-1")

    vi.mocked(findParticipantLinkCandidates).mockResolvedValue([
      {
        id: "p-edu",
        displayName: "Eduardo",
        color: null,
        sessionCount: 1,
        matchKind: "exact",
      },
    ])

    const prompt = useParticipantLinkPrompt()
    await prompt.evaluatePrompt()
    await prompt.declineLink()

    setProfile("Nuevo", "user-2")
    vi.mocked(fetchParticipantLinkPromptCompleted).mockResolvedValue(false)
    vi.mocked(participantsRepository.findByProfileId).mockResolvedValue(null)
    vi.mocked(findParticipantLinkCandidates).mockResolvedValue([])

    const pending = await prompt.evaluatePrompt()

    expect(pending).toBe(true)
    expect(prompt.isOpen.value).toBe(true)
  })

  it("skips linking on decline", async () => {
    setProfile("Eduardo", "user-3")

    vi.mocked(findParticipantLinkCandidates).mockResolvedValue([
      {
        id: "p-edu",
        displayName: "Eduardo",
        color: null,
        sessionCount: 1,
        matchKind: "exact",
      },
    ])

    const prompt = useParticipantLinkPrompt()
    await prompt.evaluatePrompt()
    await prompt.declineLink()

    expect(skipParticipantLinkPrompt).toHaveBeenCalled()
    expect(prompt.state.value).toBe("completed")
  })
})
