import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { useAuthStore } from "@/stores/authStore"

describe("authStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("starts unauthenticated", () => {
    const authStore = useAuthStore()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.profile).toBeNull()
  })

  it("loginMock sets profile and isAuthenticated", () => {
    const authStore = useAuthStore()

    authStore.loginMock("Ana")

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.profile?.displayName).toBe("Ana")
  })

  it("logout clears profile", () => {
    const authStore = useAuthStore()
    authStore.loginMock()
    authStore.logout()

    expect(authStore.isAuthenticated).toBe(false)
  })
})
