<script setup lang="ts">
import { Eye, EyeOff, Trash2 } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import type { Comment } from '@/types/comment'
import { formatDateTime } from '@/utils/text'

defineProps<{
  comments: Comment[]
  canModerate: boolean
}>()

const emit = defineEmits<{
  hide: [id: number]
  show: [id: number]
  remove: [id: number]
}>()
</script>

<template>
  <ul v-if="comments.length" class="list">
    <li v-for="comment in comments" :key="comment.id">
      <div>
        <strong>{{ comment.nickname }}</strong>
        <span class="muted"> · {{ formatDateTime(comment.createdAt) }}</span>
        <span v-if="comment.status === 'HIDDEN'" class="muted"> · 已隐藏</span>
      </div>
      <p>{{ comment.content }}</p>
      <div v-if="canModerate" class="row">
        <AppButton v-if="comment.status === 'VISIBLE'" variant="quiet" type="button" @click="emit('hide', comment.id)">
          <EyeOff :size="16" />
          隐藏
        </AppButton>
        <AppButton v-else variant="quiet" type="button" @click="emit('show', comment.id)">
          <Eye :size="16" />
          显示
        </AppButton>
        <AppButton variant="quiet" type="button" @click="emit('remove', comment.id)">
          <Trash2 :size="16" />
          删除
        </AppButton>
      </div>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
}

li {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

strong {
  color: var(--heading);
}
</style>
