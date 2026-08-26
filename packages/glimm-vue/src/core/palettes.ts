import { rgbToOklch, hexToRgb, sampleChainRgb } from './oklch'
import type { Oklch, Palette, Vec3 } from './types'

export type { Palette } from './types'

export const ACCENTS = {
  red: '#FF3D7F',
  // Cherry      — hot coral-pink
  orange: '#FF7A1A',
  // Tangerine   — juicier orange
  yellow: '#FFD600',
  // Sunflower   — pure marigold
  green: '#C2FF3D',
  // Lime        — electric yellow-green
  mint: '#00FFA8',
  // Spearmint   — near-neon mint
  teal: '#00E5D6',
  // Lagoon      — pool turquoise
  cyan: '#1FC8FF',
  // Sky         — clean cerulean
  blue: '#2E70FF',
  // Cobalt      — electric blue
  indigo: '#7B4FFF',
  // Iris        — vibrant violet
  purple: '#D33CFF',
  // Orchid      — bright magenta
  pink: '#FF3DC0',
  // Hibiscus    — hot pink-magenta
  brown: '#D8A87B'
  // Latte       — warm peach neutral
} as const

export type AccentName = keyof typeof ACCENTS

export const ACCENT_ORDER: AccentName[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'mint',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'pink',
  'brown'
]

const ACCENT_OKLCH: { [k: string]: Oklch } = Object.fromEntries(
  Object.entries(ACCENTS).map(([k, hex]): [string, Oklch] => [
    k,
    rgbToOklch(hexToRgb(hex))
  ])
)

function solve3x3(M: number[][], v: number[]): number[] | null {
  const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const D = det(M)
  if (Math.abs(D) < 1e-9) return null
  const col = (i: number): number[][] => M.map((row, r) => row.map((x, c) => c === i ? v[r] : x))
  return [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D]
}

function fitCosinePaletteToSamples(samples: Vec3[]): Palette {
  const N = samples.length
  const C = 0.5
  const ts = samples.map((_, i) => i / (N - 1))
  const cosV = ts.map((t) => Math.cos(2 * Math.PI * C * t))
  const sinV = ts.map((t) => Math.sin(2 * Math.PI * C * t))
  const sCos = cosV.reduce((s, v) => s + v, 0)
  const sSin = sinV.reduce((s, v) => s + v, 0)
  const sCosCos = cosV.reduce((s, v) => s + v * v, 0)
  const sSinSin = sinV.reduce((s, v) => s + v * v, 0)
  const sCosSin = cosV.reduce((s, v, i) => s + v * sinV[i], 0)
  const M = [
    [N, sCos, sSin],
    [sCos, sCosCos, sCosSin],
    [sSin, sCosSin, sSinSin]
  ]
  const fitChannel = (ch: number) => {
    const ys = samples.map((c) => c[ch])
    const sY = ys.reduce((s, y) => s + y, 0)
    const sYCos = ys.reduce((s, y, i) => s + y * cosV[i], 0)
    const sYSin = ys.reduce((s, y, i) => s + y * sinV[i], 0)
    const sol = solve3x3(M, [sY, sYCos, sYSin])
    if (!sol) return { a: sY / N, b: 0, d: 0 }
    const [a, alpha, beta] = sol
    const b = Math.sqrt(alpha * alpha + beta * beta)
    const d = (Math.atan2(-beta, alpha) / (2 * Math.PI) + 1) % 1
    return { a, b, d }
  }
  const r = fitChannel(0)
  const g = fitChannel(1)
  const bl = fitChannel(2)
  return {
    a: [r.a, g.a, bl.a],
    b: [r.b, g.b, bl.b],
    c: [C, C, C],
    d: [r.d, g.d, bl.d]
  }
}

/**
 * Closed-form 2-color cosine palette: sweeps from A at t=0 to B at t=1.
 * Anchor blending is done in OKLCH (shortest-arc hue) before the cosine
 * fit so the midpoint colour matches a perceptually-uniform interpolation
 * — no muddy grey-brown mid for cross-hue pairs.
 */
export const accentPair = (hexA: string, hexB: string): Palette => {
  const samples = sampleChainRgb(
    [rgbToOklch(hexToRgb(hexA)), rgbToOklch(hexToRgb(hexB))],
    17
  )
  samples[0] = hexToRgb(hexA)
  samples[samples.length - 1] = hexToRgb(hexB)
  return fitCosinePaletteToSamples(samples)
}

