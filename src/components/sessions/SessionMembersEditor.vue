<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Icon } from "@iconify/vue"
import SessionParticipantPicker from "@/components/sessions/SessionParticipantPicker.vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import type { Participant } from "@/domain/types/participant"

type SessionMemberView = {
  id: string
  displayName: string
  participantId: string | null
  color: string | null
  avatarUrl: string | null
}

const props = withDefaults(
  defineProps<{
    members: SessionMemberView[]
    participants: Participant[]
    selfParticipantId?: string | null
    accent?: "board" | "tertiary"
    canWrite?: boolean
    isSaving?: boolean
    createParticipant?: (displayName: string) => Promise<Participant | null>
    applySelection: (participantIds: string[]) => Promise<boolean>
  }>(),
  {
    selfParticipantId: null,
    accent: "board",
    canWrite: false,
    isSaving: false,
    createParticipant: undefined,
  },
)

const selectedIds = ref<string[]>([])
const pickerRef = ref<InstanceType<typeof SessionParticipantPicker> | null>(null)

const accentBorderClass = computed(() =>
  props.accent === "tertiary" ? "border-tertiary/40" : "border-board/40",
)

const accentTextClass = computed(() =>
  props.accent === "tertiary" ? "text-tertiary" : "text-board",
)

const accentHoverClass = computed(() =>
  props.canWrite
    ? props.accent === "tertiary"
      ? "hover:border-tertiary/70 hover:bg-tertiary/5"
      : "hover:border-board/70 hover:bg-board/5"
    : "",
)

const memberSummaries = computed(() =>
  props.members.map(member => {
    const participant = props.participants.find(
      item => item.id === member.participantId,
    )

    return {
      ...member,
      color: member.color ?? participant?.color ?? null,
      avatarUrl: member.avatarUrl ?? participant?.avatarUrl ?? null,
    }
  }),
)

const namesSummary = computed(() => {
  const names = memberSummaries.value.map(member => member.displayName)
  if (names.length === 0) return "Sin jugadores"
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`
})

watch(
  () => props.members,
  members => {
    selectedIds.value = members
      .map(member => member.participantId)
      .filter((id): id is string => Boolean(id))
  },
  { immediate: true, deep: true },
)

function openPicker() {
  if (!props.canWrite || props.isSaving) return
  pickerRef.value?.openPicker()
}
</script>

<template>
  <section
    class="rounded-xl border-2 border-dashed p-4 transition-colors"
    :class="[accentBorderClass, accentHoverClass]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-3">
        <p class="text-xs uppercase tracking-wide text-gray-500">Jugadores</p>

        <div
          v-if="memberSummaries.length > 0"
          class="flex items-center"
        >
          <ParticipantBubble
            v-for="(member, index) in memberSummaries.slice(0, 6)"
            :key="member.id"
            :display-name="member.displayName"
            :avatar-url="member.avatarUrl"
            :color-class="member.color"
            size="md"
            class="-ml-3 first:ml-0"
            :style="{ zIndex: memberSummaries.length - index }"
          />
          <span
            v-if="memberSummaries.length > 6"
            class="-ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-gray-200 ring-2 ring-dark"
          >
            +{{ memberSummaries.length - 6 }}
          </span>
        </div>

        <p class="text-sm text-gray-300">{{ namesSummary }}</p>
      </div>

      <button
        v-if="canWrite"
        type="button"
        class="flex shrink-0 items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-transform hover:scale-105 disabled:opacity-50"
        :class="`${accentBorderClass} ${accentTextClass}`"
        :disabled="isSaving"
        @click="openPicker"
      >
        <Icon
          icon="mdi:account-edit"
          class="h-4 w-4"
          aria-hidden="true"
        />
        Editar
      </button>
    </div>

    <button
      v-if="canWrite"
      type="button"
      class="mt-3 w-full rounded-lg border border-dashed border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
      :disabled="isSaving"
      @click="openPicker"
    >
      Toca para cambiar quién jugó
    </button>

    <SessionParticipantPicker
      ref="pickerRef"
      v-model="selectedIds"
      :participants="participants"
      :self-participant-id="selfParticipantId"
      :accent="accent"
      :create-participant="createParticipant"
      :apply-selection="applySelection"
      :disabled="!canWrite || isSaving"
      label="Jugadores"
      done-label="Guardar jugadores"
      hide-trigger
    />
  </section>
</template>
