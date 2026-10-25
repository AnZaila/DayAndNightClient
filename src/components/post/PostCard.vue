<script setup lang="ts">
import { computed } from 'vue'
import { motion } from 'motion-v'
import UserAvatar from '@/components/common/UserAvatar.vue'
import DiaryIcon from '@/components/post/DiaryIcon.vue'
import type { PostSummary } from '@/types/post'
import { plainText } from '@/utils/text'

const props = defineProps<{
  post: PostSummary
  index: number
}>()

const emit = defineEmits<{
  open: [id: number]
}>()

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const excerpt = computed(() => plainText(props.post.excerpt))
</script>

<template>
  <motion.div
    :initial="reduced ? false : { opacity: 0, y: 10 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : Math.min(index, 8) * 0.05 }"
  >
    <article class="card post" @click="emit('open', post.id)">
      <img v-if="post.coverUrl" :src="post.coverUrl" alt="" />
      <p>{{ excerpt || '点进去看这一篇。' }}</p>
      <small>
        <UserAvatar :src="post.authorAvatarUrl" :name="post.displayName" :size="22" />
        <span>{{ post.displayName }}</span>
        <span v-if="post.mood" class="mark"
          ><DiaryIcon kind="mood" :value="post.mood" :size="13" /> {{ post.mood }}</span
        >
        <span v-if="post.weather" class="mark"
          ><DiaryIcon kind="weather" :value="post.weather" :size="13" /> {{ post.weather }}</span
        >
        <span v-if="post.visibility === 'PRIVATE'"> · 仅双方</span>
      </small>
    </article>
  </motion.div>
</template>

<style scoped lang="scss">
.post {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  transition: transform 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }
}

img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: var(--radius);
  pointer-events: none;
}

p {
  color: var(--heading);
}

small {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}

.mark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .post:hover {
    transform: none;
  }
}
</style>
