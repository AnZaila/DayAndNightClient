<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Heart } from '@lucide/vue'
import { useDanmakuVisible } from '@/composables/useDanmakuVisible'
import type { Danmaku } from '@/types/danmaku'

const props = defineProps<{
  items: Danmaku[]
}>()

const emit = defineEmits<{
  like: [id: number]
  needMore: []
}>()

const { shown } = useDanmakuVisible()
const lanes = 6
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const maxOnScreen = reduceMotion ? 20 : 8
const flying = ref<{ id: number; lane: number; duration: number; delay: number }[]>([])
const queued = ref<number[]>([])
const seen = new Set<number>()
const timers = new Map<number, number>()
let laneCursor = 0

watch(
  () => props.items,
  (items) => {
    for (const item of items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      queued.value.push(item.id)
    }
    pump()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  for (const timer of timers.values()) window.clearTimeout(timer)
})

function source(id: number) {
  return props.items.find((item) => item.id === id)
}

function label(id: number) {
  return source(id)?.content ?? ''
}

function pump() {
  while (flying.value.length < maxOnScreen && queued.value.length > 0) {
    const id = queued.value.shift()
    if (id == null) break
    const item = source(id)
    const duration = 12 + ((item?.content.length ?? 1) % 6)
    const delay = reduceMotion ? 0 : (flying.value.length % maxOnScreen) * 0.4
    flying.value.push({
      id,
      lane: laneCursor++ % lanes,
      duration,
      delay,
    })
    if (!reduceMotion) {
      timers.set(
        id,
        window.setTimeout(() => finish(id), (duration + delay) * 1000 + 500),
      )
    }
  }
  if (!reduceMotion && seen.size > 0 && queued.value.length < 4) emit('needMore')
}

function finish(id: number) {
  const timer = timers.get(id)
  if (timer != null) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
  if (!flying.value.some((item) => item.id === id)) return
  flying.value = flying.value.filter((item) => item.id !== id)
  pump()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="shown" class="stage">
      <span
        v-for="item in flying"
        :key="item.id"
        class="bullet"
        :style="{
          top: `${item.lane * 34 + 10}px`,
          animationDuration: `${item.duration}s`,
          animationDelay: `${item.delay}s`,
        }"
        @animationend="finish(item.id)"
      >
        {{ label(item.id) }}
        <span v-if="source(item.id)" class="tools">
          <button
            v-wave
            type="button"
            :class="{ on: source(item.id)?.liked }"
            @click.stop="emit('like', item.id)"
          >
            <Heart :size="12" :fill="source(item.id)?.liked ? 'currentColor' : 'none'" />
            <span v-if="source(item.id)?.likeCount">{{ source(item.id)?.likeCount }}</span>
          </button>
        </span>
      </span>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.stage {
  position: fixed;
  inset: 0;
  z-index: 35;
  overflow: hidden;
  pointer-events: none;
  container-type: size;
}

.bullet {
  position: absolute;
  left: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 70%;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgb(15 23 42 / 72%);
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: auto;
  animation-name: fly;
  animation-timing-function: linear;
  animation-fill-mode: forwards;

  &:hover {
    z-index: 1;
    animation-play-state: paused;
  }
}

.tools {
  display: none;
  align-items: center;
  gap: 8px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;

    &.on {
      color: #fda4af;
    }
  }
}

.bullet:hover .tools {
  display: inline-flex;
}

@keyframes fly {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-100cqw - 100%));
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 10px;
  }

  .bullet {
    position: static;
    left: auto;
    animation: none;
  }

  .tools {
    display: inline-flex;
  }
}
</style>
