<script setup lang="ts">
import type { EscapeDashboardSummary, TopGameStat, TopRatedEscapeRoomStat } from "@/domain/types/dashboard"
import DashboardStatCard from "@/components/dashboard/DashboardStatCard.vue"
import StarRatingDisplay from "@/components/ui/StarRatingDisplay.vue"

defineProps<{
  summary: EscapeDashboardSummary
  topRooms: TopGameStat[]
  topRatedRooms: TopRatedEscapeRoomStat[]
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-1">
      <p class="text-sm uppercase tracking-widest text-gray-500">Escape rooms</p>
      <h2 class="text-xl font-bold text-tertiary">Resumen de escapes</h2>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <DashboardStatCard
        title="Completadas"
        :value="summary.totalCompleted"
        sub-value="sesiones terminadas"
        icon="mdi:door-open"
        accent-class="text-tertiary"
      />
      <DashboardStatCard
        title="Escapáis"
        :value="`${summary.escapeRate}%`"
        :sub-value="`${summary.escapedCount} de ${summary.totalCompleted}`"
        icon="mdi:check-circle-outline"
        accent-class="text-board"
      />
      <DashboardStatCard
        title="Pistas medias"
        :value="summary.averageCluesUsed ?? '—'"
        sub-value="por escape"
        icon="mdi:lightbulb-outline"
        accent-class="text-tertiary"
      />
      <DashboardStatCard
        title="Valoración media"
        :value="summary.averageRating ?? '—'"
        sub-value="de 5 estrellas"
        icon="ph:star-fill"
        accent-class="text-primary"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-xl border-2 border-tertiary/30 bg-dark/60 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Salas más jugadas
        </h3>
        <p v-if="topRooms.length === 0" class="text-sm text-gray-500">Sin escapes todavía.</p>
        <ul v-else class="space-y-2">
          <li
            v-for="room in topRooms"
            :key="room.title"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="min-w-0 truncate text-tertiary">{{ room.title }}</span>
            <span class="shrink-0 text-gray-400">{{ room.count }}</span>
          </li>
        </ul>
      </section>

      <section class="rounded-xl border-2 border-tertiary/30 bg-dark/60 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Mejor valoradas
        </h3>
        <p v-if="topRatedRooms.length === 0" class="text-sm text-gray-500">
          Aún no hay valoraciones.
        </p>
        <ul v-else class="space-y-3">
          <li
            v-for="room in topRatedRooms"
            :key="room.title"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="min-w-0 truncate text-tertiary">{{ room.title }}</span>
            <div class="flex shrink-0 items-center gap-2">
              <StarRatingDisplay
                :rating="room.averageRating"
                accent="tertiary"
                show-label
              />
              <span class="text-xs text-gray-500">({{ room.ratedCount }})</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
