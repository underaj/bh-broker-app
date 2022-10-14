import { createRouter, createWebHistory } from "vue-router";
import RootView from "../views/RootView.vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Root",
      component: RootView,
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
    },
  ],
});

export default router;
