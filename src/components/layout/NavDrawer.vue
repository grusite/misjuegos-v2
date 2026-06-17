<script setup lang="ts">
import { computed, toRef, watch } from "vue"
import { RouterLink, useRoute } from "vue-router"
import NavIcon from "@/components/ui/NavIcon.vue"
import UserAvatar from "@/components/ui/UserAvatar.vue"
import { navLinks } from "@/config/navLinks"
import { useMenuOrigin } from "@/composables/useMenuOrigin"
import { useAuth } from "@/composables/useAuth"
import { quartIn, quartOut } from "@/lib/utils/easing"

const props = defineProps<{
  open: boolean
  source: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()
const { profile, logout } = useAuth()

const sourceRef = computed(() => props.source)
const isOpen = toRef(props, "open")
const { origin } = useMenuOrigin(sourceRef, isOpen)

const navStyle = computed(() => ({
  "--left": `${origin.value.left}px`,
  "--top": `${origin.value.top}px`,
}))

watch(
  () => route.path,
  () => emit("close"),
)

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function animateClipSize(
  element: HTMLElement,
  out: boolean,
  onComplete: () => void,
) {
  const maxSize = Math.hypot(window.innerWidth, window.innerHeight)
  const duration = out ? 500 : 1000
  const start = performance.now()

  if (prefersReducedMotion()) {
    element.style.setProperty(
      "--clipSize",
      out ? "20px" : `${maxSize}px`,
    )
    onComplete()
    return
  }

  function frame(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 20 + (out ? quartIn(progress) : quartOut(progress)) * maxSize
    element.style.setProperty("--clipSize", `${eased}px`)

    if (progress < 1) {
      requestAnimationFrame(frame)
    } else {
      onComplete()
    }
  }

  requestAnimationFrame(frame)
}

function onEnter(element: Element, done: () => void) {
  const nav = element as HTMLElement
  nav.style.setProperty("--clipSize", "20px")
  animateClipSize(nav, false, done)
}

function onLeave(element: Element, done: () => void) {
  animateClipSize(element as HTMLElement, true, done)
}

async function handleLogout() {
  emit("close")
  await logout()
}
</script>

<template>
  <Transition
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
  >
    <nav
      v-if="open"
      class="nav-drawer fixed inset-0 z-40 flex bg-primary"
      :style="navStyle"
    >
      <div class="mx-auto flex max-w-lg flex-1 flex-col p-4">
        <RouterLink
          to="/"
          class="w-6"
          @click="emit('close')"
        >
          <img
            src="/logo.svg"
            alt="MisJuegos"
            class="h-10 w-6 text-dark"
          />
        </RouterLink>

        <div class="mt-8 flex-1">
          <div class="flex flex-col">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              v-slot="{ isActive, href, navigate }"
              :to="link.to"
              custom
            >
              <a
                :href="href"
                class="flex items-center gap-4 border-4 p-4 text-2xl font-bold text-dark transition-colors"
                :class="
                  isActive
                    ? 'rounded-lg border-dark'
                    : 'border-transparent hover:border-dark/30'
                "
                @click="navigate"
              >
                <NavIcon :name="link.icon" />
                <span class="flex-1">{{ link.name }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  class="h-5 w-5 shrink-0 fill-current"
                  aria-hidden="true"
                >
                  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41Z" />
                </svg>
              </a>
            </RouterLink>
          </div>
        </div>

        <div class="-m-4 flex border-t-4 border-dashed border-dark p-6">
          <UserAvatar
            v-if="profile"
            :display-name="profile.displayName"
            :avatar-url="profile.avatarUrl"
          />
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-2xl text-primary transition-colors hover:scale-105"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="h-5 w-5 fill-current"
              aria-hidden="true"
            >
              <path
                d="M12 3c-1.1 0-2 .9-2 2v4H8V5c0-2.21 1.79-4 4-4s4 1.79 4 4v4h-2V5c0-1.1-.9-2-2-2m7 7v8c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-8H3v8c0 2.21 1.79 4 4 4h10c2.21 0 4-1.79 4-4v-8h-2Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  </Transition>
</template>

<style scoped>
.nav-drawer {
  clip-path: circle(var(--clipSize) at var(--left) var(--top));
}
</style>
