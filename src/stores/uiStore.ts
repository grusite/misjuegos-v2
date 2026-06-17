import { defineStore } from "pinia"
import { ref } from "vue"

export const useUiStore = defineStore("ui", () => {
  const isNavOpen = ref(false)

  function openNav() {
    isNavOpen.value = true
  }

  function closeNav() {
    isNavOpen.value = false
  }

  function toggleNav() {
    isNavOpen.value = !isNavOpen.value
  }

  return {
    isNavOpen,
    openNav,
    closeNav,
    toggleNav,
  }
})
