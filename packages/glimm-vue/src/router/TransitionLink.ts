import { defineComponent, h } from 'vue'
import type { PropType, UnwrapRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { NavigationFailure, RouteLocationRaw, UseLinkReturn } from 'vue-router'
import { useGlimm } from '../vue/useGlimm'
import type { SweepOptions } from '../core/types'

type LinkProps = {
  to: RouteLocationRaw
  replace?: boolean
  target?: string
}

export type TransitionLinkProps = LinkProps & {
  /** Per-link sweep overrides (palette, direction, duration…). */
  sweep?: SweepOptions
  /** If true, skip the sweep and just navigate. Default false. */
  noTransition?: boolean
}

/**
 * Drop-in replacement for next/link that plays a glimm sweep around the navigation.
 * Falls back to a normal Link click for modifier clicks, target=_blank, external URLs,
 * and same-page anchors.
 */
export const TransitionLink = defineComponent({
  name: 'TransitionLink',
  inheritAttrs: false,
  props: {
    to: { type: [String, Object] as PropType<RouteLocationRaw>, required: true },
    replace: Boolean,
    target: String,
    sweep: Object as PropType<SweepOptions>,
    noTransition: Boolean
  },
  setup(props, { attrs, slots }) {
    const router = useRouter()
    const { sweep } = useGlimm()
    const handleClick = (
      e: MouseEvent,
      navigate: (e?: MouseEvent) => Promise<void | NavigationFailure>
    ) => {
      ;(attrs.onClick as Function | undefined)?.(e)
      if (e.defaultPrevented) return
      if (props.noTransition) return navigate(e)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      if (props.target && props.target !== '_self') return
      const href = typeof props.to === 'string' ? props.to : props.to?.path ?? ''
      if (!href) return navigate(e)
      if (href.startsWith('http')) return
      if (href.startsWith('#')) return navigate(e)
      e.preventDefault()
      sweep(() => {
        if (props.replace) router.replace(props.to)
        else router.push(props.to)
      }, props.sweep)
    }
    return () =>
      h(
        RouterLink,
        { to: props.to, replace: props.replace || undefined, custom: true },
        {
          default: (link: UnwrapRef<UseLinkReturn>) =>
            h(
              'a',
              {
                ...attrs,
                'aria-current': link.isExactActive ? 'page' : null,
                href: link.href,
                target: props.target,
                class: [
                  attrs.class,
                  {
                    'router-link-active': link.isActive,
                    'router-link-exact-active': link.isExactActive
                  }
                ],
                onClick: (e: MouseEvent) => handleClick(e, link.navigate)
              },
              slots.default?.(link)
            )
        }
      )
  }
})

export type { TransitionRouter } from './useTransitionRouter'
