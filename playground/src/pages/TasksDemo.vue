<script setup lang="ts">
import { computed, ref } from 'vue'
import { TransitionLink, useGlimm } from '@kamaroolkarim/glimm-vue/router'

type Task = { id: number; title: string; done: boolean }

const { sweep } = useGlimm()

const draft = ref('')
const tasks = ref<Task[]>([
  { id: 1, title: 'Wrap the app in GlimmProvider', done: true },
  { id: 2, title: 'Port the sweep shaders', done: true },
  { id: 3, title: 'Ship the playground', done: false },
])
let nextId = 4

const remaining = computed(() => tasks.value.filter((task) => !task.done).length)

function add() {
  const title = draft.value.trim()
  if (!title) return
  draft.value = ''
  void sweep(
    () => {
      tasks.value.push({ id: nextId++, title, done: false })
    },
    { palette: 'azure', sweepMs: 550, outroMs: 450 }
  )
}

function toggle(task: Task) {
  const willBeDone = !task.done
  void sweep(
    () => {
      task.done = willBeDone
    },
    {
      palette: willBeDone ? 'citrus' : 'lagoon',
      sweepMs: 450,
      outroMs: 350,
      midpoint: 0.5,
    }
  )
}
</script>

<template>
  <section>
    <p class="kicker">Demo 4 — tasks</p>
    <h1>Micro-sweeps for micro-changes</h1>
    <p class="lede">
      Adding or completing a task plays a short sweep and mutates the list at the
      midpoint — the same move as page swaps, scaled down.
    </p>

    <form class="composer" @submit.prevent="add">
      <input v-model="draft" type="text" placeholder="Add a task…" autocomplete="off" />
      <button type="submit" :disabled="!draft.trim()">Add</button>
    </form>

    <ul class="tasks">
      <li v-for="task in tasks" :key="task.id">
        <button class="task" :class="{ done: task.done }" @click="toggle(task)">
          <span class="box" />
          <span class="title">{{ task.title }}</span>
        </button>
      </li>
    </ul>

    <p class="hint">{{ remaining }} left</p>

    <TransitionLink to="/" :sweep="{ palette: 'ember' }" class="back">← Back home</TransitionLink>
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

.composer {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}

.composer input {
  flex: 1;
  padding: 11px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  color: var(--fg);
  font-size: 14.5px;
  outline: none;
  transition: border-color 0.15s ease;
}

.composer input:focus {
  border-color: var(--accent);
}

.composer button {
  padding: 11px 18px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, opacity 0.15s ease;
}

.composer button:disabled {
  opacity: 0.55;
  cursor: default;
}

.composer button:not(:disabled):hover {
  filter: brightness(1.08);
}

.tasks {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  color: var(--fg);
  font-size: 14.5px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.task:hover {
  border-color: var(--accent);
}

.box {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 1.5px solid var(--muted);
  border-radius: 6px;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.task.done .box {
  background: var(--accent);
  border-color: var(--accent);
}

.task.done .title {
  color: var(--muted);
  text-decoration: line-through;
}

.hint {
  margin-top: 14px;
  font-size: 13.5px;
  color: var(--muted);
}

.back {
  display: inline-block;
  margin-top: 26px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
