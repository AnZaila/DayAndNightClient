<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Eye, EyeOff, Trash2 } from '@lucide/vue'
import { deleteComment, fetchRecentComments, updateCommentStatus } from '@/api/comment'
import AppButton from '@/components/common/AppButton.vue'
import type { Comment } from '@/types/comment'
import { formatDateTime } from '@/utils/text'
import { pushToast } from '@/composables/useToast'

const comments = ref<Comment[]>([])
const error = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    comments.value = await fetchRecentComments()
  } catch {
    error.value = '评论没有加载出来。'
  } finally {
    loading.value = false
  }
})

async function setStatus(id: number, status: 'VISIBLE' | 'HIDDEN') {
  const updated = await updateCommentStatus(id, status)
  comments.value = comments.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

async function remove(id: number) {
  await deleteComment(id)
  comments.value = comments.value.filter((item) => item.id !== id)
  pushToast('已删除')
}
</script>

<template>
  <section class="shell card">
    <h1 class="page-title">评论</h1>
    <p class="lede">最近的留言。</p>
    <p v-if="loading" class="muted">正在读取评论。</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="comments.length === 0" class="muted">还没有人留言。公开帖子下面的评论框开着，就会出现在这里。</p>
    <ul v-else>
      <li v-for="comment in comments" :key="comment.id">
        <div>
          <strong>{{ comment.nickname }}</strong>
          <span class="muted"> · {{ formatDateTime(comment.createdAt) }}</span>
          <span v-if="comment.status === 'HIDDEN'" class="muted"> · 待显示</span>
        </div>
        <p>{{ comment.content }}</p>
        <div class="row">
          <RouterLink class="btn quiet" :to="{ name: 'post', params: { id: comment.postId } }">看这篇</RouterLink>
          <AppButton
            v-if="comment.status === 'VISIBLE'"
            variant="quiet"
            type="button"
            @click="setStatus(comment.id, 'HIDDEN')"
          >
            <EyeOff :size="16" />
            隐藏
          </AppButton>
          <AppButton v-else variant="quiet" type="button" @click="setStatus(comment.id, 'VISIBLE')">
            <Eye :size="16" />
            显示
          </AppButton>
          <AppButton variant="quiet" type="button" @click="remove(comment.id)">
            <Trash2 :size="16" />
            删除
          </AppButton>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
ul {
  display: flex;
  flex-direction: column;
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 20px;
  box-shadow: inset 0 1px 0 var(--line);
}

li:first-child {
  padding-top: 0;
  box-shadow: none;
}

strong {
  color: var(--heading);
}
</style>
