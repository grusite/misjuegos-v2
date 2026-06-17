import { onMounted, onUnmounted, ref, watch, type Ref } from "vue"

export type MenuOrigin = {
  left: number
  top: number
}

export function useMenuOrigin(
  source: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
) {
  const origin = ref<MenuOrigin>({ left: 0, top: 0 })

  function updateOrigin() {
    const element = source.value
    if (!element) return

    const rect = element.getBoundingClientRect()
    origin.value = {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
    }
  }

  watch(isActive, active => {
    if (active) updateOrigin()
  })

  watch(source, () => {
    if (isActive.value) updateOrigin()
  })

  onMounted(() => {
    window.addEventListener("resize", updateOrigin)
  })

  onUnmounted(() => {
    window.removeEventListener("resize", updateOrigin)
  })

  return { origin, updateOrigin }
}
