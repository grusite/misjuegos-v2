<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    authorDisplayName: string
    content: string
    createdAt: string
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

function formatMessageDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", props.compact
    ? { timeStyle: "short" }
    : { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(isoDate))
}
</script>

<template>
  <article class="rounded-lg border border-gray-700 bg-dark/60 p-3">
    <div class="mb-1 flex items-baseline justify-between gap-2">
      <p class="truncate text-xs font-semibold text-primary">
        {{ authorDisplayName }}
      </p>
      <time
        class="shrink-0 text-xs text-gray-500"
        :datetime="createdAt"
      >
        {{ formatMessageDate(createdAt) }}
      </time>
    </div>
    <p class="text-sm text-gray-100">{{ content }}</p>
  </article>
</template>
