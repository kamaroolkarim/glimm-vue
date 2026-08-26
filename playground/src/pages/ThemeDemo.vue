<script setup lang="ts">
import { computed, ref } from 'vue'
import { PALETTES } from '@kamaroolkarim/glimm-vue'
import type { PaletteName } from '@kamaroolkarim/glimm-vue'
import { useGlimm } from '@kamaroolkarim/glimm-vue/router'
import { theme, toggleTheme } from '../theme'

const { sweep } = useGlimm()

const palette = ref<PaletteName>('azure')
const names = Object.keys(PALETTES) as PaletteName[]

const isDark = computed(() => theme.value === 'dark')

function flip() {
  void sweep(() => toggleTheme(), { palette: palette.value })
}
</script>

<template>
  <section>
    <p class="kicker">Demo 3 — theme</p>
    <h1>Any state change, at the midpoint</h1>
    <p class="lede">
      Sweeps aren't tied to routing. Here the theme flips inside the sweep's midpoint
      callback, so the whole page swaps while the band has the screen covered.
    </p>

    <div class="panel">
      <div class="meta">
        <span class="current">{{ isDark ? 'Dark' : 'Light' }} theme</span>
        <label class="picker">
          Sweep palette
          <select v-model="palette">
            <option v-for="name in names" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
      </div>
      <button class="primary" @click="flip">
        Switch to {{ isDark ? 'light' : 'dark' }}
      </button>
    </div>

    <p class="hint">
      The provider also lowers <code>brightness</code> on dark backgrounds so the
      iridescence doesn't read as harsh whites.
    </p>
  </section>
</template>

<style scoped>
.kicker {
  margin: 0 0 10px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.lede {
  margin: 12px 0 0;
  max-width: 54ch;
  font-size: 15px;
  line-height: 1.6;
  color: var(--muted);
}

.panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 28px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
}

.meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.current {
  font-size: 15px;
  font-weight: 650;
}

.picker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.picker select {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--fg);
  font-size: 13px;
  cursor: pointer;
}

button.primary {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease;
}

button.primary:hover {
  filter: brightness(1.08);
}

.hint {
  margin-top: 16px;
  font-size: 13.5px;
  color: var(--muted);
}

code {
  padding: 1px 5px;
  border-radius: 5px;
  font-size: 0.9em;
  background: color-mix(in srgb, var(--fg) 7%, transparent);
}
</style>
