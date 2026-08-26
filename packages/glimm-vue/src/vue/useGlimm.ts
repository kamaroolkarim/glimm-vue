import { inject } from 'vue'
import { GLIMM_KEY } from './context'
import type { Ctx } from './context'

export function useGlimm(): Ctx {
  const ctx = inject(GLIMM_KEY)
  if (!ctx) {
    throw new Error('useGlimm must be used inside <GlimmProvider>')
  }
  return ctx
}
