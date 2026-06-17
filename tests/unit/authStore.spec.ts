import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/stores/authStore"

vi.mock("@/services/auth/authService", () => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  fetchProfile: vi.fn(),
  profileFromMetadata: vi.fn(
    (userId: string, metadata: { full_name?: string }) => ({
      id: userId,
      displayName: metadata.full_name ?? "Usuario",
      avatarUrl: null,
    }),
  ),
  signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
}))

import * as authService from "@/services/auth/authService"

describe("authStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(authService.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
  })

  it("starts unauthenticated", () => {
    const authStore = useAuthStore()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.profile).toBeNull()
  })

  it("init loads profile when session exists", async () => {
    vi.mocked(authService.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
            user_metadata: { full_name: "Ana" },
          },
        },
      },
      error: null,
    } as Awaited<ReturnType<typeof authService.getSession>>)

    vi.mocked(authService.fetchProfile).mockResolvedValue({
      id: "user-1",
      displayName: "Ana",
      avatarUrl: null,
    })

    const authStore = useAuthStore()
    await authStore.init()

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.profile?.displayName).toBe("Ana")
    expect(authStore.isInitialized).toBe(true)
  })

  it("logout clears profile", async () => {
    vi.mocked(authService.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
            user_metadata: { full_name: "Ana" },
          },
        },
      },
      error: null,
    } as Awaited<ReturnType<typeof authService.getSession>>)

    vi.mocked(authService.fetchProfile).mockResolvedValue({
      id: "user-1",
      displayName: "Ana",
      avatarUrl: null,
    })

    const authStore = useAuthStore()
    await authStore.init()
    await authStore.logout()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authService.signOut).toHaveBeenCalled()
  })
})
