<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createShader } from 'glimm-vue'
import type { ShaderController } from 'glimm-vue'
import { useGlimm } from 'glimm-vue/router'
import Icon from './Icon.vue'
import { VIGNETTE } from './palettes'

const { sweep } = useGlimm()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const boxRef = ref<HTMLDivElement | null>(null)
const bandTight = ref(14)
let ctrl: ShaderController | null = null

function applyStatic() {
  if (!ctrl) return
  ctrl.setBandTight(bandTight.value)
  ctrl.setProgress(0.5)
  ctrl.setAlpha(1)
}

function onPointer(e: PointerEvent) {
  const box = boxRef.value
  if (!box) return
  const rect = box.getBoundingClientRect()
  const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  bandTight.value = Math.round(2 + frac * 38)
  applyStatic()
}

function onPointerDown(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  onPointer(e)
}

onMounted(() => {
  if (canvasRef.value) ctrl = createShader({ canvas: canvasRef.value, bandTight: bandTight.value })
  applyStatic()
})

onBeforeUnmount(() => {
  ctrl?.destroy()
  ctrl = null
})

function preview() {
  void sweep(() => {}, { bandTight: bandTight.value })
}
</script>

<template>
  <div>
    <div class="band-card">
      <div
        ref="boxRef"
        class="band-box"
        aria-label="bandTight"
        @pointerdown="onPointerDown"
        @pointermove="e => e.buttons > 0 && onPointer(e)"
      >
        <canvas ref="canvasRef" class="band-canvas"></canvas>
        <div class="band-vignette" :style="{ background: VIGNETTE }"></div>
        <span class="band-label">bandTight {{ bandTight }}</span>
        <button type="button" class="expand-btn" aria-label="Preview on page" @click="preview">
          <Icon name="expand" :size="18" />
        </button>
      </div>
      <p class="band-hint">Drag across the band to tune its width. Lower = wider, softer; higher = tighter, more concentrated.</p>
    </div>
    <div class="preview-row">
      <button type="button" class="glimm-press" aria-label="Preview" @click="preview">
        <Icon name="eye" :size="13" />
        Preview
      </button>
    </div>
  </div>
</template>

<style scoped>
.band-card {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 13px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}

.band-box {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  aspect-ratio: 16 / 9;
  width: 100%;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  cursor: ew-resize;
  touch-action: none;
  outline: none;
}

.band-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.band-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.band-label {
  position: absolute;
  left: 10px;
  top: 8px;
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  color: #9ca3af;
  pointer-events: none;
  font-variant-numeric: tabular-nums;
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

.band-hint {
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  color: #9ca3af;
  margin: 8px 0 0;
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
