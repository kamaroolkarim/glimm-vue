import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/demos/publish', component: () => import('./pages/PublishDemo.vue') },
    { path: '/demos/autopilot', component: () => import('./pages/AutopilotDemo.vue') },
    { path: '/demos/theme', component: () => import('./pages/ThemeDemo.vue') },
    { path: '/demos/tasks', component: () => import('./pages/TasksDemo.vue') },
  ],
})
