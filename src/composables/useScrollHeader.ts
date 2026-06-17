import { onMounted, onUnmounted, ref } from "vue"

export function useScrollHeader(threshold = 24) {
  const isScrolled = ref(false)

  function onScroll() {
    isScrolled.value = window.scrollY > threshold
  }

  onMounted(() => {
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll)
  })

  return { isScrolled }
}
