<script setup lang="ts">
import { reactive } from "vue"
import UiButton from "@/components/ui/UiButton.vue"
import { participantAliasFormSchema } from "@/domain/schemas/participant"
import type { ParticipantAlias } from "@/domain/types/participant"
import { normalizeAlias } from "@/domain/normalizeAlias"

defineProps<{
  aliases: ParticipantAlias[]
  isSaving?: boolean
}>()

const emit = defineEmits<{
  add: [alias: string]
  remove: [aliasId: string]
}>()

const form = reactive({
  alias: "",
  error: null as string | null,
})

function handleAdd() {
  const parsed = participantAliasFormSchema.safeParse({ alias: form.alias })

  if (!parsed.success) {
    form.error =
      parsed.error.flatten().fieldErrors.alias?.[0] ?? "Alias inválido"
    return
  }

  form.error = null
  emit("add", parsed.data.alias)
  form.alias = ""
}
</script>

<template>
  <div class="space-y-3 border-t-4 border-dashed border-gray-700 pt-4">
    <p class="text-sm font-semibold text-gray-400">Alias de importación</p>

    <ul
      v-if="aliases.length > 0"
      class="space-y-2"
    >
      <li
        v-for="alias in aliases"
        :key="alias.id"
        class="flex items-center justify-between rounded-lg border-2 border-gray-700 px-3 py-2"
      >
        <span class="font-mono text-sm text-gray-200">{{ alias.alias }}</span>
        <button
          type="button"
          class="text-sm text-secondary hover:text-primary"
          :disabled="isSaving"
          @click="emit('remove', alias.id)"
        >
          Quitar
        </button>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-gray-500"
    >
      Sin alias. Añade variantes del nombre para importar desde hojas de cálculo.
    </p>

    <form
      class="flex gap-2"
      @submit.prevent="handleAdd"
    >
      <input
        v-model="form.alias"
        type="text"
        class="min-w-0 flex-1 rounded-lg border-4 border-gray-700 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none"
        placeholder="Ej. Jose, José García…"
        :disabled="isSaving"
      />
      <UiButton
        type="submit"
        variant="secondary"
        class="!px-4 !py-2 !text-base"
        :disabled="isSaving || !form.alias.trim()"
      >
        Añadir
      </UiButton>
    </form>

    <p
      v-if="form.alias.trim()"
      class="text-xs text-gray-500"
    >
      Se guardará como «{{ normalizeAlias(form.alias) }}»
    </p>

    <p
      v-if="form.error"
      class="text-sm text-secondary"
      role="alert"
    >
      {{ form.error }}
    </p>
  </div>
</template>
