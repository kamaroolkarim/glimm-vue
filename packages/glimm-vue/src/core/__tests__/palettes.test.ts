import { describe, expect, it } from 'vitest'
import { hexToRgb } from '../oklch'
import {
  ACCENTS,
  ACCENT_ORDER,
  PALETTES,
  accentChain,
  accentPair,
  resolvePalette,
  shuffleAccentPalette
} from '../palettes'

type Pal = {
  a: number[]
  b: number[]
  c: number[]
  d: number[]
}

const evalPalette = (pal: Pal, t: number): number[] =>
  pal.a.map((a, i) => a + pal.b[i] * Math.cos(2 * Math.PI * (pal.c[i] * t + pal.d[i])))

describe('palettes', () => {
  it('accentPair returns four 3-component arrays', () => {
    const pal = accentPair('#FF0000', '#0000FF') as unknown as Pal
    for (const key of ['a', 'b', 'c', 'd'] as const) {
      expect(Array.isArray(pal[key])).toBe(true)
      expect(pal[key].length).toBe(3)
    }
  })

  it('accentPair matches the original glimm implementation bit-for-bit', () => {
    expect(accentPair('#FF0000', '#0000FF')).toEqual({
      a: [0.5428496596065252, 0, 0.5419549877630743],
      b: [0.42786962959881825, 0, 0.4583804973322737],
      c: [0.5, 0.5, 0.5],
      d: [0.9212004705434726, 0, 0.5858461559182746]
    })
  })

  it('accentPair fit passes near the pinned endpoint anchors', () => {
    const pal = accentPair('#FF0000', '#0000FF') as unknown as Pal
    const red = hexToRgb('#FF0000')
    const blue = hexToRgb('#0000FF')
    const s0 = evalPalette(pal, 0)
    const s1 = evalPalette(pal, 1)
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(s0[i] - red[i])).toBeLessThan(0.2)
      expect(Math.abs(s1[i] - blue[i])).toBeLessThan(0.2)
    }
  })

  it('accentChain with no hexes falls back to indigo → cyan', () => {
    expect(accentChain([])).toEqual(accentPair(ACCENTS.indigo, ACCENTS.cyan))
  })

  it('accentChain with one hex returns the flat single-color palette', () => {
    expect(accentChain(['#FF0000'])).toEqual({
      a: [1, 0, 0],
      b: [0, 0, 0],
      c: [1, 1, 1],
      d: [0, 0, 0]
    })
  })

  it('PALETTES has all six named presets matching the original values', () => {
    expect(Object.keys(PALETTES).sort()).toEqual(['azure', 'berry', 'citrus', 'ember', 'lagoon', 'prism'])
    expect(PALETTES.prism).toEqual({
      a: [0.3684592797948963, 0.4881247708401166, 0.9038692199431876],
      b: [0.3854926506569833, 0.2702838249649173, 0.08016243089311854],
      c: [0.5, 0.5, 0.5],
      d: [0.4942178463019591, 0.06945359243097093, 0.7768178046241645]
    })
    expect(PALETTES.berry).toEqual({
      a: [0.8993610337805149, 0.18149359317373714, 0.6073793116465082],
      b: [0.09300725217529555, 0.05470280409059712, 0.227427066663],
      c: [0.5, 0.5, 0.5],
      d: [0.9354862382957013, 0.28099392929687417, 0.5122849062936623]
    })
    expect(PALETTES.lagoon).toEqual({
      a: [0.04956605754546784, 0.6598822209631878, 0.6795621074037422],
      b: [0.06686264698700799, 0.14219949232410012, 0.32933894797410407],
      c: [0.5, 0.5, 0.5],
      d: [0.30502284966286686, 0.6112777361700785, 0.88090153219168]
    })
    expect(PALETTES.citrus).toEqual({
      a: [0.6069341553702279, 0.6602445350262195, 0.2456186487096983],
      b: [0.46006672868721843, 0.15628478911920016, 0.2833039329370939],
      c: [0.5, 0.5, 0.5],
      d: [0.6417194888224823, 0.8612710916593102, 0.20810043821598545]
    })
    expect(PALETTES.azure).toEqual({
      a: [0.2090915192315867, 0.5473397383301045, 0.9345442928780864],
      b: [0.2325181858550447, 0.17803891458504525, 0.06638280133017015],
      c: [0.5, 0.5, 0.5],
      d: [0.4006833754592838, 0.004680656331183197, 0.6927248673247974]
    })
    expect(PALETTES.ember).toEqual({
      a: [1, 0.49000779952813245, 0.15171093119659743],
      b: [0, 0.25574581563566595, 0.15394121223397614],
      c: [0.5, 0.5, 0.5],
      d: [0, 0.9632087487086639, 0.4527188687167434]
    })
  })

  it('resolvePalette defaults to prism, looks up names, passes objects through', () => {
    expect(resolvePalette(undefined)).toBe(PALETTES.prism)
    expect(resolvePalette('berry')).toBe(PALETTES.berry)
    const obj = accentPair('#FF0000', '#0000FF')
    expect(resolvePalette(obj)).toBe(obj)
  })

  it('ACCENT_ORDER matches the ACCENTS keys', () => {
    expect(ACCENT_ORDER).toEqual(Object.keys(ACCENTS))
  })

  it('shuffleAccentPalette returns a valid fitted Palette shape', () => {
    for (let i = 0; i < 20; i++) {
      const pal = shuffleAccentPalette() as unknown as Pal
      for (const key of ['a', 'b', 'c', 'd'] as const) {
        expect(Array.isArray(pal[key])).toBe(true)
        expect(pal[key].length).toBe(3)
        for (const v of pal[key]) expect(Number.isFinite(v)).toBe(true)
      }
      expect(pal.c).toEqual([0.5, 0.5, 0.5])
    }
  })
})
