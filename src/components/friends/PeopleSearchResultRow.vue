<script setup lang="ts">
import { Icon } from "@iconify/vue"
import UiButton from "@/components/ui/UiButton.vue"
import UserAvatar from "@/components/ui/UserAvatar.vue"
import type { PeopleSearchResult } from "@/domain/types/friendship"

defineProps<{
  result: PeopleSearchResult
  isSaving?: boolean
}>()

const emit = defineEmits<{
  add: []
}>()

function sessionLabel(count: number): string {
  if (count === 0) return "Sin partidas"
  if (count === 1) return "1 partida"
  return `${count} partidas`
}
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 p-3"
  >
    <UserAvatar
      :display-name="result.displayName"
      :avatar-url="result.avatarUrl"
      :color-class="result.color"
      variant="dark"
    />

    <div class="min-w-0 flex-1">
      <p class="truncate font-semibold text-gray-100">{{ result.displayName }}</p>
      <p class="text-xs text-gray-500">
        {{
          result.kind === "profile"
            ? "Usuario con cuenta"
            : sessionLabel(result.sessionCount)
        }}
      </p>
    </div>

    <UiButton
      v-if="!result.alreadyFriend"
      type="button"
      size="compact"
      :disabled="isSaving"
      @click="emit('add')"
    >
      Añadir
    </UiButton>
    <span
      v-else
      class="inline-flex items-center gap-1 text-xs font-semibold text-primary"
    >
      <Icon icon="mdi:check" class="h-4 w-4" aria-hidden="true" />
      Amigo
    </span>
  </div>
</template>
