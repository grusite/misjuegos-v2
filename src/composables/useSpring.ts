import { onUnmounted, ref, type Ref } from "vue"

type SpringOptions = {
  stiffness: number
  damping: number
}

export function useSpring(initial: number, options: SpringOptions): {
  value: Ref<number>
  set: (next: number) => void
  add: (delta: number) => void
} {
  const value = ref(initial)
  let target = initial
  let velocity = 0
  let frameId: number | null = null

  function step() {
    const delta = target - value.value
    velocity += delta * options.stiffness
    velocity *= 1 - options.damping
    value.value += velocity

    if (Math.abs(delta) > 0.001 || Math.abs(velocity) > 0.001) {
      frameId = requestAnimationFrame(step)
    } else {
      value.value = target
      velocity = 0
      frameId = null
    }
  }

  function schedule() {
    if (frameId === null) {
      frameId = requestAnimationFrame(step)
    }
  }

  function set(next: number) {
    target = next
    schedule()
  }

  function add(delta: number) {
    target += delta
    schedule()
  }

  onUnmounted(() => {
    if (frameId !== null) cancelAnimationFrame(frameId)
  })

  return { value, set, add }
}
