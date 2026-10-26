<script setup lang="ts">
import { Eye, Heart, MessageCircle } from '@lucide/vue'

defineProps<{
  viewCount: number
  likeCount: number
  commentCount: number
  liked: boolean
  commentHref?: string
}>()

const emit = defineEmits<{
  like: []
}>()
</script>

<template>
  <div class="stats" @click.stop>
    <span class="stat">
      <Eye :size="14" />
      {{ viewCount }}
    </span>
    <button
      v-wave
      type="button"
      class="stat like"
      :class="{ on: liked }"
      :aria-label="liked ? '取消赞' : '赞'"
      @click="emit('like')"
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

.like.on {
  color: var(--danger);
}
</style>
