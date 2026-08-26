import type { PaletteName } from './palettes'
import type { EasingName } from './easings'

export type Vec3 = [number, number, number]
export type Oklch = {
  L: number
  C: number
  H: number
}

export type Palette = {
  a: [number, number, number]
  b: [number, number, number]
  c: [number, number, number]
  d: [number, number, number]
}

export type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt'

export type ShaderController = {
  canvas: HTMLCanvasElement
  setProgress: (p: number) => void
  setAlpha: (a: number) => void
  setPalette: (p: Palette) => void
  setBandTight: (b: number) => void
  setDirection: (d: Direction) => void
  setWaveAmount: (v: number) => void
  setRippleAmount: (v: number) => void
  setWaveSpeed: (v: number) => void
  setBrightness: (v: number) => void
  setSwellAmount: (v: number) => void
  getProgress: () => number
  getAlpha: () => number
  destroy: () => void
}

export type Easing = (p: number) => number

export type SweepOptions = {
  /** ms for the band to traverse. Default 1100. */
  sweepMs?: number
  /** ms for the post-traversal fade-out. Default 700. */
  outroMs?: number
  /** 0..1, when in the sweep to fire `onMidpoint` (i.e. swap pages). Default 0.56. */
  midpoint?: number
  palette?: PaletteName | Palette
  bandTight?: number
  direction?: Direction
  easing?: EasingName | Easing
  /** Caps the band's peak alpha. 0..1.5, default 1. Useful for dimming. */
  peakAlpha?: number
  /** 0..2, opt-in edge displacement. 0 = straight default, 1 = organic, 2 = strong. */
  waveAmount?: number
  /** 0..2, vertical ripple texture intensity. 0 = smooth, 1 = default. */
  rippleAmount?: number
  /** 0..3, multiplies all time-based shader motion. 1 = default. */
  waveSpeed?: number
  /** 0..1.5, multiplies the band's RGB. Lower it on dark backgrounds so the
   *  iridescent colours don't read as harsh whites. 1 = default. */
  brightness?: number
  /** 0..1, depth/iridescent swell on top of the flat band. 0 = legacy flat
   *  stripe, 1 = full crest highlight + Fresnel rim. Default left to the
   *  shader controller (0.55). */
  swellAmount?: number
  /** Called once the band has reached `midpoint`. Use this to navigate / swap content. */
  onMidpoint?: () => void | Promise<void>
  /** Called when the full animation (incl. outro) finishes. */
  onComplete?: () => void
}

export type SweepHandle = {
  /** Resolves when the band reaches the configured midpoint. */
  midpoint: Promise<void>
  /** Resolves when the outro fade finishes. */
  done: Promise<void>
  /**
   * Cancel mid-flight. Stops the animation loop but leaves the shader's
   * current alpha/progress untouched so a following sweep can continue
   * from where this one was.
   */
  cancel: () => void
}

export type MeshIdeaFlags = {
  asymmetricSwell: number
  secondaryCrest: number
  refraction: number
  chromaticDispersion: number
  noiseEdge: number
  cameraSweep: number
  bloom: number
  sparkles: number
  curlWake: number
}

export type MeshShaderController = ShaderController & {
  /** Set a single idea flag (0 = off, 1 = on). */
  setIdea: (key: keyof MeshIdeaFlags, value: number) => void
  /** Bulk-set all idea flags. */
  setIdeas: (flags: MeshIdeaFlags) => void
  /** Live-tune the per-vertex elevation peak. */
  setElevation: (v: number) => void
  /** Install a CanvasImageSource (typically a <canvas layoutsubtree>
   *  rasterising live DOM via drawElementImage) as the texture the
   *  band samples from. Pass null to clear. */
  setTextureSource: (src: TexImageSource | null) => void
  /** Toggle texture mode (1 = sample the texture as the band's base
   *  colour, 0 = use the palette colour like the vanilla mesh sweep). */
  setUseTexture: (on: number) => void
  /** Strength of the N-normal-driven UV offset when sampling the
   *  texture. 0 = no refraction, page warps purely from the mesh's
   *  z-displacement / perspective. 0.04 ≈ a subtle glass lens. */
  setRefractStrength: (v: number) => void
}

export type NamedropController = ShaderController & {
  setTextureSource: (src: TexImageSource | null) => void
  setUseTexture: (on: number) => void
  /** Install a "before" snapshot for the wipe effect. When set, the
   *  FS samples this texture on the side of the bulge that hasn't
   *  been passed yet (ahead of the sweep), and the live `uTex` on
   *  the side that has been passed. The boundary is the bulge's
   *  travel-mode anchor X. Pass null to disable the wipe (FS falls
   *  back to sampling only uTex). */
  setSnapshotSource: (src: TexImageSource | null) => void
  /** Bulge anchor in UV space (0..1, 0..1). Default (0.5, 0.5).
   *  Ignored when travel mode is on. */
  setAnchor: (u: number, v: number) => void
  /** Max radial extent of the bulge in aspect-corrected UV. Default 0.55. */
  setBulgeRadius: (r: number) => void
  /** Peak z displacement at the bulge centre. Default 0.32. */
  setElevation: (z: number) => void
  /** 0..2, intensity of the iridescent foil shimmer. Default 1. */
  setIridescence: (i: number) => void
  /** UV refraction strength at the bulge edges. Default 0.04. */
  setRefractStrength: (r: number) => void
  /** 0 = static anchor (uAnchor), 1 = anchor travels left→right with
   *  progress (anchor.x = mix(-0.2, 1.2, progress), anchor.y = uAnchor.y).
   *  In travel mode the bulge has constant amplitude — entry/exit
   *  fades happen naturally as the anchor moves off the viewport. */
  setTravelMode: (on: number) => void
}
