<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ code: string; size?: number }>(), { size: 18 })

const copied = ref(false)
let timer: number | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = props.code
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <button type="button" class="copy-btn" :aria-label="copied ? 'Copied' : 'Copy'" :style="{ color: copied ? '#242529' : '#BFBFBF' }" @click="copy">
    <svg v-if="copied" xmlns="http://www.w3.org/2000/svg" :width="props.size" :height="props.size" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-check" style="display: block; flex-shrink: 0"><path d="M20.707 6.293a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1 -1.414 0l-5 -5a1 1 0 0 1 1.414 -1.414l4.293 4.293l9.293 -9.293a1 1 0 0 1 1.414 0" /></svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" :width="props.size" :height="props.size" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-copy" style="display: block; flex-shrink: 0"><path d="M20.926 7.074a3.67 3.67 0 0 1 1.074 2.593v8.666a3.667 3.667 0 0 1 -3.667 3.667h-8.666a3.667 3.667 0 0 1 -3.667 -3.667v-8.666q 0 -.053 .005 -.102a3.66 3.66 0 0 1 3.662 -3.565h8.666c.973 0 1.905 .386 2.593 1.074" /><path d="M17.374 3.514a1 1 0 1 1 -1.748 .972c-.221 -.398 -.342 -.486 -.626 -.486h-10c-.548 0 -1 .452 -1 1v9.998c0 .36 .194 .692 .507 .87a1 1 0 1 1 -.99 1.738a3 3 0 0 1 -1.517 -2.606v-10c0 -1.652 1.348 -3 3 -3h10c1.094 0 1.828 .533 2.374 1.514" /></svg>
  </button>
</template>

<style scoped>
.copy-btn {
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.copy-btn:hover {
  color: #242529;
}
</style>
