<script setup lang="ts">
import { computed, toRef, watch } from "vue"
import { RouterLink, useRoute } from "vue-router"
import NavIcon from "@/components/ui/NavIcon.vue"
import UserAvatar from "@/components/ui/UserAvatar.vue"
import { navLinks } from "@/config/navLinks"
import { useMenuOrigin } from "@/composables/useMenuOrigin"
import { useAuth } from "@/composables/useAuth"
import { quartIn, quartOut } from "@/lib/utils/easing"
import { useUiStore } from "@/stores/uiStore"

const props = defineProps<{
  open: boolean
  source: HTMLElement | null
}>()

const route = useRoute()
const uiStore = useUiStore()
const { profile, logout } = useAuth()

const sourceRef = computed(() => props.source)
const isOpen = toRef(props, "open")
const { origin, updateOrigin } = useMenuOrigin(sourceRef, isOpen)

const navStyle = computed(() => ({
  "--left": `${origin.value.left}px`,
  "--top": `${origin.value.top}px`,
}))

watch(
  () => route.path,
  () => {
    if (props.open) uiStore.closeNav(true)
  },
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
  updateOrigin()
  nav.style.setProperty("--clipSize", "20px")
  animateClipSize(nav, false, done)
}

function onLeave(element: Element, done: () => void) {
  if (uiStore.consumeSkipNavAnimation()) {
    done()
    return
  }

  updateOrigin()
  animateClipSize(element as HTMLElement, true, done)
}

function isLinkActive(linkTo: string, isActive: boolean, isExactActive: boolean) {
  return linkTo === "/" ? isExactActive : isActive
}

function handleNavigate(navigate: () => void) {
  uiStore.closeNav(true)
  navigate()
}

async function handleLogout() {
  uiStore.closeNav(true)
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
          @click="uiStore.closeNav(true)"
        >
          <img
            src="/logo.svg"
            alt="MisJuegos"
            class="h-10 w-6"
          />
        </RouterLink>

        <div class="mt-8 flex-1">
          <div class="flex flex-col">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              v-slot="{ isActive, isExactActive, href, navigate }"
              :to="link.to"
              custom
            >
              <a
                :href="href"
                class="flex items-center gap-4 border-4 p-4 text-2xl font-bold text-dark transition-colors"
                :class="
                  isLinkActive(link.to, isActive, isExactActive)
                    ? 'rounded-lg border-dark'
                    : 'border-transparent hover:border-dark/30'
                "
                @click="handleNavigate(navigate)"
              >
                <NavIcon :name="link.icon" />
                <span class="flex-1">{{ link.name }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  class="h-5 w-5 shrink-0 fill-current opacity-70"
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
            variant="light"
          />
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-primary transition-colors hover:scale-105"
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
                d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h5v18H3V6h5V4a2 2 0 0 1 2-2h4m0 2H10v2h4V4Z"
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
