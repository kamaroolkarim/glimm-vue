<script setup lang="ts">
import { computed, ref } from 'vue'
import { EASINGS } from '@kamaroolkarim/glimm-vue'
import type { EasingName } from '@kamaroolkarim/glimm-vue'
import { useGlimm } from '@kamaroolkarim/glimm-vue/router'

const { sweep } = useGlimm()

const CHIPS: EasingName[] = [
  'snap',
  'linear',
  'ease',
  'easeOutQuart',
  'easeInCubic',
  'easeInOutCubic',
  'easeOutExpo',
  'back',
  'easeOutCubic',
  'easeInOutQuint'
]

const selected = ref<EasingName>('snap')

const points = computed(() => {
  const fn = EASINGS[selected.value]
  const pts: string[] = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    const x = 2 + 96 * t
    const y = 96 - 92 * fn(t)
    pts.push(x.toFixed(1) + ',' + y.toFixed(1))
  }
  return pts.join(' ')
})

function pick(name: EasingName) {
  selected.value = name
}

function preview() {
  void sweep(() => {}, { easing: selected.value })
}
</script>

<template>
  <div>
    <div class="easing-card">
      <div class="easing-grid">
        <svg class="easing-curve" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            :points="points"
            fill="none"
            stroke="#242529"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div class="easing-chips">
        <button
          v-for="name in CHIPS"
          :key="name"
          type="button"
          class="chip"
          :class="{ active: selected === name }"
          @click="pick(name)"
        >
          {{ name }}
        </button>
      </div>
    </div>
    <div class="preview-row">
      <button type="button" class="glimm-press" aria-label="Preview" @click="preview">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-eye-filled" style="display: block; flex-shrink: 0"><path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>
        Preview
      </button>
    </div>
  </div>
</template>

<style scoped>
.easing-card {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 13px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}

.easing-grid {
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 12px 12px;
  background-position: 0 0;
  border-radius: 8px;
  padding: 13px;
}

.easing-curve {
  width: 72%;
  height: 184px;
  display: block;
  margin: 0 auto;
}

.easing-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 5px;
  margin-top: 13px;
  overflow-x: auto;
  min-width: 0;
}

.chip {
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 550;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.04);
  color: #9ca3af;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 160ms ease, color 160ms ease;
}

.chip.active {
  background: #242529;
  color: #fff;
}

.preview-row {
  margin-top: 13px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.glimm-press {
  font-family: Inter, sans-serif;
  font-size: 12px;
  line-height: 18px;
  font-weight: 550;
  letter-spacing: -0.1px;
  text-wrap: pretty;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px 0 10px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: #242529;
  box-shadow:
    0 0 0 0.75px #27272a inset,
    0 0 0 1.25px rgba(255, 255, 255, 0.3) inset,
    0 8px 16px 0 rgba(0, 0, 0, 0.08),
    0 16px 32px 0 rgba(0, 0, 0, 0.08);
  color: #fff;
  flex-shrink: 0;
  transition:
    background-color 160ms cubic-bezier(0.23, 1, 0.32, 1),
    color 160ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.glimm-press:hover {
  background: #3a3b40;
}

.glimm-press:active {
  transform: scale(0.97);
}
</style>
