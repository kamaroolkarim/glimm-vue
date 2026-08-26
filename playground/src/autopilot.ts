import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTransitionRouter } from 'glimm-vue/router'

export const AUTOPILOT_CYCLE = [
  { path: '/demos/publish', palette: 'citrus' },
  { path: '/demos/autopilot', palette: 'lagoon' },
  { path: '/demos/theme', palette: 'azure' },
  { path: '/demos/tasks', palette: 'berry' },
  { path: '/', palette: 'prism' },
] as const

export const autopilotRunning = ref(false)

let timer: ReturnType<typeof setInterval> | undefined
let cursor = 0
let expected: string | null = null
let everStarted = false
let guardInstalled = false

export function useAutopilot(intervalMs = 3000) {
  const router = useRouter()
  const { push } = useTransitionRouter()

  const pause = () => {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
    autopilotRunning.value = false
  }

  const tick = () => {
    cursor = (cursor + 1) % AUTOPILOT_CYCLE.length
    const next = AUTOPILOT_CYCLE[cursor]!
    expected = next.path
    void push(next.path, { palette: next.palette })
  }

  const resume = () => {
    if (timer !== undefined) return
    autopilotRunning.value = true
    timer = setInterval(tick, intervalMs)
  }

  if (!guardInstalled) {
    guardInstalled = true
    router.afterEach((to) => {
      if (autopilotRunning.value && to.path !== expected) pause()
    })
  }

  onMounted(() => {
    if (!everStarted) {
      everStarted = true
      resume()
    }
  })

  return { pause, resume }
}
