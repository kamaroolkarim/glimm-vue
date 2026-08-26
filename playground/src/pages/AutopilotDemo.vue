<script setup lang="ts">
import { useRoute } from 'vue-router'
import { AUTOPILOT_CYCLE, autopilotRunning, useAutopilot } from '../autopilot'

const route = useRoute()
const { pause, resume } = useAutopilot()

const labelFor = (path: string) =>
  path === '/' ? 'Home' : path.replace('/demos/', '')
</script>

<template>
  <section>
    <p class="kicker">Demo 2 — autopilot</p>
    <h1>Navigation on a timer</h1>
    <p class="lede">
      Every 3 seconds the playground pushes the next stop on this loop. It keeps running
      while it roams — click any link yourself and autopilot yields immediately.
    </p>

    <div class="status">
      <span class="dot" :class="{ live: autopilotRunning }" />
      <span>{{ autopilotRunning ? 'Running' : 'Paused' }}</span>
      <button v-if="autopilotRunning" @click="pause">Pause</button>
      <button v-else class="primary" @click="resume">Resume</button>
    </div>

    <ol class="loop">
      <li
        v-for="stop in AUTOPILOT_CYCLE"
        :key="stop.path"
        :class="{ here: route.path === stop.path }"
      >
        <span class="stop">{{ labelFor(stop.path) }}</span>
        <span class="pal">{{ stop.palette }}</span>
      </li>
    </ol>
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

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  font-size: 14px;
  font-weight: 550;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--muted);
}

.dot.live {
  background: #34c759;
  box-shadow: 0 0 0 4px color-mix(in srgb, #34c759 22%, transparent);
}

.status button {
  margin-left: 8px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  color: var(--fg);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.status button:hover {
  border-color: var(--accent);
}

.status button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.loop {
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loop li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  font-size: 13.5px;
  color: var(--muted);
  opacity: 0.7;
}

.loop li.here {
  opacity: 1;
  border-color: var(--accent);
  color: var(--fg);
}

.stop {
  font-weight: 600;
}

.pal {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
}
</style>
