import { defineStore } from "pinia"
import { ref } from "vue"

export const useUiStore = defineStore("ui", () => {
  const isNavOpen = ref(false)
  const skipNavAnimation = ref(false)
  const homeClickListeners = new Set<() => void>()

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
      closeNav(false)
    } else {
      openNav()
    }
  }

  function consumeSkipNavAnimation() {
    const skip = skipNavAnimation.value
    skipNavAnimation.value = false
    return skip
  }

  function onHomeClick(listener: () => void) {
    homeClickListeners.add(listener)

    return () => {
      homeClickListeners.delete(listener)
    }
  }

  function notifyHomeClick() {
    closeNav(true)

    for (const listener of homeClickListeners) {
      listener()
    }
  }

  return {
    isNavOpen,
    openNav,
    closeNav,
    toggleNav,
    consumeSkipNavAnimation,
    onHomeClick,
    notifyHomeClick,
  }
})
