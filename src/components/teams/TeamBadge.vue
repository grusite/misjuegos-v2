<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

const props = withDefaults(
  defineProps<{
    team: PlayerTeamWithMembers
    accent?: "board" | "tertiary" | "primary"
    size?: "sm" | "md"
    showName?: boolean
    interactive?: boolean
  }>(),
  {
    accent: "primary",
    size: "md",
    showName: true,
    interactive: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

const accentBorderClass = computed(() => {
  if (props.accent === "tertiary") return "border-tertiary/50"
  if (props.accent === "board") return "border-board/50"
  return "border-primary/50"
})

const accentTextClass = computed(() => {
  if (props.accent === "tertiary") return "text-tertiary"
  if (props.accent === "board") return "text-board"
  return "text-primary"
})

const bubbleSize = computed(() => (props.size === "md" ? "md" : "sm"))
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    type="button"
    class="inline-flex max-w-full items-center gap-2 rounded-full border-2 bg-dark/80 px-2 py-1 text-left transition-colors"
    :class="[
      accentBorderClass,
      interactive ? 'hover:bg-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60' : '',
    ]"
    @click="interactive ? emit('click') : undefined"
  >
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
      :class="accentBorderClass"
    >
      <Icon
        icon="mdi:account-group"
        class="h-4 w-4"
        :class="accentTextClass"
        aria-hidden="true"
      />
    </div>

    <div
      v-if="showName"
      class="min-w-0"
    >
      <p
        class="truncate text-sm font-semibold"
        :class="accentTextClass"
      >
        {{ team.name }}
      </p>
      <p class="text-[10px] text-gray-500">
        {{ team.members.length }} jugadores
      </p>
    </div>

    <div
      v-if="team.members.length > 0"
      class="flex items-center pr-1"
    >
      <ParticipantBubble
        v-for="(member, index) in team.members.slice(0, 3)"
        :key="member.id"
        :display-name="member.displayName"
        :avatar-url="member.avatarUrl"
        :color-class="member.color"
        :size="bubbleSize"
        class="-ml-2 first:ml-0"
        :style="{ zIndex: team.members.length - index }"
      />
    </div>
  </component>
</template>
