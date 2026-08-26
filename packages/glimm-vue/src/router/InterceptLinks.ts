import { defineComponent, onBeforeUnmount, onMounted, watch } from 'vue'
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useGlimm } from '../vue/useGlimm'
import type { SweepFn } from '../vue/context'
import type { SweepOptions } from '../core/types'

export type InterceptLinksOptions = {
  /**
   * Per-link override. Default selects every internal `<a href>` that's not
   * marked with `data-glimm-skip`, doesn't `target="_blank"`, isn't an
   * anchor or download, and isn't a modifier-click. You usually don't need
   * to customize this.
   */
  shouldIntercept?: (e: MouseEvent, anchor: HTMLAnchorElement) => boolean
  /** Optional sweep overrides applied to every intercepted nav. */
  sweep?: SweepOptions
}

const defaultShouldIntercept = (e: MouseEvent, a: HTMLAnchorElement) => {
  if (e.defaultPrevented) return false
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  if (e.button !== 0) return false
  if (a.dataset.glimmSkip !== undefined) return false
  if (a.target && a.target !== '_self') return false
  if (a.hasAttribute('download')) return false
  if (!a.href) return false
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  if (url.pathname === window.location.pathname && url.hash) return false
  return true
}

/**
 * Vanilla, framework-agnostic: installs a delegated click listener on the
 * document that runs every same-origin link click through a sweep.
 * Returns a cleanup function that removes the listener.
 *
 * Pair with a navigate callback that performs the actual route change.
 */
export function interceptLinks(
  sweep: SweepFn,
  navigate: (href: string) => void,
  opts: InterceptLinksOptions = {}
): () => void {
  const shouldIntercept = opts.shouldIntercept ?? defaultShouldIntercept
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    const anchor = target?.closest?.('a')
    if (!anchor) return
    if (!shouldIntercept(e, anchor)) return
    const href = new URL(anchor.href, window.location.href)
    e.preventDefault()
    sweep(() => navigate(href.pathname + href.search + href.hash), opts.sweep)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}

/**
 * React hook variant. Drop it once at the root of a Next.js app (e.g. in
 * the layout that wraps <GlimmProvider>) and every internal link click
 * gets a sweep automatically. Opt individual links out with
 * `data-glimm-skip`.
 *
 * @example
 *   export default function Layout({ children }) {
 *     return (
 *       <GlimmProvider>
 *         <InterceptLinks />
 *         {children}
 *       </GlimmProvider>
 *     )
 *   }
 */
export const InterceptLinks = defineComponent({
  name: 'InterceptLinks',
  props: {
    shouldIntercept: Function as PropType<(e: MouseEvent, anchor: HTMLAnchorElement) => boolean>,
    sweep: Object as PropType<SweepOptions>
  },
  setup(props) {
    const router = useRouter()
    const { sweep } = useGlimm()
    let cleanup: (() => void) | undefined
    const subscribe = () => {
      cleanup?.()
      cleanup = interceptLinks(sweep, (href) => router.push(href), {
        shouldIntercept: props.shouldIntercept,
        sweep: props.sweep
      })
    }
    onMounted(subscribe)
    watch(() => props.sweep, subscribe)
    onBeforeUnmount(() => cleanup?.())
    return () => null
  }
})
