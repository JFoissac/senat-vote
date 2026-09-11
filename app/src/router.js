import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import ThemeView from "./views/ThemeView.vue";
import VotesView from "./views/VotesView.vue";
import CompareView from "./views/CompareView.vue";
import GroupesView from "./views/GroupesView.vue";
import MethodeView from "./views/MethodeView.vue";
import NotFoundView from "./views/NotFoundView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/sujet/:id", name: "sujet", component: ThemeView },
  { path: "/votes", name: "votes", component: VotesView },
  { path: "/comparer", name: "comparer", component: CompareView },
  { path: "/groupes", name: "groupes", component: GroupesView },
  { path: "/methode", name: "methode", component: MethodeView },
  { path: "/:pathMatch(.*)*", name: "notfound", component: NotFoundView }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  }
});

export default router;
