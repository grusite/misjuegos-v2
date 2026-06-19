<script setup lang="ts">
import DashboardStatCard from "@/components/dashboard/DashboardStatCard.vue"
import EscapeStatsSection from "@/components/dashboard/EscapeStatsSection.vue"
import FrequentPartnersTable from "@/components/dashboard/FrequentPartnersTable.vue"
import SessionTrendsChart from "@/components/dashboard/SessionTrendsChart.vue"
import TopGamesChart from "@/components/dashboard/TopGamesChart.vue"
import { useDashboard } from "@/composables/useDashboard"

const { stats, isLoading, errorMessage } = useDashboard()
</script>

<template>
  <section class="space-y-6 pb-8">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Resumen</p>
      <h1 class="text-3xl font-bold text-primary">Dashboard</h1>
      <p class="text-gray-400">Estadísticas del grupo y tus compañeros habituales.</p>
    </div>

    <p v-if="isLoading" class="text-gray-400">Cargando estadísticas...</p>

    <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-4 text-secondary">
      {{ errorMessage }}
    </p>

    <template v-if="stats && !isLoading">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardStatCard
          title="Cuentas"
          :value="stats.summary.totalProfiles"
          :sub-value="`${stats.summary.totalParticipants} participantes`"
          icon="ph:users-three"
        />
        <DashboardStatCard
          title="Partidas"
          :value="stats.summary.totalSessions"
          :sub-value="`${stats.summary.boardSessions} mesa · ${stats.summary.escapeSessions} escape`"
          icon="ph:game-controller"
        />
        <DashboardStatCard
          title="Tiempo medio"
          :value="`${stats.summary.averageBoardDurationMinutes} min`"
          sub-value="por partida de mesa"
          icon="ph:clock"
          accent-class="text-board"
        />
        <DashboardStatCard
          title="Victorias"
          :value="`${stats.summary.boardWinRate}%`"
          :sub-value="`${stats.summary.boardWins} de ${stats.summary.boardCompleted}`"
          icon="ph:trophy"
          accent-class="text-board"
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <TopGamesChart
          title="Juegos de mesa top"
          :items="stats.topBoardGames"
          bar-class="bg-board"
        />
        <SessionTrendsChart :items="stats.monthlyTrends" />
      </div>

      <FrequentPartnersTable :items="stats.frequentPartners" />

      <EscapeStatsSection
        :summary="stats.escapeSummary"
        :top-rooms="stats.topEscapeRooms"
        :top-rated-rooms="stats.topRatedEscapeRooms"
      />
    </template>
  </section>
</template>
