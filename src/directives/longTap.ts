import type { Directive, DirectiveBinding } from "vue"

type LongTapOptions = {
  start: () => void
  end: () => void
  action: () => void
}

const isTouch = typeof window !== "undefined" && "ontouchstart" in window
const EV_START = isTouch ? "touchstart" : "mousedown"
const EV_END = isTouch ? "touchend" : "mouseup"

export const vLongTap: Directive<HTMLElement, LongTapOptions> = {
  mounted(el, binding: DirectiveBinding<LongTapOptions>) {
    let timer: ReturnType<typeof setTimeout> | null = null

    function handleEnd() {
      binding.value.end()
      if (timer) clearTimeout(timer)
      timer = null
      window.removeEventListener(EV_END, handleEnd)
    }

    function handleAction() {
      binding.value.action()
      handleEnd()
    }

    function handleStart() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(handleAction, 300)
      window.addEventListener(EV_END, handleEnd, { passive: true })
      binding.value.start()
    }

    el.addEventListener(EV_START, handleStart, { passive: true })
    ;(el as HTMLElement & { __longTapCleanup?: () => void }).__longTapCleanup = () => {
      el.removeEventListener(EV_START, handleStart)
      handleEnd()
    }
  },
  unmounted(el) {
    const cleanup = (el as HTMLElement & { __longTapCleanup?: () => void }).__longTapCleanup
    cleanup?.()
  },
}
