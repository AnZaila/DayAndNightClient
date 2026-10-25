<script setup lang="ts">
import { computed } from 'vue'
import { motion } from 'motion-v'
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
  <motion.article
    class="card post"
    :initial="reduced ? false : { opacity: 0, y: 10 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : Math.min(index, 8) * 0.05 }"
    @click="emit('open', post.id)"
  >
    <img v-if="post.coverUrl" :src="post.coverUrl" alt="" />
    <p>{{ excerpt || '点进去看这一篇。' }}</p>
    <small>
      {{ post.displayName }}
      <span v-if="post.mood"> · {{ post.mood }}</span>
      <span v-if="post.visibility === 'PRIVATE'"> · 仅双方</span>
    </small>
  </motion.article>
</template>

<style scoped lang="scss">
.post {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
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
  color: var(--muted);
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .post:hover {
    transform: none;
  }
}
</style>
