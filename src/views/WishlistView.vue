<script setup lang="ts">
import { computed, ref } from "vue"
import DesiredGameCard from "@/components/wishlist/DesiredGameCard.vue"
import DesiredGameForm from "@/components/wishlist/DesiredGameForm.vue"
import UiButton from "@/components/ui/UiButton.vue"
import {
  useDesiredGames,
  type DesiredGameFilter,
} from "@/composables/useDesiredGames"
import type { DesiredGameFormValues } from "@/domain/schemas/desiredGame"
import type { DesiredGame } from "@/domain/types/desiredGame"

const {
  items,
  filteredItems,
  activeCount,
  bggResults,
  bggResultsTotal,
  hasMoreBggResults,
  isBggSearching,
  isBggLoadingMore,
  typeFilter,
  showArchived,
  isLoading,
  isSaving,
  errorMessage,
  searchBgg,
  loadMoreBgg,
  createItem,
  updateItem,
  setStatus,
  removeItem,
} = useDesiredGames()

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; id: string }

const formMode = ref<FormMode>({ type: "closed" })

const editingItem = computed<DesiredGame | null>(() => {
  const mode = formMode.value
  if (mode.type !== "edit") return null

  return items.value.find(item => item.id === mode.id) ?? null
})

const filterOptions: { value: DesiredGameFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "board_game", label: "Juegos de mesa" },
  { value: "escape_room", label: "Escape rooms" },
]

function filterChipClasses(value: DesiredGameFilter): string {
  const isActive = typeFilter.value === value

  if (!isActive) {
    return "border-gray-700 text-gray-400 hover:border-gray-500"
  }

  if (value === "escape_room") {
    return "border-tertiary bg-tertiary/20 text-tertiary"
  }

  if (value === "board_game") {
    return "border-board bg-board/20 text-board"
  }

  return "border-primary bg-primary/20 text-primary"
}

function openCreateForm() {
  formMode.value = { type: "create" }
}

function openEditForm(id: string) {
  formMode.value = { type: "edit", id }
}

function closeForm() {
  formMode.value = { type: "closed" }
}

async function handleCreate(values: DesiredGameFormValues) {
  await createItem(values)
  closeForm()
}

async function handleUpdate(values: DesiredGameFormValues) {
  if (formMode.value.type !== "edit") return

  await updateItem(formMode.value.id, values)
  closeForm()
}

async function handleRemove(id: string) {
  if (!window.confirm("¿Eliminar este deseo de la lista?")) return

  await removeItem(id)
  if (formMode.value.type === "edit" && formMode.value.id === id) {
    closeForm()
  }
}
</script>

<template>
  <section class="space-y-4 pb-8">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Planificación</p>
      <h1 class="text-3xl font-bold text-primary">Quiero jugar</h1>
      <p class="text-gray-400">
        Lista de juegos y escapes pendientes para reservar o comprar.
      </p>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-lg bg-secondary/20 p-4 text-secondary"
    >
      {{ errorMessage }}
    </p>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors"
        :class="filterChipClasses(option.value)"
        @click="typeFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <label class="flex items-center gap-2 text-sm text-gray-400">
      <input
        v-model="showArchived"
        type="checkbox"
        class="size-4 rounded border-gray-600 bg-dark accent-primary"
      />
      Ver jugados y descartados
    </label>

    <DesiredGameForm
      v-if="formMode.type === 'create'"
      submit-label="Añadir"
      :bgg-results="bggResults"
      :bgg-results-total="bggResultsTotal"
      :has-more-bgg-results="hasMoreBggResults"
      :is-bgg-searching="isBggSearching"
      :is-bgg-loading-more="isBggLoadingMore"
      :is-saving="isSaving"
      @search-bgg="searchBgg"
      @load-more-bgg="loadMoreBgg"
      @submit="handleCreate"
      @cancel="closeForm"
    />

    <DesiredGameForm
      v-else-if="formMode.type === 'edit' && editingItem"
      :initial-item="editingItem"
      submit-label="Guardar"
      :bgg-results="bggResults"
      :bgg-results-total="bggResultsTotal"
      :has-more-bgg-results="hasMoreBggResults"
      :is-bgg-searching="isBggSearching"
      :is-bgg-loading-more="isBggLoadingMore"
      :is-saving="isSaving"
      @search-bgg="searchBgg"
      @load-more-bgg="loadMoreBgg"
      @submit="handleUpdate"
      @cancel="closeForm"
    />

    <UiButton
      v-if="formMode.type === 'closed'"
      type="button"
      variant="ghost"
      class="w-full border-2 border-dashed border-gray-700 !py-3"
      @click="openCreateForm"
    >
      + Añadir deseo
    </UiButton>

    <p
      v-if="isLoading"
      class="text-gray-400"
    >
      Cargando lista...
    </p>

    <div
      v-else
      class="space-y-3"
    >
      <DesiredGameCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        :is-saving="isSaving"
        @edit="openEditForm(item.id)"
        @mark-played="setStatus(item.id, 'played')"
        @mark-dropped="setStatus(item.id, 'dropped')"
        @reactivate="setStatus(item.id, 'active')"
        @remove="handleRemove(item.id)"
      />

      <p
        v-if="filteredItems.length === 0"
        class="rounded-xl border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
      >
        {{
          showArchived
            ? "No hay elementos con estos filtros."
            : activeCount === 0
              ? "Tu lista está vacía. ¡Añade algo que tengas ganas de jugar!"
              : "No hay elementos activos con estos filtros."
        }}
      </p>
    </div>
  </section>
</template>
