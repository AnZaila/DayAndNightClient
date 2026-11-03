<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Heart } from '@lucide/vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import { useDanmakuVisible } from '@/composables/useDanmakuVisible'
import type { Danmaku } from '@/types/danmaku'

const props = defineProps<{
  items: Danmaku[]
  contained?: boolean
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
let flight = 0

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

watch(shown, (value) => {
  flight += 1
  clearTimers()
  if (!value || reduceMotion) return
  const token = flight
  for (const item of flying.value) schedule(item, token)
  if (seen.size > 0 && queued.value.length < 4) emit('needMore')
})

onBeforeUnmount(() => {
  clearTimers()
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
    if (shown.value && !reduceMotion) {
      schedule({ id, duration, delay }, flight)
    }
  }
  if (shown.value && !reduceMotion && seen.size > 0 && queued.value.length < 4) emit('needMore')
}

function schedule(item: { id: number; duration: number; delay: number }, token: number) {
  timers.set(
    item.id,
    window.setTimeout(
      () => {
        if (token !== flight || !shown.value) return
        finish(item.id)
      },
      (item.duration + item.delay) * 1000 + 500,
    ),
  )
}

function clearTimers() {
  for (const timer of timers.values()) window.clearTimeout(timer)
  timers.clear()
}

function onEnd(id: number, event: AnimationEvent) {
  const current = event.currentTarget
  if (event.target !== current || !(current instanceof Element) || !current.isConnected) return
  const item = flying.value.find((entry) => entry.id === id)
  if (!item || event.elapsedTime + 0.05 < item.duration) return
  finish(id)
}

function finish(id: number) {
  if (!shown.value) return
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
  <Teleport to="body" :disabled="contained">
    <div v-if="shown" class="stage" :class="{ contained }">
      <span
        v-for="item in flying"
        :key="item.id"
        class="bullet"
        :style="{
          top: `${item.lane * 34 + 10}px`,
          animationDuration: `${item.duration}s`,
          animationDelay: `${item.delay}s`,
        }"
        @animationend="onEnd(item.id, $event)"
      >
        <ProfileLink v-if="source(item.id)?.avatarUrl" :user-id="source(item.id)?.userId">
          <UserAvatar
            :src="source(item.id)?.avatarUrl"
            :name="source(item.id)?.nickname"
            :size="22"
          />
        </ProfileLink>
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
  top: var(--header-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 35;
  overflow: hidden;
  pointer-events: none;

  &.contained {
    position: absolute;
    top: 0;
    z-index: 4;
    container-type: inline-size;

    .bullet {
      animation-name: fly-box;
    }
  }
}

.bullet {
  position: absolute;
  left: 100%;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  max-width: 70%;
  padding: var(--space-2xs) var(--space-sm);
  border-radius: 999px;
  background: color-mix(in oklab, var(--surface) 82%, transparent);
  backdrop-filter: blur(12px) saturate(140%);
  box-shadow:
    0 6px 18px oklch(24% 0.02 265 / 0.12),
    inset 0 0 0 1px color-mix(in oklab, var(--line) 70%, transparent);
  color: var(--text);
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
  gap: var(--space-xs);

  button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;

    &:hover {
      color: var(--primary);
    }

    &.on {
      color: var(--danger);
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
    transform: translateX(calc(-100vw - 100%));
  }
}

@keyframes fly-box {
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
    gap: var(--space-xs);
    padding: var(--space-sm);
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
