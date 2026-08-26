<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createShader, playSweep } from '@kamaroolkarim/glimm-vue'
import type { PaletteName, ShaderController } from '@kamaroolkarim/glimm-vue'
import { useGlimm } from '@kamaroolkarim/glimm-vue/router'
import { PALETTE_VISUALS, VIGNETTE } from './palettes'

const { sweep } = useGlimm()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const selected = ref<PaletteName>('prism')
let ctrl: ShaderController | null = null
let gen = 0
let timer: number | undefined

function run() {
  if (!ctrl) return
  const g = ++gen
  playSweep(ctrl, {
    palette: selected.value,
    onComplete: () => {
      if (g !== gen) return
      timer = window.setTimeout(run, 700)
    }
  })
}

function pick(name: PaletteName) {
  selected.value = name
  run()
}

function previewOnPage() {
  void sweep(() => {}, { palette: selected.value })
}

onMounted(() => {
  if (canvasRef.value) ctrl = createShader({ canvas: canvasRef.value })
  timer = window.setTimeout(run, 600)
})

onBeforeUnmount(() => {
  gen++
  window.clearTimeout(timer)
  ctrl?.destroy()
  ctrl = null
})
</script>

<template>
  <div class="demo-stack">
    <div class="demo-box">
      <canvas ref="canvasRef" class="demo-canvas"></canvas>
      <div class="demo-vignette" :style="{ background: VIGNETTE }"></div>
      <button
        type="button"
        class="expand-btn"
        aria-label="Preview on page"
        @click="previewOnPage"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-diagonal" style="display: block; flex-shrink: 0"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /></svg>
      </button>
    </div>
    <div class="demo-controls">
      <div class="dots">
        <button
          v-for="p in PALETTE_VISUALS"
          :key="p.name"
          type="button"
          class="dot-btn"
          :aria-label="'Sweep with ' + p.name + ' palette'"
          @click="pick(p.name)"
        >
          <span class="dot" :style="{ background: p.gradient }"></span>
          <span
            class="dot-ring"
            :style="{ boxShadow: 'inset 0 0 0 1.5px ' + p.ring + ', inset 0 0 0 3px #fff', opacity: selected === p.name ? 1 : 0 }"
          ></span>
        </button>
      </div>
      <button type="button" class="glimm-press" aria-label="Preview" @click="previewOnPage">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-eye-filled" style="display: block; flex-shrink: 0"><path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>
        Preview
      </button>
    </div>
  </div>
</template>

<style scoped>
.demo-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-box {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  aspect-ratio: 16 / 9;
  width: 100%;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}

.demo-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.demo-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.expand-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #bfbfbf;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.expand-btn:hover {
  color: #242529;
}

.demo-controls {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 4px 0;
}

.dots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.dot-btn {
  position: relative;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1);
}

.dot-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transition: opacity 180ms ease;
  pointer-events: none;
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
