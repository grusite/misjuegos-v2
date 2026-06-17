<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import UiButton from "@/components/ui/UiButton.vue"
import {
  desiredGameFormSchema,
  type DesiredGameFormValues,
} from "@/domain/schemas/desiredGame"
import type { DesiredGame } from "@/domain/types/desiredGame"
import type { BggSearchResult } from "@/services/bgg/bggService"

const props = defineProps<{
  initialItem?: DesiredGame | null
  bggResults?: BggSearchResult[]
  isSaving?: boolean
  submitLabel: string
}>()

const emit = defineEmits<{
  submit: [values: DesiredGameFormValues]
  searchBgg: [query: string]
  cancel: []
}>()

const form = reactive({
  type: (props.initialItem?.type ?? "board_game") as DesiredGameFormValues["type"],
  title: props.initialItem?.title ?? "",
  notes: props.initialItem?.notes ?? "",
  priority: (props.initialItem?.priority ?? null) as 1 | 2 | 3 | null,
  city: props.initialItem?.city ?? "",
  venue: props.initialItem?.venue ?? "",
  company: props.initialItem?.company ?? "",
  bookingUrl: props.initialItem?.bookingUrl ?? "",
  bggQuery: "",
  bggSelectionId: props.initialItem?.bggId
    ? String(props.initialItem.bggId)
    : "",
})

const fieldErrors = reactive<Record<string, string | null>>({})

const accentClass = computed(() =>
  form.type === "escape_room" ? "border-tertiary focus:border-tertiary" : "border-board focus:border-board",
)

const headingClass = computed(() =>
  form.type === "escape_room" ? "text-tertiary" : "text-board",
)

const isEscape = computed(() => form.type === "escape_room")

const selectedBgg = computed(
  () =>
    props.bggResults?.find(
      result => String(result.bggId) === form.bggSelectionId,
    ) ?? null,
)

watch(
  () => props.initialItem,
  item => {
    if (!item) return

    form.type = item.type
    form.title = item.title
    form.notes = item.notes ?? ""
    form.priority = (item.priority ?? null) as 1 | 2 | 3 | null
    form.city = item.city ?? ""
    form.venue = item.venue ?? ""
    form.company = item.company ?? ""
    form.bookingUrl = item.bookingUrl ?? ""
    form.bggSelectionId = item.bggId ? String(item.bggId) : ""
  },
)

watch(
  () => form.bggSelectionId,
  () => {
    if (selectedBgg.value) form.title = selectedBgg.value.title
  },
)

function buildPayload(): DesiredGameFormValues {
  if (form.type === "board_game") {
    return {
      type: "board_game",
      title: form.title,
      notes: form.notes || undefined,
      priority: form.priority,
      bggId: selectedBgg.value?.bggId ?? null,
    }
  }

  return {
    type: "escape_room",
    title: form.title,
    notes: form.notes || undefined,
    priority: form.priority,
    city: form.city || undefined,
    venue: form.venue || undefined,
    company: form.company || undefined,
    bookingUrl: form.bookingUrl || undefined,
  }
}

function handleSubmit() {
  const parsed = desiredGameFormSchema.safeParse(buildPayload())

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors
    for (const key of Object.keys(fieldErrors)) {
      fieldErrors[key] = null
    }
    for (const [key, messages] of Object.entries(flattened)) {
      fieldErrors[key] = messages?.[0] ?? null
    }
    return
  }

  emit("submit", parsed.data)
}
</script>

<template>
  <form
    class="space-y-4 rounded-xl border-2 bg-dark p-4"
    :class="isEscape ? 'border-tertiary/40' : 'border-board/40'"
    @submit.prevent="handleSubmit"
  >
    <h2
      class="text-2xl font-bold"
      :class="headingClass"
    >
      {{ initialItem ? "Editar deseo" : "Añadir a la lista" }}
    </h2>

    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-lg border-4 px-3 py-2 text-sm font-semibold transition-colors"
        :class="
          form.type === 'board_game'
            ? 'border-board bg-board text-dark'
            : 'border-gray-700 text-gray-400'
        "
        @click="form.type = 'board_game'"
      >
        Juego de mesa
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg border-4 px-3 py-2 text-sm font-semibold transition-colors"
        :class="
          form.type === 'escape_room'
            ? 'border-tertiary bg-tertiary text-dark'
            : 'border-gray-700 text-gray-400'
        "
        @click="form.type = 'escape_room'"
      >
        Escape room
      </button>
    </div>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Título</span>
      <input
        v-model="form.title"
        type="text"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
        :class="accentClass"
        placeholder="Nombre del juego o sala"
      />
      <p
        v-if="fieldErrors.title"
        class="text-sm text-secondary"
      >
        {{ fieldErrors.title }}
      </p>
    </label>

    <template v-if="form.type === 'board_game'">
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Buscar en BGG (opcional)</span>
        <div class="flex gap-2">
          <input
            v-model="form.bggQuery"
            type="search"
            class="min-w-0 flex-1 rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
            :class="accentClass"
            placeholder="BoardGameGeek..."
          />
          <UiButton
            type="button"
            variant="ghost"
            class="!px-4 !py-2 !text-base"
            @click="emit('searchBgg', form.bggQuery)"
          >
            Buscar
          </UiButton>
        </div>
        <select
          v-if="bggResults && bggResults.length > 0"
          v-model="form.bggSelectionId"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
          :class="accentClass"
        >
          <option value="">Sin selección</option>
          <option
            v-for="result in bggResults"
            :key="result.bggId"
            :value="String(result.bggId)"
          >
            {{ result.title }}{{ result.yearPublished ? ` (${result.yearPublished})` : "" }}
          </option>
        </select>
      </label>
    </template>

    <template v-else>
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Ciudad</span>
        <input
          v-model="form.city"
          type="text"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
          :class="accentClass"
          placeholder="Ej. Madrid"
        />
      </label>

      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Local / venue</span>
        <input
          v-model="form.venue"
          type="text"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
          :class="accentClass"
          placeholder="Nombre del local"
        />
      </label>

      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Empresa (opcional)</span>
        <input
          v-model="form.company"
          type="text"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
          :class="accentClass"
        />
      </label>

      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Enlace de reserva (opcional)</span>
        <input
          v-model="form.bookingUrl"
          type="url"
          inputmode="url"
          class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
          :class="accentClass"
          placeholder="https://..."
        />
        <p
          v-if="fieldErrors.bookingUrl"
          class="text-sm text-secondary"
        >
          {{ fieldErrors.bookingUrl }}
        </p>
      </label>
    </template>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Prioridad (opcional)</span>
      <select
        v-model="form.priority"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
        :class="accentClass"
      >
        <option :value="null">Sin prioridad</option>
        <option :value="3">Alta</option>
        <option :value="2">Media</option>
        <option :value="1">Baja</option>
      </select>
    </label>

    <label class="block space-y-2">
      <span class="text-sm text-gray-400">Notas</span>
      <textarea
        v-model="form.notes"
        rows="3"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:outline-none"
        :class="accentClass"
        placeholder="Comentarios, con quién ir, fechas..."
      />
    </label>

    <div class="flex gap-2">
      <UiButton
        type="submit"
        :variant="form.type === 'escape_room' ? 'tertiary' : 'board'"
        class="flex-1"
        :disabled="isSaving || !form.title.trim()"
      >
        {{ isSaving ? "Guardando..." : submitLabel }}
      </UiButton>
      <UiButton
        type="button"
        variant="ghost"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>
    </div>
  </form>
</template>
