import { defineStore } from "pinia"
import { ref } from "vue"

export const useUiStore = defineStore("ui", () => {
  const isNavOpen = ref(false)
  const skipNavAnimation = ref(false)

  function openNav() {
    skipNavAnimation.value = false
    isNavOpen.value = true
  }

  function closeNav(instant = false) {
    skipNavAnimation.value = instant
    isNavOpen.value = false
  }

  function toggleNav() {
    if (isNavOpen.value) {
      closeNav()
    } else {
      openNav()
    }
  }

  function consumeSkipNavAnimation() {
    const skip = skipNavAnimation.value
    skipNavAnimation.value = false
    return skip
  }

  return {
    isNavOpen,
    openNav,
    closeNav,
    toggleNav,
    consumeSkipNavAnimation,
  }
})
