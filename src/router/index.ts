import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/authStore"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { guestOnly: true },
    },
    {
      path: "/",
      component: () => import("@/components/layout/AppShell.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/HomeView.vue"),
        },
        {
          path: "participants",
          name: "participants",
          component: () => import("@/views/ParticipantsView.vue"),
        },
        {
          path: "tools/dice",
          name: "tools-dice",
          component: () => import("@/views/DicesView.vue"),
        },
        {
          path: "tools/roulette",
          name: "tools-roulette",
          component: () => import("@/views/RouletteView.vue"),
        },
        {
          path: "tools/timer",
          name: "tools-timer",
          component: () => import("@/views/TimerView.vue"),
        },
        // Backward compatible redirects from previous Phase 3 paths.
        { path: "dices", redirect: { name: "tools-dice" } },
        { path: "roulette", redirect: { name: "tools-roulette" } },
        { path: "timer", redirect: { name: "tools-timer" } },
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
})

router.beforeEach(async to => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.init()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "home" }
  }

  return true
})

export default router
