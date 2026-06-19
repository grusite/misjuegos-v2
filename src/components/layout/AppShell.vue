<script setup lang="ts">
import { RouterView } from "vue-router"
import { storeToRefs } from "pinia"
import { watch } from "vue"
import AppTopBar from "@/components/layout/AppTopBar.vue"
import ParticipantLinkModal from "@/components/accountLinking/ParticipantLinkModal.vue"
import { useParticipantLinkPrompt } from "@/composables/useParticipantLinkPrompt"
import { useAuthStore } from "@/stores/authStore"

const authStore = useAuthStore()
const { profile, isInitialized } = storeToRefs(authStore)

const {
  candidates,
  searchResults,
  searchQuery,
  isSearching,
  isOpen,
  errorMessage,
  evaluatePrompt,
  confirmLink,
  declineLink,
  state,
} = useParticipantLinkPrompt()

watch(
  [profile, isInitialized],
  async ([currentProfile, initialized]) => {
    if (!initialized || !currentProfile) return
    await evaluatePrompt()
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-dark">
    <AppTopBar />

    <main class="m-auto min-h-screen max-w-lg scroll-pt-24 p-4 pt-[calc(4.75rem+env(safe-area-inset-top))]">
      <p
        v-if="errorMessage"
        class="mb-4 rounded-lg bg-secondary/20 p-3 text-sm text-secondary"
      >
        {{ errorMessage }}
      </p>

      <RouterView />
    </main>

    <ParticipantLinkModal
      v-if="profile"
      :open="isOpen"
      :display-name="profile.displayName"
      :candidates="candidates"
      :search-results="searchResults"
      :search-query="searchQuery"
      :is-searching="isSearching"
      :is-submitting="state === 'completing'"
      @update:search-query="searchQuery = $event"
      @select="confirmLink"
      @decline="declineLink"
    />
  </div>
</template>
