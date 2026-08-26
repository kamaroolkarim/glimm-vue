<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createShader, playSweep } from 'glimm-vue'
import type { PaletteName, ShaderController } from 'glimm-vue'
import { useGlimm } from 'glimm-vue/router'
import Icon from './Icon.vue'
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
        <Icon name="expand" :size="18" />
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
      <button type="button" class="glimm-press" aria-label="Preview" @click="run">
        <Icon name="eye" :size="13" />
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
