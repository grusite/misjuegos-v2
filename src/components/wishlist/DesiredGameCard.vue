<script setup lang="ts">
import { computed, ref } from "vue"
import { Icon } from "@iconify/vue"
import DesiredGamePhotoSection from "@/components/wishlist/DesiredGamePhotoSection.vue"
import type { DesiredGame } from "@/domain/types/desiredGame"
import { outcomeToneStyles } from "@/lib/utils/outcomeStyles"

const props = defineProps<{
  item: DesiredGame
  isSaving?: boolean
}>()

const emit = defineEmits<{
  edit: []
  markPlayed: []
  markDropped: []
  reactivate: []
  remove: []
}>()

const showPhotos = ref(false)

const isEscape = computed(() => props.item.type === "escape_room")

const cardHoverClass = computed(() =>
  isEscape.value
    ? "border-gray-700 hover:border-tertiary"
    : "border-gray-700 hover:border-board",
)

const titleClass = computed(() =>
  isEscape.value ? "text-tertiary" : "text-board",
)

const badgeClass = computed(() =>
  isEscape.value
    ? "border-tertiary/40 text-tertiary"
    : "border-board/40 text-board",
)

const typeLabel = computed(() =>
  isEscape.value ? "Escape" : "Mesa",
)

const priorityLabel = computed(() => {
  if (props.item.priority === 3) return "Alta"
  if (props.item.priority === 2) return "Media"
  if (props.item.priority === 1) return "Baja"
  return null
})

const locationLine = computed(() => {
  if (!isEscape.value) return null

  const parts = [props.item.city, props.item.venue].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
})

const statusLabel = computed(() => {
  if (props.item.status === "played") return "Jugado"
  if (props.item.status === "dropped") return "Descartado"
  return null
})

const activeActions = computed(() => [
  {
    key: "edit",
    label: "Editar",
    icon: "mdi:pencil-outline",
    tone: "neutral" as const,
    handler: () => emit("edit"),
  },
  {
    key: "played",
    label: "Jugado",
    icon: "mdi:check-circle-outline",
    tone: "success" as const,
    handler: () => emit("markPlayed"),
  },
  {
    key: "dropped",
    label: "Descartar",
    icon: "mdi:archive-arrow-down-outline",
    tone: "unknown" as const,
    handler: () => emit("markDropped"),
  },
  {
    key: "remove",
    label: "Borrar",
    icon: "mdi:delete-outline",
    tone: "failure" as const,
    handler: () => emit("remove"),
  },
])

const archivedActions = computed(() => [
  {
    key: "edit",
    label: "Editar",
    icon: "mdi:pencil-outline",
    tone: "neutral" as const,
    handler: () => emit("edit"),
  },
  {
    key: "reactivate",
    label: "Reactivar",
    icon: "mdi:restore",
    tone: "success" as const,
    handler: () => emit("reactivate"),
  },
  {
    key: "remove",
    label: "Borrar",
    icon: "mdi:delete-outline",
    tone: "failure" as const,
    handler: () => emit("remove"),
  },
])

const actions = computed(() =>
  props.item.status === "active" ? activeActions.value : archivedActions.value,
)

const actionGridClass = computed(() =>
  props.item.status === "active" ? "grid-cols-4" : "grid-cols-3",
)

function actionClasses(tone: keyof typeof outcomeToneStyles) {
  return `border-gray-700 text-gray-400 ${outcomeToneStyles[tone].idle}`
}
</script>

<template>
  <article
    class="space-y-3 rounded-xl border-4 p-4 transition-colors"
    :class="[
      cardHoverClass,
      item.status === 'active' ? 'bg-dark' : 'bg-dark/50 opacity-80',
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-1">
        <h3
          class="text-lg font-bold"
          :class="titleClass"
        >
          {{ item.title }}
        </h3>
        <p
          v-if="locationLine"
          class="text-sm text-gray-500"
        >
          {{ locationLine }}
        </p>
        <p
          v-if="item.company"
          class="text-sm text-gray-500"
        >
          {{ item.company }}
        </p>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <span
          class="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
          :class="badgeClass"
        >
          {{ typeLabel }}
        </span>
        <span
          v-if="priorityLabel"
          class="text-[10px] font-semibold uppercase text-gray-500"
        >
          {{ priorityLabel }}
        </span>
        <span
          v-if="statusLabel"
          class="text-[10px] font-semibold uppercase text-gray-500"
        >
          {{ statusLabel }}
        </span>
      </div>
    </div>

    <p
      v-if="item.notes"
      class="text-sm text-gray-400"
    >
      {{ item.notes }}
    </p>

    <a
      v-if="item.bookingUrl"
      :href="item.bookingUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-block text-sm font-semibold underline-offset-2 hover:underline"
      :class="titleClass"
    >
      Reservar / ver web
    </a>

    <div class="space-y-2">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-500"
        :aria-expanded="showPhotos"
        @click="showPhotos = !showPhotos"
      >
        <span class="inline-flex items-center gap-2">
          <Icon icon="mdi:image-outline" class="h-5 w-5" aria-hidden="true" />
          Fotos
        </span>
        <Icon
          :icon="showPhotos ? 'mdi:chevron-up' : 'mdi:chevron-down'"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        />
      </button>

      <DesiredGamePhotoSection
        v-if="showPhotos"
        :desired-game-id="item.id"
        :accent="isEscape ? 'tertiary' : 'board'"
      />
    </div>

    <div
      class="grid gap-2"
      :class="actionGridClass"
    >
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
