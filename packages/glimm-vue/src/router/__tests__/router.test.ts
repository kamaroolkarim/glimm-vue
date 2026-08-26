import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'
import { InterceptLinks, interceptLinks } from '../InterceptLinks'
import { TransitionLink } from '../TransitionLink'
import { useTransitionRouter } from '../useTransitionRouter'
import type { TransitionRouter } from '../useTransitionRouter'
import type { SweepHandle, SweepOptions } from '../../core/types'

const fakeSweep = vi.hoisted(() =>
  vi.fn(
    (navigate: () => void | Promise<void>, _options?: SweepOptions): SweepHandle => {
      navigate()
      return { midpoint: Promise.resolve(), done: Promise.resolve(), cancel: () => {} }
    }
  )
)

vi.mock('../../vue/useGlimm', () => ({
  useGlimm: () => ({ sweep: fakeSweep, defaults: {} })
}))

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => h('div', 'home') } },
      { path: '/about', component: { render: () => h('div', 'about') } },
      { path: '/x', component: { render: () => h('div', 'x') } }
    ]
  })
}

const appended: HTMLElement[] = []

function appendAnchor(attrs: Record<string, string> & { href?: string }): HTMLAnchorElement {
  const a = document.createElement('a')
  for (const [key, value] of Object.entries(attrs)) a.setAttribute(key, value)
  a.textContent = 'link'
  document.body.appendChild(a)
  appended.push(a)
  return a
}

function click(target: Element, init: MouseEventInit = {}): MouseEvent {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })
  target.dispatchEvent(e)
  return e
}

function setLocation(url: string): void {
  const happy = (window as Window & { happyDOM?: { setURL: (url: string) => void } }).happyDOM
  happy?.setURL(url)
}

const lastNavigate = () => fakeSweep.mock.calls[fakeSweep.mock.calls.length - 1]![0]!
const lastOptions = () => fakeSweep.mock.calls[fakeSweep.mock.calls.length - 1]![1]

beforeEach(() => {
  fakeSweep.mockClear()
  setLocation('http://localhost/')
})

afterEach(() => {
  for (const el of appended.splice(0)) el.remove()
})

describe('interceptLinks', () => {
  it('intercepts a plain internal link and sweeps navigate with pathname+search+hash', () => {
    const navigate = vi.fn()
    const cleanup = interceptLinks(fakeSweep, navigate)
    const anchor = appendAnchor({ href: '/about?q=1#sec' })
    const e = click(anchor)
    expect(e.defaultPrevented).toBe(true)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/about?q=1#sec')
    expect(lastOptions()).toBeUndefined()
    cleanup()
  })

  it('passes opts.sweep through to the sweep', () => {
    const navigate = vi.fn()
    const options: SweepOptions = { sweepMs: 500 }
    const cleanup = interceptLinks(fakeSweep, navigate, { sweep: options })
    click(appendAnchor({ href: '/about' }))
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    expect(lastOptions()).toBe(options)
    cleanup()
  })

  it('uses a custom shouldIntercept instead of the default', () => {
    const navigate = vi.fn()
    const shouldIntercept = vi.fn((_e: MouseEvent, _anchor: HTMLAnchorElement) => false)
    const cleanup = interceptLinks(fakeSweep, navigate, { shouldIntercept })
    const anchor = appendAnchor({ href: '/about' })
    const e = click(anchor)
    expect(shouldIntercept).toHaveBeenCalledTimes(1)
    expect(shouldIntercept.mock.calls[0]![0]).toBe(e)
    expect(shouldIntercept.mock.calls[0]![1]).toBe(anchor)
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
    cleanup()
  })

  it.each([
    ['data-glimm-skip', () => appendAnchor({ href: '/about', 'data-glimm-skip': '' })],
    ['target=_blank', () => appendAnchor({ href: '/about', target: '_blank' })],
    ['download attribute', () => appendAnchor({ href: '/about', download: '' })],
    ['cross-origin href', () => appendAnchor({ href: 'https://example.com/about' })],
    ['same-page hash link', () => appendAnchor({ href: '#foo' })],
    ['missing href', () => appendAnchor({})]
  ])('does not intercept a link with %s', (_name, makeAnchor) => {
    const navigate = vi.fn()
    const cleanup = interceptLinks(fakeSweep, navigate)
    const anchor = makeAnchor()
    const e = click(anchor)
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
    cleanup()
  })

  it('does not intercept modifier clicks', () => {
    const navigate = vi.fn()
    const cleanup = interceptLinks(fakeSweep, navigate)
    const anchor = appendAnchor({ href: '/about' })
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }]) {
      const e = click(anchor, init)
      expect(e.defaultPrevented).toBe(false)
    }
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    cleanup()
  })

  it('does not intercept non-primary buttons', () => {
    const navigate = vi.fn()
    const cleanup = interceptLinks(fakeSweep, navigate)
    const anchor = appendAnchor({ href: '/about' })
    const e = click(anchor, { button: 2 })
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
    cleanup()
  })

  it('ignores clicks that did not happen on or inside an anchor', () => {
    const navigate = vi.fn()
    const cleanup = interceptLinks(fakeSweep, navigate)
    const span = document.createElement('span')
    document.body.appendChild(span)
    appended.push(span)
    const e = click(span)
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
    cleanup()
  })

  it('returns a cleanup function that removes the listener', () => {
    const navigate = vi.fn()
    const cleanup = interceptLinks(fakeSweep, navigate)
    cleanup()
    const e = click(appendAnchor({ href: '/about' }))
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
  })
})

