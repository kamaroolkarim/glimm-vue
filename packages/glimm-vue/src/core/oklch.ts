import type { Oklch, Vec3 } from './types'

export type { Vec3, Oklch } from './types'

const srgbToLinear = (c: number): number => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
const linearToSrgb = (c: number): number => c <= 31308e-7 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
const linearRgbToOklab = (r: number, g: number, b: number): number[] => {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  ]
}
const oklabToLinearRgb = (L: number, a: number, b: number): number[] => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
}
export const rgbToOklch = (rgb: Vec3): Oklch => {
  const [L, a, b] = linearRgbToOklab(
    srgbToLinear(rgb[0]),
    srgbToLinear(rgb[1]),
    srgbToLinear(rgb[2])
  )
  return { L, C: Math.sqrt(a * a + b * b), H: Math.atan2(b, a) }
}
export const oklchToRgb = ({ L, C, H }: Oklch): Vec3 => {
  const a = C * Math.cos(H)
  const b = C * Math.sin(H)
  const [lr, lg, lb] = oklabToLinearRgb(L, a, b)
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
  return [
    clamp01(linearToSrgb(lr)),
    clamp01(linearToSrgb(lg)),
    clamp01(linearToSrgb(lb))
  ]
}
export const hexToRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}
const lerpHueShortest = (h1: number, h2: number, t: number): number => {
  let diff = h2 - h1
  if (diff > Math.PI) diff -= 2 * Math.PI
  if (diff < -Math.PI) diff += 2 * Math.PI
  return h1 + diff * t
}
const lerpOklch = (a: Oklch, b: Oklch, t: number): Oklch => {
  const EPS = 1e-4
  const ha = a.C < EPS ? b.H : a.H
  const hb = b.C < EPS ? a.H : b.H
  return {
    L: a.L + (b.L - a.L) * t,
    C: a.C + (b.C - a.C) * t,
    H: lerpHueShortest(ha, hb, t)
  }
}
export function sampleChainRgb(anchors: Oklch[], samples: number): Vec3[] {
  if (anchors.length === 0) return []
  if (anchors.length === 1) {
    const rgb = oklchToRgb(anchors[0])
    return Array.from({ length: samples }, () => rgb)
  }
  const out: Vec3[] = []
  const K = anchors.length
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const seg = t * (K - 1)
    const segI = Math.min(K - 2, Math.floor(seg))
    const segT = seg - segI
    out.push(oklchToRgb(lerpOklch(anchors[segI], anchors[segI + 1], segT)))
  }
  return out
}
