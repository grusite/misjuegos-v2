<script setup lang="ts">
import { ref } from "vue"
import ParticipantAliasManager from "@/components/participants/ParticipantAliasManager.vue"
import UserAvatar from "@/components/ui/UserAvatar.vue"
import type { ParticipantWithAliases } from "@/domain/types/participant"

defineProps<{
  participant: ParticipantWithAliases
  isExpanded: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  toggle: []
  edit: []
  remove: []
  addAlias: [alias: string]
  removeAlias: [aliasId: string]
}>()

const isConfirmingDelete = ref(false)

function handleRemove() {
  if (!isConfirmingDelete.value) {
    isConfirmingDelete.value = true
    return
  }

  emit("remove")
  isConfirmingDelete.value = false
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
          :display-name="participant.displayName"
          :color-class="participant.color"
          variant="dark"
        />
      </button>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-sm text-gray-400 hover:text-primary"
          @click="emit('edit')"
        >
          Editar
        </button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-sm"
          :class="
            isConfirmingDelete
              ? 'bg-secondary text-dark'
              : 'text-gray-400 hover:text-secondary'
          "
          @click="handleRemove"
        >
          {{ isConfirmingDelete ? "Confirmar" : "Eliminar" }}
        </button>
      </div>
    </div>

    <div
      v-if="participant.profileId"
      class="px-3 pb-2"
    >
      <span class="rounded-full bg-tertiary/20 px-2 py-0.5 text-xs text-tertiary">
        Cuenta vinculada
      </span>
    </div>

    <div
      v-if="isExpanded"
      class="px-3 pb-4"
    >
      <ParticipantAliasManager
        :aliases="participant.aliases"
        :is-saving="isSaving"
        @add="emit('addAlias', $event)"
        @remove="emit('removeAlias', $event)"
      />
    </div>
  </article>
</template>
