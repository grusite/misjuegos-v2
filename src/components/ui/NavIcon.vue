<script setup lang="ts">
import type { NavLink } from "@/config/navLinks"

defineProps<{
  name: NavLink["icon"]
}>()
</script>

<template>
  <svg
    v-if="name === 'games'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    class="h-6 w-6 shrink-0 fill-current"
    aria-hidden="true"
  >
    <path
      d="M248,120a48.05,48.05,0,0,0-48-48H160.2A48,48,0,0,0,112,24H48A16,16,0,0,0,32,40v64a48,48,0,0,0,48,48v16a16,16,0,0,0,16,16h64a16,16,0,0,0,16-16V152a48,48,0,0,0,48-48Zm-48,0a32,32,0,0,1-32,32H96a32,32,0,0,1-32-32V40h48a32,32,0,0,1,31.85,29.61A8,8,0,0,0,152,72h48a32,32,0,0,1,0,48Z"
    />
  </svg>

  <svg
    v-else-if="name === 'friends'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    class="h-6 w-6 shrink-0 fill-current"
    aria-hidden="true"
  >
    <path
      d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.11A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,138.62a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"
    />
  </svg>

  <svg
    v-else-if="name === 'dices'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    class="h-6 w-6 shrink-0 fill-current"
    aria-hidden="true"
  >
    <path
      d="M221.87,83.16A8,8,0,0,0,216,80H40a8,8,0,0,0-5.87,3.16l-24,32A8,8,0,0,0,8,120v80a16,16,0,0,0,16,16H232a16,16,0,0,0,16-16V120a8,8,0,0,0-2.13-5.37ZM40,96h80v80H40Zm96,80V96h80l.06,80ZM64,120a8,8,0,1,1,8,8A8,8,0,0,1,64,120Zm48,48a8,8,0,1,1,8,8A8,8,0,0,1,112,168Zm0-48a8,8,0,1,1,8,8A8,8,0,0,1,112,120Zm48,48a8,8,0,1,1,8,8A8,8,0,0,1,160,168Z"
    />
  </svg>

  <svg
    v-else-if="name === 'roulette'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    class="h-6 w-6 shrink-0 fill-current"
    aria-hidden="true"
  >
    <path
      d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h24A8,8,0,0,1,168,128Z"
    />
  </svg>

  <svg
    v-else-if="name === 'timer'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    class="h-6 w-6 shrink-0 fill-current"
    aria-hidden="true"
  >
    <path
      d="M6 2v2H4v2h2v10a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V6h2V4h-2V2H6m2 4h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6Z"
    />
  </svg>

  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    class="h-6 w-6 shrink-0 fill-current"
    aria-hidden="true"
  >
    <path
      d="M13 3v6h8V3h-8M3 13h6v8H3v-8m0-8h6v6H3V5m8 8h8v8h-8v-8m8-8v6h-6V5h6Z"
    />
  </svg>
</template>
