<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import EscapeOutcomePicker from "@/components/sessions/EscapeOutcomePicker.vue"
import StarRatingPicker from "@/components/ui/StarRatingPicker.vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { EscapeSessionDetails } from "@/domain/types/escapeSession"
import type { EscapeRoomDetails } from "@/domain/types/catalog"
import { escapeOutcomeLabelClass } from "@/lib/utils/outcomeStyles"
import { formatEscapeTime, parseEscapeTimeToSeconds } from "@/lib/utils/parseEscapeTime"

const props = defineProps<{
  sessionId: string
  escapeRoom?: EscapeRoomDetails | null
  details: EscapeSessionDetails | null
  canWrite: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  save: [
    payload: {
      cluesUsed: number | null
      timeResult: string | null
      timeSeconds: number | null
      price: number | null
      priceCurrency: string
      escaped: boolean | null
      rating: number | null
      ratingNote: string | null
    },
  ]
}>()

const form = reactive({
  cluesUsed: "",
  timeResult: "",
  price: "",
  priceCurrency: "EUR",
  escaped: null as boolean | null,
  rating: null as number | null,
  ratingNote: "",
})

function hydrateFromDetails(details: EscapeSessionDetails | null) {
  if (!details) return

  form.cluesUsed =
    details.cluesUsed === null || details.cluesUsed === undefined
      ? ""
      : String(details.cluesUsed)
  form.timeResult = details.timeResult ?? formatEscapeTime(details.timeSeconds)
  form.price =
    details.price === null || details.price === undefined ? "" : String(details.price)
  form.priceCurrency = details.priceCurrency ?? "EUR"
  form.escaped = details.escaped
  form.rating = details.rating
  form.ratingNote = details.ratingNote ?? ""
}

watch(
  () => props.sessionId,
  () => hydrateFromDetails(props.details),
  { immediate: true },
)

const locationLabel = computed(() => {
  if (!props.escapeRoom) return null

  const { city, venue } = props.escapeRoom
  if (city && venue && city === venue) return city

  const parts = [city, venue].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
})

const escapedLabel = computed(() => {
  if (form.escaped === true) return "Escapasteis"
  if (form.escaped === false) return "No escapasteis"
  return "Sin definir"
})

const escapedLabelClass = computed(() => escapeOutcomeLabelClass(form.escaped))

function handleSave() {
  const cluesUsed = form.cluesUsed === "" ? null : Number(form.cluesUsed)
  const price = form.price === "" ? null : Number(form.price)
  const timeResult = form.timeResult.trim() || null
  const timeSeconds = timeResult ? parseEscapeTimeToSeconds(timeResult) : null

  emit("save", {
    cluesUsed: Number.isFinite(cluesUsed) ? cluesUsed : null,
    timeResult,
    timeSeconds,
    price: Number.isFinite(price) ? price : null,
    priceCurrency: form.priceCurrency.trim() || "EUR",
    escaped: form.escaped,
    rating: form.rating,
    ratingNote: form.ratingNote.trim() || null,
  })
}
</script>

<template>
  <section class="space-y-4 rounded-xl border-2 border-tertiary/50 p-4">
    <p v-if="locationLabel || escapeRoom?.company" class="space-y-0.5 text-sm text-gray-400">
      <span v-if="locationLabel">{{ locationLabel }}</span>
      <span v-if="escapeRoom?.company" class="block text-xs text-gray-500">
        {{ escapeRoom.company }}
      </span>
    </p>

    <div class="grid grid-cols-2 gap-3">
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Pistas usadas</span>
        <input
          v-model="form.cluesUsed"
          type="number"
          min="0"
          inputmode="numeric"
          class="w-full rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-gray-100 focus:border-tertiary focus:outline-none"
          placeholder="0"
        />
      </label>
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Tiempo (mm:ss)</span>
        <input
          v-model="form.timeResult"
          type="text"
          inputmode="numeric"
          class="w-full rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-gray-100 focus:border-tertiary focus:outline-none"
          placeholder="45:30"
        />
      </label>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <label class="col-span-2 block space-y-2">
        <span class="text-sm text-gray-400">Precio</span>
        <input
          v-model="form.price"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          class="w-full rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-gray-100 focus:border-tertiary focus:outline-none"
          placeholder="25.00"
        />
      </label>
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Moneda</span>
        <input
          v-model="form.priceCurrency"
          type="text"
          maxlength="3"
          class="w-full rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 uppercase text-gray-100 focus:border-tertiary focus:outline-none"
        />
      </label>
    </div>

    <div class="space-y-2">
      <p class="text-sm text-gray-400">Valoración</p>
      <StarRatingPicker
        v-model="form.rating"
        accent="tertiary"
        :disabled="!canWrite || isSaving"
      />
      <label class="block space-y-2">
        <span class="text-sm text-gray-400">Nota sobre la valoración (opcional)</span>
        <textarea
          v-model="form.ratingNote"
          rows="2"
          maxlength="500"
          class="w-full rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-gray-100 focus:border-tertiary focus:outline-none"
          placeholder="¿Qué os gustó o no?"
          :disabled="!canWrite || isSaving"
        />
      </label>
    </div>

    <div class="space-y-2">
      <p class="text-sm text-gray-400">¿Escapasteis?</p>
      <EscapeOutcomePicker
        v-model="form.escaped"
        :disabled="!canWrite || isSaving"
      />
      <p class="text-sm text-gray-300">
        Resultado:
        <span class="font-semibold" :class="escapedLabelClass">{{ escapedLabel }}</span>
        <span class="text-xs text-gray-500"> (se guarda al pulsar «Guardar detalles»)</span>
      </p>
    </div>

    <div class="flex justify-end">
      <UiButton
        variant="tertiary"
        size="compact"
        :disabled="!canWrite || isSaving"
        @click="handleSave"
      >
        {{ isSaving ? "Guardando..." : "Guardar detalles" }}
      </UiButton>
    </div>
  </section>
</template>
