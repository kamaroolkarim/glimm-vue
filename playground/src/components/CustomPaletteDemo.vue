<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createShader, playSweep, shuffleAccentPalette } from 'glimm-vue'
import type { Palette, ShaderController } from 'glimm-vue'
import { useGlimm } from 'glimm-vue/router'
import CodeBlock from './CodeBlock.vue'
import { VIGNETTE } from './palettes'

const { sweep } = useGlimm()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctrl: ShaderController | null = null

const palette = ref<Palette>({
  a: [0.46, 0.88, 0.33],
  b: [0.6, 0.58, 0.74],
  c: [0.5, 0.5, 0.5],
  d: [0.54, 0.22, 0.84]
})

const f = (v: number) => v.toFixed(2)

const snippet = computed(
  () =>
    `<GlimmProvider
  :palette="{
    a: [${palette.value.a.map(f).join(', ')}],
    b: [${palette.value.b.map(f).join(', ')}],
    c: [${palette.value.c.map(f).join(', ')}],
    d: [${palette.value.d.map(f).join(', ')}],
  }"
>
  <RouterView />
</GlimmProvider>
`
)

function shuffle() {
  palette.value = shuffleAccentPalette()
  if (ctrl) playSweep(ctrl, { palette: palette.value })
}

function previewOnPage() {
  void sweep(() => {}, { palette: palette.value })
}

onMounted(() => {
  if (canvasRef.value) ctrl = createShader({ canvas: canvasRef.value, palette: palette.value })
  if (ctrl) {
    ctrl.setProgress(0.5)
    ctrl.setAlpha(1)
  }
})

onBeforeUnmount(() => {
  ctrl?.destroy()
  ctrl = null
})
</script>

<template>
  <div class="custom-stack">
    <div class="custom-box">
      <canvas ref="canvasRef" class="custom-canvas"></canvas>
      <div class="custom-vignette" :style="{ background: VIGNETTE }"></div>
      <button type="button" class="expand-btn" aria-label="Preview on page" @click="previewOnPage">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-diagonal" style="display: block; flex-shrink: 0"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /></svg>
      </button>
    </div>
    <div class="shuffle-row">
      <button type="button" class="glimm-press" aria-label="Shuffle a new palette" @click="shuffle">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-shuffle" style="display: block; flex-shrink: 0"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 4l3 3l-3 3" /><path d="M18 20l3 -3l-3 -3" /><path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5" /><path d="M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4.984 0 0 1 -3 1h-3" /></svg>
        Shuffle
      </button>
    </div>
    <CodeBlock label="custom-palette.vue" :code="snippet" />
  </div>
</template>

<style scoped>
.custom-stack {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.custom-box {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  aspect-ratio: 16 / 9;
  width: 100%;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}

.custom-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.custom-vignette {
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

.shuffle-row {
  display: flex;
  justify-content: flex-end;
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
