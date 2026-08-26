import type { InjectionKey } from 'vue'
import type { Direction, Palette, ShaderController, SweepHandle, SweepOptions } from '../core/types'

/** A factory matching `createShader`'s signature. Lets callers swap in a
 *  different shader controller implementation (e.g. `createMeshShader`)
 *  without rewriting the provider. */
export type ShaderFactory = (opts: {
  canvas: HTMLCanvasElement
  palette?: Palette
  bandTight?: number
  direction?: Direction
}) => ShaderController | null

export type GlimmDefaults = Omit<SweepOptions, 'onMidpoint' | 'onComplete'> & {
  /** 'instant' skips the sweep, 'sweep' plays anyway. Default 'instant'. */
  reducedMotion?: 'instant' | 'sweep'
  /** z-index of the canvas overlay. Default 9999. */
  zIndex?: number
  /** Optional override for the shader controller factory. Defaults to the
   *  fullscreen-quad `createShader`; pass `createMeshShader` (or any other
   *  ShaderFactory) to use a different sweep look in this subtree. */
  shaderFactory?: ShaderFactory
  /** Fires once when the underlying shader controller is created. Lets
   *  callers grab a ref to the controller for live tuning (e.g. piping
   *  idea-playground flags into a MeshShaderController). */
  onController?: (ctrl: ShaderController) => void
}

export type SweepFn = (
  /** A function that triggers your navigation (router.push, etc.). Awaited inside the sweep. */
  navigate: () => void | Promise<void>,
  /** Per-call overrides (merged over provider defaults). */
  options?: SweepOptions
) => SweepHandle

export type Ctx = {
  sweep: SweepFn
  defaults: GlimmDefaults
}

export const GLIMM_KEY: InjectionKey<Ctx> = Symbol('GlimmContext')
