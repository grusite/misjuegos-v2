<script setup lang="ts">
import { computed } from "vue"
import { Icon } from "@iconify/vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

const props = withDefaults(
  defineProps<{
    team?: PlayerTeamWithMembers
    name?: string
    memberCount?: number
    accent?: "board" | "tertiary" | "primary"
    size?: "compact" | "sm" | "md"
    showName?: boolean
    showMembers?: boolean
    interactive?: boolean
  }>(),
  {
    team: undefined,
    name: undefined,
    memberCount: undefined,
    accent: "primary",
    size: "md",
    showName: true,
    showMembers: false,
    interactive: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

const displayName = computed(() => props.team?.name ?? props.name ?? "")
const displayMemberCount = computed(
  () => props.team?.members.length ?? props.memberCount ?? 0,
)

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

const layoutClasses = computed(() => {
  if (props.size === "compact") {
    return {
      pill: "max-w-[7.5rem] gap-1.5 px-1.5 py-0.5",
      icon: "h-6 w-6",
      iconGlyph: "h-3.5 w-3.5",
      name: "text-xs",
      count: "text-[9px]",
    }
  }

  if (props.size === "sm") {
    return {
      pill: "gap-1.5 px-1.5 py-0.5",
      icon: "h-7 w-7",
      iconGlyph: "h-3.5 w-3.5",
      name: "text-xs",
      count: "text-[10px]",
    }
  }

  return {
    pill: "gap-2 px-2 py-1",
    icon: "h-8 w-8",
    iconGlyph: "h-4 w-4",
    name: "text-sm",
    count: "text-[10px]",
  }
})

const memberCountLabel = computed(() => {
  const count = displayMemberCount.value
  return `${count} jugador${count === 1 ? "" : "es"}`
})
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    type="button"
    class="inline-flex max-w-full items-center rounded-full border-2 bg-dark/80 text-left transition-colors"
    :class="[
      layoutClasses.pill,
      accentBorderClass,
      interactive
        ? 'hover:bg-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
        : '',
    ]"
    @click="interactive ? emit('click') : undefined"
  >
    <div
      class="flex shrink-0 items-center justify-center rounded-full border-2"
      :class="[layoutClasses.icon, accentBorderClass]"
    >
      <Icon
        icon="mdi:account-group"
        :class="[layoutClasses.iconGlyph, accentTextClass]"
        aria-hidden="true"
      />
    </div>

    <div
      v-if="showName"
      class="min-w-0"
    >
      <p
        class="truncate font-semibold"
        :class="[layoutClasses.name, accentTextClass]"
        :title="displayName"
      >
        {{ displayName }}
      </p>
      <p
        class="text-gray-500"
        :class="layoutClasses.count"
      >
        {{ memberCountLabel }}
      </p>
    </div>

    <div
      v-if="showMembers && team && team.members.length > 0"
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
