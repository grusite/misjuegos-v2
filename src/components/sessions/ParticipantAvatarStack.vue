<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import ParticipantBubble from "@/components/ui/ParticipantBubble.vue"
import type { SessionMemberPreview } from "@/domain/types/session"

const props = withDefaults(
  defineProps<{
    members: SessionMemberPreview[]
    maxVisible?: number
    accent?: "primary" | "board" | "tertiary"
  }>(),
  {
    maxVisible: 4,
    accent: "tertiary",
  },
)

const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const popoverStyle = ref({ top: "0px", left: "0px" })

const visibleMembers = computed(() => props.members.slice(0, props.maxVisible))
const hiddenCount = computed(() =>
  Math.max(0, props.members.length - props.maxVisible),
)

const focusRingClass = computed(() => {
  if (props.accent === "tertiary") return "focus-visible:ring-tertiary/60"
  if (props.accent === "board") return "focus-visible:ring-board/60"
  return "focus-visible:ring-primary/60"
})

function updatePopoverPosition() {
  if (!root.value) return

  const rect = root.value.getBoundingClientRect()
  const width = 176

  popoverStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)}px`,
  }
}

function toggleOpen(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (props.members.length === 0) return

  isOpen.value = !isOpen.value
  if (isOpen.value) updatePopoverPosition()
}

function close() {
  isOpen.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value || !root.value) return
  if (!root.value.contains(event.target as Node)) close()
}

function onViewportChange() {
  if (isOpen.value) updatePopoverPosition()
}

watch(isOpen, open => {
  if (open) updatePopoverPosition()
})

onMounted(() => {
  document.addEventListener("click", onDocumentClick)
  window.addEventListener("resize", onViewportChange)
  window.addEventListener("scroll", onViewportChange, true)
})

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick)
  window.removeEventListener("resize", onViewportChange)
  window.removeEventListener("scroll", onViewportChange, true)
})
</script>

<template>
  <div
    v-if="members.length > 0"
    ref="root"
    class="relative shrink-0"
    :class="isOpen ? 'z-[80]' : 'z-10'"
  >
    <button
      type="button"
      class="flex items-center rounded-full outline-none focus-visible:ring-2"
      :class="focusRingClass"
      :aria-expanded="isOpen"
      :aria-label="`Ver ${members.length} jugador${members.length === 1 ? '' : 'es'}`"
      @click="toggleOpen"
      @mousedown.stop
      @touchstart.stop
    >
      <div class="flex items-center pl-0.5">
        <ParticipantBubble
          v-for="(member, index) in visibleMembers"
          :key="member.id"
          :display-name="member.displayName"
          :avatar-url="member.avatarUrl"
          :color-class="member.colorClass"
          ring-class="ring-dark"
          class="-ml-2 first:ml-0"
          :style="{ zIndex: index + 1 }"
        />
        <div
          v-if="hiddenCount > 0"
          class="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-gray-300 ring-2 ring-dark"
          :style="{ zIndex: visibleMembers.length + 1 }"
        >
          +{{ hiddenCount }}
        </div>
      </div>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed z-[100] min-w-[11rem] rounded-xl border-2 border-gray-700 bg-dark p-2 shadow-2xl"
        :style="popoverStyle"
        @click.stop
        @mousedown.stop
        @touchstart.stop
      >
        <p class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Jugadores
        </p>
        <ul class="space-y-1">
          <li
            v-for="member in members"
            :key="member.id"
            class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-200"
          >
            <ParticipantBubble
              :display-name="member.displayName"
              :avatar-url="member.avatarUrl"
              :color-class="member.colorClass"
              size="md"
            />
            <span class="min-w-0 truncate">{{ member.displayName }}</span>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>
