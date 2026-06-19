<script setup lang="ts">
import { ref } from "vue"
import ParticipantAliasManager from "@/components/participants/ParticipantAliasManager.vue"
import UserAvatar from "@/components/ui/UserAvatar.vue"
import type { FriendListItem } from "@/domain/types/friendship"
import type { ParticipantAlias } from "@/domain/types/participant"

defineProps<{
  friend: FriendListItem
  aliases: ParticipantAlias[]
  canManageAliases: boolean
  isExpanded: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  toggle: []
  disable: []
  addAlias: [alias: string]
  removeAlias: [aliasId: string]
}>()

const isConfirmingDisable = ref(false)

function handleDisable() {
  if (!isConfirmingDisable.value) {
    isConfirmingDisable.value = true
    return
  }

  emit("disable")
  isConfirmingDisable.value = false
}
</script>

<template>
  <article
    class="rounded-lg border-4 border-primary/30 bg-dark/60 transition-colors"
    :class="{ 'border-primary ring-2 ring-primary/20': isExpanded }"
  >
    <div class="flex items-center gap-4 p-3">
      <button
        type="button"
        class="min-w-0 flex-1 text-left"
        @click="emit('toggle')"
      >
        <UserAvatar
          :display-name="friend.displayName"
          :avatar-url="friend.avatarUrl"
          :color-class="friend.color"
          variant="dark"
        />
      </button>

      <button
        type="button"
        class="rounded-lg px-2 py-1 text-sm"
        :class="
          isConfirmingDisable
            ? 'bg-secondary text-dark'
            : 'text-gray-400 hover:text-secondary'
        "
        :disabled="isSaving"
        @click="handleDisable"
      >
        {{ isConfirmingDisable ? "Confirmar" : "Quitar" }}
      </button>
    </div>

    <div class="flex flex-wrap gap-2 px-3 pb-2">
      <span
        v-if="friend.kind === 'profile'"
        class="rounded-full bg-tertiary/20 px-2 py-0.5 text-xs text-tertiary"
      >
        Cuenta vinculada
      </span>
      <span
        v-else
        class="rounded-full bg-board/20 px-2 py-0.5 text-xs text-board"
      >
        Sin cuenta aún
      </span>
      <span
        v-if="friend.sessionCount > 0"
        class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
      >
        {{ friend.sessionCount }} partidas
      </span>
    </div>

    <div
      v-if="isExpanded && canManageAliases"
      class="px-3 pb-4"
    >
      <ParticipantAliasManager
        :aliases="aliases"
        :is-saving="isSaving"
        @add="emit('addAlias', $event)"
        @remove="emit('removeAlias', $event)"
      />
    </div>
  </article>
</template>
