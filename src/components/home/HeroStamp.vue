<script setup lang="ts">
import { annotate, type RoughAnnotation } from 'rough-notation'
import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, onBeforeUnmount, useTemplateRef, watchPostEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  day: string
  meta: string
  slogan?: string
}>()

const { t } = useI18n()
const motion = usePreferredReducedMotion()
const reduced = computed(() => motion.value === 'reduce')
const dayMark = useTemplateRef('dayMark')

let note: RoughAnnotation | null = null
let frame = 0

function clear() {
  cancelAnimationFrame(frame)
  frame = 0
  note?.remove()
  note = null
}

watchPostEffect((onCleanup) => {
  const el = dayMark.value
  const skip = reduced.value
  void props.day
  let cancelled = false
  let attempts = 0

  onCleanup(() => {
    cancelled = true
    clear()
  })

  if (!el || skip) return

  const draw = () => {
    if (cancelled) return
    const target = dayMark.value
    if (!target) return
    const ready = target.isConnected && target.getBoundingClientRect().width >= 1
    if (!ready) {
      if (attempts++ < 60) frame = requestAnimationFrame(draw)
      return
    }
    note?.remove()
    note = annotate(target, {
      type: 'underline',
      color: 'rgba(255, 214, 196, 0.92)',
      strokeWidth: 1.8,
      padding: [1, 6],
      iterations: 1,
      animationDuration: 720,
    })
    note.show()
  }

  frame = requestAnimationFrame(draw)
})

onBeforeUnmount(clear)
</script>

<template>
  <div class="stamp">
    <p class="label">{{ t('hero.today') }}</p>
    <p class="day">
      <span ref="dayMark">{{ day }}</span>
    </p>
    <p class="meta">{{ meta }}</p>
    <p v-if="slogan" class="slogan">{{ slogan }}</p>
  </div>
</template>

<style scoped lang="scss">
.stamp {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.24em;
  opacity: 0.82;
}

.day {
  position: relative;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(38px, 5.6vw, 62px);
  letter-spacing: var(--tracking-display);
  line-height: 1.02;
}

.meta {
  margin: 0;
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  opacity: 0.78;
}

.slogan {
  margin: var(--space-2xs) 0 0;
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.08em;
  opacity: 0.92;
}
</style>
