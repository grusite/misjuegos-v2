<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue"
import { Icon } from "@iconify/vue"
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
const toolsExpanded = ref(false)

const mainLinks = computed(() =>
  navLinks.filter(link => (link.section ?? "main") === "main"),
)
const toolLinks = computed(() =>
  navLinks.filter(link => link.section === "tools"),
)
const isInTools = computed(() => route.path.startsWith("/tools/"))

const navStyle = computed(() => ({
  "--left": `${origin.value.left}px`,
  "--top": `${origin.value.top}px`,
}))

watch(
  () => route.path,
  () => {
    if (isInTools.value) toolsExpanded.value = true
    if (props.open) uiStore.closeNav(true)
  },
)

watch(
  () => props.open,
  isMenuOpen => {
    if (isMenuOpen && isInTools.value) toolsExpanded.value = true
    if (isMenuOpen && !isInTools.value) toolsExpanded.value = false
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
    // Svelte out transitions run t 1→0; Vue leave runs progress 0→1 — invert for close.
    const t = out ? 1 - progress : progress
    const eased = 20 + (out ? quartIn(t) : quartOut(t)) * maxSize
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

function toggleTools() {
  toolsExpanded.value = !toolsExpanded.value
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
              v-for="link in mainLinks"
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
                <NavIcon :icon="link.icon" />
                <span class="flex-1">{{ link.name }}</span>
                <Icon
                  icon="mdi:chevron-right"
                  class="h-5 w-5 shrink-0 opacity-70"
                  aria-hidden="true"
                />
              </a>
            </RouterLink>

            <div class="mt-4">
              <button
                type="button"
                class="flex w-full items-center gap-4 border-4 border-transparent p-4 text-2xl font-bold text-dark transition-colors hover:border-dark/30"
                :class="{ 'rounded-lg border-dark': toolsExpanded || isInTools }"
                @click="toggleTools"
              >
                <Icon icon="mdi:tools" class="h-7 w-7 shrink-0" aria-hidden="true" />
                <span class="flex-1 text-left">Herramientas</span>
                <Icon
                  :icon="toolsExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                  class="h-5 w-5 shrink-0 opacity-70"
                  aria-hidden="true"
                />
              </button>

              <Transition name="tools-collapse">
                <div v-if="toolsExpanded || isInTools" class="ml-6 border-l-4 border-dark/20 pl-2">
                  <RouterLink
                    v-for="link in toolLinks"
                    :key="link.to"
                    v-slot="{ isActive, href, navigate }"
                    :to="link.to"
                    custom
                  >
                    <a
                      :href="href"
                      class="flex items-center gap-4 border-4 p-3 text-xl font-bold text-dark transition-colors"
                      :class="
                        isActive
                          ? 'rounded-lg border-dark'
                          : 'border-transparent hover:border-dark/30'
                      "
                      @click="handleNavigate(navigate)"
                    >
                      <NavIcon :icon="link.icon" />
                      <span class="flex-1">{{ link.name }}</span>
                      <Icon
                        icon="mdi:chevron-right"
                        class="h-5 w-5 shrink-0 opacity-70"
                        aria-hidden="true"
                      />
                    </a>
                  </RouterLink>
                </div>
              </Transition>
            </div>
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
            class="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-primary transition-colors hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <Icon
              icon="mdi:power"
              class="h-6 w-6"
              aria-hidden="true"
            />
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

.tools-collapse-enter-active,
.tools-collapse-leave-active {
  transition: all 0.2s ease;
}

.tools-collapse-enter-from,
.tools-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
