<script setup lang="ts">
import { GlimmProvider, InterceptLinks } from '@kamaroolkarim/glimm-vue/router'
import { useRoute } from 'vue-router'
import { theme } from './theme'

const route = useRoute()

const links = [
  { path: '/', label: 'Home', skip: true },
  { path: '/demos/publish', label: 'Publish', skip: false },
  { path: '/demos/autopilot', label: 'Autopilot', skip: false },
  { path: '/demos/theme', label: 'Theme', skip: false },
  { path: '/demos/tasks', label: 'Tasks', skip: false },
]
</script>

<template>
  <GlimmProvider palette="prism" :brightness="theme === 'dark' ? 0.72 : 1">
    <InterceptLinks />
    <div class="shell" :data-theme="theme">
      <header class="nav">
        <a class="brand" href="#/">
          <span class="brand-mark" />
          glimm-vue
        </a>
        <nav class="links">
          <a
            v-for="link in links"
            :key="link.path"
            :href="'#' + link.path"
            :data-glimm-skip="link.skip || undefined"
            :class="{ active: route.path === link.path, optout: link.skip }"
          >
            {{ link.label }}
          </a>
        </nav>
      </header>
      <main class="page">
        <RouterView />
      </main>
    </div>
  </GlimmProvider>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
}

.shell {
  --bg: #f7f7f8;
  --fg: #1c1c21;
  --muted: #6f707a;
  --card: #ffffff;
  --border: #e5e5ea;
  --accent: #5b5bd6;
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
}

.shell[data-theme='dark'] {
  --bg: #0d0e13;
  --fg: #ecedf2;
  --muted: #9d9ea9;
  --card: #16171f;
  --border: #262836;
  --accent: #8f8ff5;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 84%, transparent);
  backdrop-filter: blur(10px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 650;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--fg);
  text-decoration: none;
}

.brand-mark {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(135deg, #ff5f6d, #ffc371, #7dd3fc, #a78bfa);
}

.links {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.links a {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.links a:hover {
  color: var(--fg);
  background: color-mix(in srgb, var(--fg) 6%, transparent);
}

.links a.active {
  color: var(--fg);
  background: color-mix(in srgb, var(--fg) 9%, transparent);
}

.links a.optout {
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}

.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 28px 96px;
}
</style>
