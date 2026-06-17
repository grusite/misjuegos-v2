import { createPinia } from "pinia"
import { createApp } from "vue"
import App from "@/App.vue"
import router from "@/router"
import { useAuthStore } from "@/stores/authStore"
import "@/assets/styles/main.css"

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const authStore = useAuthStore()
  await authStore.init()

  app.mount("#app")
}

void bootstrap()
