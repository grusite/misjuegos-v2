<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import { outcomeToneStyles } from "@/lib/utils/outcomeStyles"

const props = defineProps<{
  team: PlayerTeamWithMembers
  isSaving?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()

const namesSummary = computed(() => {
  const names = props.team.members.map(member => member.displayName)
  if (names.length === 0) return "Sin jugadores"
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`
})

const actions = computed(() => {
  type ActionTone = keyof typeof outcomeToneStyles

  const items: Array<{
    key: string
    label: string
    icon: string
    tone: ActionTone
    handler: () => void
  }> = [
    {
      key: "edit",
      label: "Editar",
      icon: "mdi:pencil-outline",
      tone: "neutral" as const,
      handler: () => emit("edit"),
    },
  ]

  if (props.canDelete) {
    items.push({
      key: "remove",
      label: "Borrar",
      icon: "mdi:delete-outline",
      tone: "failure" as const,
      handler: () => emit("remove"),
    })
  }

  return items
})

function actionClasses(tone: keyof typeof outcomeToneStyles) {
  return `border-gray-700 text-gray-400 ${outcomeToneStyles[tone].idle}`
}
</script>

<template>
  <article class="space-y-3 rounded-xl border-4 border-gray-700 p-4 transition-colors hover:border-primary">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gray-700 bg-gray-900"
        >
          <img
            v-if="team.photoUrl"
            :src="team.photoUrl"
            :alt="`Avatar de ${team.name}`"
            class="h-full w-full object-cover"
          />
          <Icon
            v-else
            icon="mdi:account-group"
            class="h-7 w-7 text-gray-500"
            aria-hidden="true"
          />
        </div>

        <div class="min-w-0 space-y-1">
          <h3 class="text-lg font-bold text-primary">{{ team.name }}</h3>
          <p
            v-if="team.description"
            class="text-sm text-gray-400"
          >
            {{ team.description }}
          </p>
        </div>
      </div>

      <div
        v-if="team.members.length > 0"
        class="flex shrink-0 items-center"
      >
        <ParticipantBubble
          v-for="(member, index) in team.members.slice(0, 5)"
          :key="member.id"
          :display-name="member.displayName"
          :avatar-url="member.avatarUrl"
          :color-class="member.color"
          size="md"
          class="-ml-3 first:ml-0"
          :style="{ zIndex: team.members.length - index }"
        />
        <span
          v-if="team.members.length > 5"
          class="-ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-gray-200 ring-2 ring-dark"
        >
          +{{ team.members.length - 5 }}
        </span>
      </div>
    </div>

    <p class="text-sm text-gray-300">{{ namesSummary }}</p>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-center text-[11px] font-semibold leading-tight transition-colors disabled:opacity-50"
        :class="actionClasses(action.tone)"
        :disabled="isSaving"
        :aria-label="action.label"
        @click="action.handler"
      >
        <Icon
          :icon="action.icon"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        />
        <span>{{ action.label }}</span>
      </button>
    </div>
  </article>
</template>