describe('TransitionLink', () => {
  it('renders an anchor via RouterLink with the slot content', () => {
    const router = makeRouter()
    const wrapper = mount(TransitionLink, {
      props: { to: '/x' },
      slots: { default: () => 'go' },
      global: { plugins: [router] }
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.element.getAttribute('href')).toBe('/x')
    expect(wrapper.text()).toBe('go')
    wrapper.unmount()
  })

  it('sweeps around router.push on a plain left click', async () => {
    const router = makeRouter()
    const wrapper = mount(TransitionLink, {
      props: { to: '/x' },
      global: { plugins: [router] }
    })
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const e = click(wrapper.element)
    expect(e.defaultPrevented).toBe(true)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    const navigate = lastNavigate()
    await navigate()
    expect(pushSpy).toHaveBeenCalledTimes(2)
    expect(pushSpy).toHaveBeenNthCalledWith(1, '/x')
    expect(pushSpy).toHaveBeenNthCalledWith(2, '/x')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/x'))
    wrapper.unmount()
  })

  it('sweeps around router.replace when replace is set', async () => {
    const router = makeRouter()
    const wrapper = mount(TransitionLink, {
      props: { to: '/x', replace: true, sweep: { sweepMs: 300 } },
      global: { plugins: [router] }
    })
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')
    const pushSpy = vi.spyOn(router, 'push')
    const e = click(wrapper.element)
    expect(e.defaultPrevented).toBe(true)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    expect(lastOptions()).toEqual({ sweepMs: 300 })
    await lastNavigate()()
    expect(replaceSpy).toHaveBeenCalledTimes(2)
    expect(replaceSpy).toHaveBeenCalledWith('/x')
    expect(pushSpy).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/x'))
    wrapper.unmount()
  })

  it('falls back to a normal link click for modifier clicks', async () => {
    const router = makeRouter()
    const wrapper = mount(TransitionLink, {
      props: { to: '/x' },
      global: { plugins: [router] }
    })
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const e = click(wrapper.element, { metaKey: true })
    expect(e.defaultPrevented).toBe(false)
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(pushSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/')
    wrapper.unmount()
  })

  it('skips the sweep but still navigates when noTransition is set', async () => {
    const router = makeRouter()
    const wrapper = mount(TransitionLink, {
      props: { to: '/x', noTransition: true },
      global: { plugins: [router] }
    })
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const e = click(wrapper.element)
    expect(e.defaultPrevented).toBe(true)
    expect(fakeSweep).not.toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(pushSpy).toHaveBeenCalledTimes(1)
      expect(pushSpy).toHaveBeenCalledWith('/x')
      expect(router.currentRoute.value.fullPath).toBe('/x')
    })
    wrapper.unmount()
  })

  it('does not sweep external http links', async () => {
    const router = makeRouter()
    const wrapper = mount(TransitionLink, {
      props: { to: 'https://example.com/x' },
      global: { plugins: [router] }
    })
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const e = click(wrapper.element)
    expect(e.defaultPrevented).toBe(false)
    expect(fakeSweep).not.toHaveBeenCalled()
    expect(pushSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('chains a user onClick and skips the sweep when it prevented default', async () => {
    const router = makeRouter()
    const userClick = vi.fn()
    const wrapper = mount(TransitionLink, {
      props: { to: '/x', onClick: userClick },
      global: { plugins: [router] }
    })
    await router.isReady()
    const e = click(wrapper.element)
    expect(userClick).toHaveBeenCalledTimes(1)
    expect(userClick).toHaveBeenCalledWith(e)
    expect(e.defaultPrevented).toBe(true)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    wrapper.unmount()

    fakeSweep.mockClear()
    const preventingClick = vi.fn((event: MouseEvent) => event.preventDefault())
    const wrapper2 = mount(TransitionLink, {
      props: { to: '/x', onClick: preventingClick },
      global: { plugins: [router] }
    })
    const e2 = click(wrapper2.element)
    expect(preventingClick).toHaveBeenCalledTimes(1)
    expect(e2.defaultPrevented).toBe(true)
    expect(fakeSweep).not.toHaveBeenCalled()
    wrapper2.unmount()
  })
})

describe('useTransitionRouter', () => {
  let transitionRouter: TransitionRouter | undefined
  const Consumer = defineComponent({
    name: 'RouterConsumer',
    setup() {
      transitionRouter = useTransitionRouter()
      return () => h('div')
    }
  })

  beforeEach(() => {
    transitionRouter = undefined
  })

  it('push sweeps around router.push with the given options', async () => {
    const router = makeRouter()
    const wrapper = mount(Consumer, { global: { plugins: [router] } })
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const options: SweepOptions = { sweepMs: 500 }
    transitionRouter!.push('/x', options)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    expect(lastOptions()).toBe(options)
    await lastNavigate()()
    expect(pushSpy).toHaveBeenCalledWith('/x')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/x'))
    wrapper.unmount()
  })

  it('replace, back and refresh delegate to the router inside the sweep', async () => {
    const router = makeRouter()
    const wrapper = mount(Consumer, { global: { plugins: [router] } })
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')
    const backSpy = vi.spyOn(router, 'back')
    const goSpy = vi.spyOn(router, 'go')

    transitionRouter!.replace('/about')
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    await lastNavigate()()
    expect(replaceSpy).toHaveBeenCalledTimes(2)
    expect(replaceSpy).toHaveBeenCalledWith('/about')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/about'))

    transitionRouter!.back()
    expect(fakeSweep).toHaveBeenCalledTimes(2)
    await lastNavigate()()
    expect(backSpy).toHaveBeenCalledTimes(2)

    transitionRouter!.refresh()
    expect(fakeSweep).toHaveBeenCalledTimes(3)
    await lastNavigate()()
    expect(goSpy).toHaveBeenCalledTimes(2)
    expect(goSpy).toHaveBeenCalledWith(0)
    wrapper.unmount()
  })
})

describe('InterceptLinks', () => {
  it('renders nothing', () => {
    const router = makeRouter()
    const wrapper = mount(InterceptLinks, {
      slots: { default: () => h('a', { href: '/about' }, 'about') },
      global: { plugins: [router] }
    })
    expect(wrapper.element.nodeType).toBe(Node.COMMENT_NODE)
    expect(wrapper.findAll('a')).toHaveLength(0)
    wrapper.unmount()
  })

  it('subscribes on mount, intercepts clicks and navigates on navigate', async () => {
    const router = makeRouter()
    const anchor = appendAnchor({ href: '/about' })
    const wrapper = mount(InterceptLinks, { global: { plugins: [router] } })
    await router.isReady()
    const e = click(anchor)
    expect(e.defaultPrevented).toBe(true)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    await lastNavigate()()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/about'))
    wrapper.unmount()
  })

  it('removes the listener on unmount', async () => {
    const router = makeRouter()
    const anchor = appendAnchor({ href: '/about' })
    const wrapper = mount(InterceptLinks, { global: { plugins: [router] } })
    await router.isReady()
    click(anchor)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    const e = click(anchor)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    expect(e.defaultPrevented).toBe(false)
  })

  it('re-subscribes when the sweep prop changes but keeps a stale shouldIntercept', async () => {
    const router = makeRouter()
    const anchor = appendAnchor({ href: '/about' })
    const never = vi.fn(() => false)
    const always = vi.fn(() => true)
    const sweepA: SweepOptions = { sweepMs: 1 }
    const sweepB: SweepOptions = { sweepMs: 2 }
    const wrapper = mount(InterceptLinks, {
      props: { shouldIntercept: never, sweep: sweepA },
      global: { plugins: [router] }
    })
    await router.isReady()
    click(anchor)
    expect(never).toHaveBeenCalledTimes(1)
    expect(fakeSweep).not.toHaveBeenCalled()

    await wrapper.setProps({ shouldIntercept: always })
    click(anchor)
    expect(always).not.toHaveBeenCalled()
    expect(fakeSweep).not.toHaveBeenCalled()

    await wrapper.setProps({ sweep: sweepB })
    click(anchor)
    expect(always).toHaveBeenCalledTimes(1)
    expect(fakeSweep).toHaveBeenCalledTimes(1)
    expect(lastOptions()).toEqual(sweepB)
    wrapper.unmount()
  })
})
