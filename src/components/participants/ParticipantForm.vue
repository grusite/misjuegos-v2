<script setup lang="ts">
import { reactive, watch } from "vue"
import UiButton from "@/components/ui/UiButton.vue"
import {
  participantFormSchema,
  type ParticipantFormValues,
} from "@/domain/schemas/participant"

const props = defineProps<{
  initialValues?: ParticipantFormValues
  submitLabel: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  submit: [values: ParticipantFormValues]
  cancel: []
}>()

const form = reactive<ParticipantFormValues>({
  displayName: props.initialValues?.displayName ?? "",
})

const fieldError = reactive({
  displayName: null as string | null,
})

watch(
  () => props.initialValues,
  values => {
    form.displayName = values?.displayName ?? ""
    fieldError.displayName = null
  },
)

function handleSubmit() {
  const parsed = participantFormSchema.safeParse(form)

  if (!parsed.success) {
    fieldError.displayName =
      parsed.error.flatten().fieldErrors.displayName?.[0] ?? null
    return
  }

  fieldError.displayName = null
  emit("submit", parsed.data)
}
</script>

<template>
  <form
    class="space-y-4 rounded-lg border-4 border-dashed border-gray-600 bg-dark/60 p-4"
    @submit.prevent="handleSubmit"
  >
    <div class="space-y-2">
      <label
        for="participant-name"
        class="block text-sm text-gray-400"
      >
        Nombre del jugador
      </label>
      <input
        id="participant-name"
        v-model="form.displayName"
        type="text"
        class="w-full rounded-lg border-4 border-gray-700 bg-dark px-4 py-2 text-gray-100 focus:border-primary focus:outline-none"
        placeholder="Introduce el nombre"
        autocomplete="off"
      />
      <p
        v-if="fieldError.displayName"
        class="text-sm text-secondary"
        role="alert"
      >
        {{ fieldError.displayName }}
      </p>
    </div>

    <div class="flex gap-2">
      <UiButton
        type="submit"
        class="flex-1"
        :disabled="isSaving || !form.displayName.trim()"
      >
        {{ isSaving ? "Guardando…" : submitLabel }}
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
