<script setup lang="ts">
import { ref } from 'vue'
import { useTransitionRouter } from '@kamaroolkarim/glimm-vue/router'

const { push } = useTransitionRouter()

const title = ref('')
const publishing = ref(false)

async function publish() {
  const value = title.value.trim()
  if (!value || publishing.value) return
  publishing.value = true
  await new Promise((resolve) => setTimeout(resolve, 900))
  await push('/demos/tasks', { palette: 'berry' })
}
</script>

<template>
  <section>
    <p class="kicker">Demo 1 — publish</p>
    <h1>Redirect after an action</h1>
    <p class="lede">
      Submit the form, wait out the fake save, and land on the tasks page under a
      <code>berry</code> sweep via <code>useTransitionRouter().push</code>.
    </p>

    <form class="composer" @submit.prevent="publish">
      <input
        v-model="title"
        :disabled="publishing"
        type="text"
        placeholder="Post title…"
        autocomplete="off"
      />
      <button type="submit" :disabled="publishing || !title.trim()">
        {{ publishing ? 'Publishing…' : 'Publish' }}
      </button>
    </form>
    <p class="hint">Nothing is sent anywhere — the 900ms delay just stands in for your API call.</p>
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

code {
  padding: 1px 5px;
  border-radius: 5px;
  font-size: 0.9em;
  background: color-mix(in srgb, var(--fg) 7%, transparent);
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

.hint {
  margin-top: 14px;
  font-size: 13.5px;
  color: var(--muted);
}
</style>
