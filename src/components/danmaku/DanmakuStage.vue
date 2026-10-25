<script setup lang="ts">
import { ref, watch } from 'vue'
import { Heart } from '@lucide/vue'
import { useDanmakuVisible } from '@/composables/useDanmakuVisible'
import type { Danmaku } from '@/types/danmaku'

const props = defineProps<{
  items: Danmaku[]
}>()

const emit = defineEmits<{
  like: [id: number]
  reply: [item: Danmaku]
}>()

const { shown } = useDanmakuVisible()
const lanes = 6
const flying = ref<{ id: number; lane: number; duration: number; delay: number }[]>([])
const seen = new Set<number>()
let first = true

watch(
  () => props.items,
  (items) => {
    const fresh = !first
    first = false
    for (const item of items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      const duration = 12 + (item.content.length % 6)
      flying.value.push({
        id: item.id,
        lane: item.id % lanes,
        duration,
        delay: fresh ? 0 : -((item.id * 3) % duration),
      })
    }
  },
  { immediate: true },
)

function source(id: number) {
  return props.items.find((item) => item.id === id)
}

function label(id: number) {
  const item = source(id)
  if (!item) return ''
  return item.replyToNickname ? `回复 ${item.replyToNickname} ${item.content}` : item.content
}

function finish(id: number) {
  flying.value = flying.value.filter((item) => item.id !== id)
}

function reply(id: number) {
  const item = source(id)
  if (item) emit('reply', item)
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
          <button v-wave type="button" @click.stop="reply(item.id)">回复</button>
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
