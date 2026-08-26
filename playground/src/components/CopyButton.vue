<script setup lang="ts">
import { ref } from 'vue'
import Icon from './Icon.vue'

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
    <Icon :name="copied ? 'check' : 'copy'" :size="props.size" />
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
