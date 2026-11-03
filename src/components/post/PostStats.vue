<script setup lang="ts">
import { Eye, Heart, MessageCircle } from '@lucide/vue'
import mojs from '@mojs/core'
import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const motion = usePreferredReducedMotion()
const reduced = computed(() => motion.value === 'reduce')
const likeBtn = useTemplateRef('likeBtn')

const props = defineProps<{
  viewCount: number
  likeCount: number
  commentCount: number
  liked: boolean
  commentHref?: string
}>()

const emit = defineEmits<{
  like: []
}>()

let burst: { replay: () => void } | null = null

onMounted(() => {
  const el = likeBtn.value
  if (reduced.value || !el) return
  burst = new mojs.Burst({
    parent: el,
    count: 6,
    radius: { 0: 26 },
    degree: 360,
    isShowEnd: false,
    children: {
      shape: 'circle',
      radius: { 5: 0 },
      fill: ['#e8a4ac', '#fff4f0', '#d57b84'],
      duration: 560,
      easing: 'cubic.out',
    },
  })
})

onBeforeUnmount(() => {
  burst = null
})

function onLike() {
  if (!props.liked && !reduced.value) burst?.replay()
  emit('like')
}
</script>

<template>
  <div class="stats" @click.stop>
    <span class="stat">
      <Eye :size="14" />
      {{ viewCount }}
    </span>
    <button
      ref="likeBtn"
      v-wave
      type="button"
      class="stat like"
      :class="{ on: liked }"
      :aria-label="liked ? t('action.unlike') : t('action.like')"
      @click="onLike"
    >
      <Heart :size="14" :fill="liked ? 'currentColor' : 'none'" />
      {{ likeCount }}
    </button>
    <a v-if="commentHref" class="stat" :href="commentHref">
      <MessageCircle :size="14" />
      {{ commentCount }}
    </a>
    <span v-else class="stat">
      <MessageCircle :size="14" />
      {{ commentCount }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 28px;
  padding: 0;
  color: var(--muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  cursor: default;
}

button.stat,
a.stat {
  cursor: pointer;

  &:hover {
    color: var(--heading);
  }
}

.like {
  position: relative;
  overflow: visible;
}

.like.on {
  color: var(--danger);
}
</style>
