import type { PaletteName } from '@kamaroolkarim/glimm-vue'

export type PaletteVisual = {
  name: PaletteName
  gradient: string
  ring: string
}

export const PALETTE_VISUALS: PaletteVisual[] = [
  {
    name: 'prism',
    gradient:
      'linear-gradient(90deg, rgb(0, 252, 185) 0%, rgb(0, 186, 244) 14%, rgb(55, 128, 255) 29%, rgb(121, 89, 255) 43%, rgb(187, 77, 217) 57%, rgb(239, 94, 146) 71%, rgb(255, 136, 62) 86%, rgb(255, 197, 0) 100%)',
    ring: 'rgb(155, 79, 243)'
  },
  {
    name: 'berry',
    gradient:
      'linear-gradient(90deg, rgb(248, 119, 48) 0%, rgb(255, 107, 58) 14%, rgb(255, 91, 84) 29%, rgb(255, 76, 122) 43%, rgb(253, 63, 164) 57%, rgb(243, 57, 202) 71%, rgb(232, 57, 228) 86%, rgb(221, 64, 237) 100%)',
    ring: 'rgb(255, 69, 143)'
  },
  {
    name: 'lagoon',
    gradient:
      'linear-gradient(90deg, rgb(36, 122, 231) 0%, rgb(0, 154, 255) 14%, rgb(0, 188, 255) 29%, rgb(7, 217, 234) 43%, rgb(57, 235, 190) 57%, rgb(125, 239, 135) 71%, rgb(197, 228, 79) 86%, rgb(255, 204, 34) 100%)',
    ring: 'rgb(29, 228, 214)'
  },
  {
    name: 'citrus',
    gradient:
      'linear-gradient(90deg, rgb(66, 247, 176) 0%, rgb(124, 255, 105) 14%, rgb(185, 252, 43) 29%, rgb(237, 225, 5) 43%, rgb(255, 184, 0) 57%, rgb(255, 138, 18) 71%, rgb(255, 95, 68) 86%, rgb(214, 64, 135) 100%)',
    ring: 'rgb(255, 206, 0)'
  },
  {
    name: 'azure',
    gradient:
      'linear-gradient(90deg, rgb(24, 191, 255) 0%, rgb(9, 189, 255) 14%, rgb(0, 181, 255) 29%, rgb(0, 168, 255) 43%, rgb(0, 152, 255) 57%, rgb(10, 137, 255) 71%, rgb(26, 126, 255) 86%, rgb(43, 120, 255) 100%)',
    ring: 'rgb(0, 160, 255)'
  },
  {
    name: 'ember',
    gradient:
      'linear-gradient(90deg, rgb(205, 255, 52) 0%, rgb(228, 231, 9) 14%, rgb(247, 192, 0) 29%, rgb(255, 146, 12) 43%, rgb(255, 102, 57) 57%, rgb(255, 68, 121) 71%, rgb(239, 52, 191) 86%, rgb(218, 56, 254) 100%)',
    ring: 'rgb(255, 123, 31)'
  }
]

export const VIGNETTE =
  'radial-gradient(ellipse 70% 78% at 50% 50%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.7) 82%, #ffffff 100%)'
