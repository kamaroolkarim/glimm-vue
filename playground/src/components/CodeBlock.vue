<script setup lang="ts">
import CopyButton from './CopyButton.vue'

type Token = { text: string; cls: string }

const props = withDefaults(
  defineProps<{ label?: string; code: string; minHeight?: number }>(),
  { label: '', minHeight: 0 }
)

const TOKEN_RE =
  /(\/\/[^\n]*)|('[^']*'|"[^"]*")|(<\/?[A-Za-z][\w.-]*)|\b(import|from|export|default|function|return|const|let|await|async)\b/g

const KEYWORDS = new Set(['import', 'from', 'export', 'default', 'function', 'return', 'const', 'let', 'await', 'async'])

function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  line.replace(TOKEN_RE, (match, comment, str, tag, kw, offset: number) => {
    if (offset > last) tokens.push({ text: line.slice(last, offset), cls: 'plain' })
    if (comment) tokens.push({ text: match, cls: 'comment' })
    else if (str) tokens.push({ text: match, cls: 'string' })
    else if (tag) tokens.push({ text: match, cls: 'tag' })
    else if (kw && KEYWORDS.has(match)) tokens.push({ text: match, cls: 'keyword' })
    else tokens.push({ text: match, cls: 'plain' })
    last = offset + match.length
    return match
  })
  if (last < line.length) tokens.push({ text: line.slice(last), cls: 'plain' })
  return tokens
}

const lines = props.code.replace(/\n$/, '').split('\n').map(tokenize)
</script>

<template>
  <div class="code-card">
    <div class="code-head">
      <span class="code-label">{{ props.label }}</span>
      <CopyButton :code="props.code" :size="16" />
    </div>
    <div class="code-scroll" :style="props.minHeight ? { minHeight: props.minHeight + 'px' } : undefined">
      <pre><code><template v-for="(line, i) in lines" :key="i"><span v-for="(tok, j) in line" :key="j" :class="'tok-' + tok.cls">{{ tok.text }}</span><span v-if="i < lines.length - 1">&#10;</span></template></code></pre>
    </div>
  </div>
</template>

<style scoped>
.code-card {
  border-radius: 12px;
  overflow: hidden;
  background: #f7f7f7;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}

.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  border-bottom: 1px solid #ececec;
}

.code-label {
  font-family: Inter, sans-serif;
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  color: #9ca3af;
}

.code-scroll {
  overflow-x: auto;
  padding: 10px 14px;
}

pre {
  margin: 0;
}

code {
  font-family: var(--font-geist-mono), 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 20px;
  white-space: pre;
}

.tok-plain {
  color: #242529;
}

.tok-comment {
  color: #9da8a4;
  font-style: italic;
}

.tok-keyword {
  color: #3c5a86;
  font-weight: 500;
}

.tok-string {
  color: #4f7048;
}

.tok-tag {
  color: #1f7a6e;
  font-weight: 500;
}
</style>
