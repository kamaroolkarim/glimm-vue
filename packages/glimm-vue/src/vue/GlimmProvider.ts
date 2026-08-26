import { defineComponent, h, onBeforeUnmount, provide } from 'vue'
import type { PropType } from 'vue'
import { playSweep } from '../core/sweep'
import { createShader } from '../core/shader'
import { resolvePalette } from '../core/palettes'
import { GLIMM_KEY } from './context'
import type { GlimmDefaults, SweepFn } from './context'
import type { ShaderController, SweepHandle } from '../core/types'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const GlimmProvider = defineComponent({
  name: 'GlimmProvider',
  props: {
    sweepMs: Number,
    outroMs: Number,
    midpoint: Number,
    palette: [String, Object] as PropType<GlimmDefaults['palette']>,
    bandTight: Number,
    direction: String as PropType<GlimmDefaults['direction']>,
    easing: [String, Function] as PropType<GlimmDefaults['easing']>,
    peakAlpha: Number,
    waveAmount: Number,
    rippleAmount: Number,
    waveSpeed: Number,
    brightness: Number,
    swellAmount: Number,
    reducedMotion: String as PropType<GlimmDefaults['reducedMotion']>,
    zIndex: Number,
    shaderFactory: Function as PropType<GlimmDefaults['shaderFactory']>,
    onController: Function as PropType<GlimmDefaults['onController']>
  },
  setup(props, { slots }) {
    let canvasHost: HTMLDivElement | null = null
    let ctrl: ShaderController | null = null
    let activeHandle: SweepHandle | null = null
    const setCanvasHost = (el: unknown) => {
      canvasHost = (el as HTMLDivElement) ?? null
    }
    const ensureController = () => {
      if (ctrl) return ctrl
      const host = canvasHost
      if (!host) return null
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      Object.assign(canvas.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none'
      })
      host.appendChild(canvas)
      const currentDefaults = props
      const factory = currentDefaults.shaderFactory ?? createShader
      const created = factory({
        canvas,
        palette: resolvePalette(currentDefaults.palette),
        bandTight: currentDefaults.bandTight,
        direction: currentDefaults.direction
      })
      if (!created) {
        canvas.remove()
        return null
      }
      ctrl = created
      currentDefaults.onController?.(created)
      return created
    }
    onBeforeUnmount(() => {
      activeHandle?.cancel()
      ctrl?.destroy()
      ctrl = null
    })
    const sweep: SweepFn = (navigate, options) => {
      const d = props
      if (d.reducedMotion !== 'sweep' && prefersReducedMotion()) {
        const p = Promise.resolve(navigate()).then(() => {})
        return {
          midpoint: p,
          done: p,
          cancel: () => {}
        }
      }
      const ensured = ensureController()
      if (!ensured) {
        const p = Promise.resolve(navigate()).then(() => {})
        return { midpoint: p, done: p, cancel: () => {} }
      }
      activeHandle?.cancel()
      const merged = {
        ...d,
        ...options,
        onMidpoint: async () => {
          await Promise.resolve(navigate())
          await options?.onMidpoint?.()
        },
        onComplete: () => {
          options?.onComplete?.()
        }
      }
      const handle = playSweep(ensured, merged)
      activeHandle = handle
      handle.done.finally(() => {
        if (activeHandle === handle) activeHandle = null
      })
      return handle
    }
    provide(GLIMM_KEY, { sweep, defaults: props })
    return () => [
      slots.default?.(),
      h('div', {
        ref: setCanvasHost,
        'aria-hidden': true,
        style: {
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: props.zIndex ?? 9999
        }
      })
    ]
  }
})