/**
 * Fit a cosine palette to an arbitrary chain of N anchor colors.
 *
 * Pipeline:
 *   hex anchors  →  OKLCH (perceptually uniform polar form)
 *                →  dense interpolation along shortest-arc hue path
 *                →  sRGB samples
 *                →  least-squares cosine fit (per channel)
 *
 * Interpolating in OKLCH instead of sRGB means red→pink stays bright
 * pink the whole way instead of dipping into muddy mid-grey. The
 * cosine fit then captures that perceptually-uniform sweep as best a
 * single sinusoid can.
 */
export function accentChain(hexes: string[]): Palette {
  if (hexes.length === 0) return accentPair(ACCENTS.indigo, ACCENTS.cyan)
  if (hexes.length === 1) {
    const v = hexToRgb(hexes[0])
    return { a: v, b: [0, 0, 0], c: [1, 1, 1], d: [0, 0, 0] }
  }
  const anchors = hexes.map((h) => rgbToOklch(hexToRgb(h)))
  const samples = sampleChainRgb(anchors, 17)
  return fitCosinePaletteToSamples(samples)
}

export const PALETTES = {
  // cyan → indigo → magenta — the cool iridescent signature
  prism: accentChain(['#00C0E8', '#6155F5', '#CB30E0']),
  // pink → magenta
  berry: accentChain(['#FF2D55', '#CB30E0']),
  // blue → cyan → green
  lagoon: accentChain(['#0088FF', '#00C0E8', '#34C759']),
  // green → yellow → orange
  citrus: accentChain(['#34C759', '#FFCC00', '#FF8D28']),
  // cyan → blue → indigo — the blue family
  azure: accentChain(['#00C0E8', '#0088FF', '#6155F5']),
  // yellow → orange → pink — fire
  ember: accentChain(['#FFCC00', '#FF8D28', '#FF2D55'])
}

export type PaletteName = keyof typeof PALETTES

export function resolvePalette(p: PaletteName | Palette | undefined): Palette {
  if (!p) return PALETTES.prism
  if (typeof p === 'string') return PALETTES[p]
  return p
}

function hueDistanceDeg(a: AccentName, b: AccentName): number {
  const ha = ACCENT_OKLCH[a].H * 180 / Math.PI
  const hb = ACCENT_OKLCH[b].H * 180 / Math.PI
  return Math.abs((hb - ha + 540) % 360 - 180)
}

function nextAccent(fromName: AccentName, used: Set<AccentName>, direction: number, minDeg: number, maxDeg: number): AccentName {
  const pool = ACCENT_ORDER.filter(
    (n) => n !== 'brown' && !used.has(n) && n !== fromName
  )
  const startIdx = ACCENT_ORDER.indexOf(fromName)
  const ranked = pool.map((name) => {
    const idx = ACCENT_ORDER.indexOf(name)
    const ringStep = direction === 1 ? (idx - startIdx + ACCENT_ORDER.length) % ACCENT_ORDER.length : (startIdx - idx + ACCENT_ORDER.length) % ACCENT_ORDER.length
    const dHue = hueDistanceDeg(fromName, name)
    return { name, ringStep, dHue }
  }).filter((x) => x.dHue >= minDeg && x.dHue <= maxDeg).sort((a, b) => a.ringStep - b.ringStep)
  if (ranked.length > 0) return ranked[0].name
  return pool[0] ?? fromName
}

/**
 * Pick a random palette from the accent set with OKLCH-aware rhythm.
 *
 * Stop-count distribution:
 *   30% 2-color · 40% 3-color · 20% 4-color · 10% 5-color
 *
 * Each successive anchor is chosen by walking the hue ring with a
 * perceptual hue-distance window:
 *   70% analogous — 25-65° gap per step (smooth scale)
 *   30% contrast  — 70-150° gap per step (punchy)
 *
 * Brown is excluded entirely — the warm latte neutral fights with the
 * vibrant tone of the rest of the set, so neither presets nor shuffle
 * surface it.
 */
export function shuffleAccentPalette(): Palette {
  const r = Math.random()
  const N = r < 0.3 ? 2 : r < 0.7 ? 3 : r < 0.9 ? 4 : 5
  const pool = ACCENT_ORDER.filter((n) => n !== 'brown')
  const start = pool[Math.floor(Math.random() * pool.length)]
  const direction = Math.random() < 0.5 ? 1 : -1
  const analogous = Math.random() < 0.7
  const [minDeg, maxDeg] = analogous ? [25, 65] : [70, 150]
  const used: Set<AccentName> = new Set([start])
  const chain: AccentName[] = [start]
  for (let i = 1; i < N; i++) {
    const prev = chain[chain.length - 1]
    const next = nextAccent(prev, used, direction, minDeg, maxDeg)
    chain.push(next)
    used.add(next)
  }
  const hexes = chain.map((n) => ACCENTS[n])
  return accentChain(hexes)
}
