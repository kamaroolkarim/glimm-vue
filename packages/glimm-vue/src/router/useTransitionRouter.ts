import { useRouter } from 'vue-router'
import { useGlimm } from '../vue/useGlimm'
import type { SweepHandle, SweepOptions } from '../core/types'

type Href = string

export type TransitionRouter = {
  /** Push a new route, animated by a sweep. Returns the sweep handle. */
  push: (href: Href, options?: SweepOptions) => SweepHandle
  /** Replace the current route, animated by a sweep. */
  replace: (href: Href, options?: SweepOptions) => SweepHandle
  /** Navigate back, animated by a sweep. */
  back: (options?: SweepOptions) => SweepHandle
  /** Refresh the current route, animated by a sweep. */
  refresh: (options?: SweepOptions) => SweepHandle
}

/**
 * Drop-in wrapper around Next.js's `useRouter()` that plays a glimm sweep
 * around each navigation. Use this for programmatic navigation (form submits,
 * conditional redirects, post-action redirects). For declarative tab links,
 * prefer `<TransitionLink>`.
 *
 * @example
 *   const router = useTransitionRouter()
 *   const onSubmit = async (data) => {
 *     await save(data)
 *     router.push('/dashboard', { palette: 'berry' })
 *   }
 */
export function useTransitionRouter(): TransitionRouter {
  const router = useRouter()
  const { sweep } = useGlimm()
  return {
    push: (href, options) => sweep(async () => { await router.push(href) }, options),
    replace: (href, options) => sweep(async () => { await router.replace(href) }, options),
    back: (options) => sweep(() => router.back(), options),
    refresh: (options) => sweep(() => router.go(0), options)
  }
}
