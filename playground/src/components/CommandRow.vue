<script setup lang="ts">
import CopyButton from './CopyButton.vue'

const props = defineProps<{ command: string }>()
</script>

<template>
  <div class="cmd-row">
    <span class="cmd-prompt">$</span>
    <code class="cmd-code">{{ props.command }}</code>
    <CopyButton :code="props.command" :size="18" />
  </div>
</template>

<style scoped>
.cmd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f7f7f7;
  border-radius: 8px;
  padding: 8px 12px;
}

.cmd-prompt {
  font-family: var(--font-geist-mono), 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 20px;
  color: #9ca3af;
  user-select: none;
  flex-shrink: 0;
}

.cmd-code {
  font-family: var(--font-geist-mono), 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 20px;
  color: #242529;
  flex: 1;
}
</style>
