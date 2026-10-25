<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Globe, Lock, MapPin, Maximize2, Smile } from '@lucide/vue'
import { motion } from 'motion-v'
import { deleteComment, fetchComments, updateCommentStatus, createComment } from '@/api/comment'
import { deletePost, fetchPost } from '@/api/post'
import { pushToast } from '@/composables/useToast'
import CommentForm from '@/components/comment/CommentForm.vue'
import CommentList from '@/components/comment/CommentList.vue'
import AppButton from '@/components/common/AppButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import PostBody from '@/components/post/PostBody.vue'
import type { Comment } from '@/types/comment'
import type { Media, PostDetail } from '@/types/post'
import { ApiError } from '@/utils/request'
import { formatDate, plainText } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const post = ref<PostDetail | null>(null)
const comments = ref<Comment[]>([])
const error = ref<string | null>(null)
const commentError = ref<string | null>(null)
const confirmOpen = ref(false)
const active = ref<Media | null>(null)
const lightboxOpen = computed({
  get: () => active.value !== null,
  set(value: boolean) {
    if (!value) active.value = null
  },
})

const postId = computed(() => Number(route.params.id))
const mine = computed(() => session.user?.id === post.value?.authorId)
const canComment = computed(
  () => post.value?.commentsOpen && post.value.visibility === 'PUBLIC' && post.value.status === 'PUBLISHED',
)
const alt = computed(() => (post.value ? plainText(post.value.content).slice(0, 40) : '帖子图片'))

async function load() {
  error.value = null
  try {
    post.value = await fetchPost(postId.value)
    comments.value = await fetchComments(postId.value)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '加载失败'
  }
}

async function submitComment(nickname: string | null, content: string) {
  commentError.value = null
  try {
    const created = await createComment(postId.value, nickname, content)
    if (created.status === 'VISIBLE' || session.user) {
      comments.value = [...comments.value, created]
    }
    pushToast(created.status === 'VISIBLE' ? '已留下' : '已提交，待显示')
  } catch (cause) {
    commentError.value = cause instanceof ApiError ? cause.message : '评论失败'
    pushToast(commentError.value, 'error')
    throw cause
  }
}

async function setStatus(id: number, status: 'VISIBLE' | 'HIDDEN') {
  const updated = await updateCommentStatus(id, status)
  comments.value = comments.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

async function removeComment(id: number) {
  await deleteComment(id)
  comments.value = comments.value.filter((item) => item.id !== id)
  pushToast('已删除')
}

async function removePost() {
  await deletePost(postId.value)
  pushToast('已删除')
  await router.push({ name: 'timeline' })
}

onMounted(load)
</script>

<template>
  <div>
  <div v-if="post" class="shell stack">
    <article class="card detail">
      <time :datetime="post.happenedAt">{{ formatDate(post.happenedAt) }}</time>
      <h1>{{ post.displayName }}写下的这一天</h1>
      <div class="chips">
        <span v-if="post.mood"><Smile :size="14" /> {{ post.mood }}</span>
        <span v-if="post.location"><MapPin :size="14" /> {{ post.location }}</span>
        <span v-if="post.visibility === 'PRIVATE'"><Lock :size="14" /> 仅双方</span>
        <span v-else><Globe :size="14" /> 公开</span>
        <span v-if="post.status === 'HIDDEN'">时间轴上已隐藏</span>
      </div>
      <div v-if="post.media.length" class="gallery">
        <button v-for="media in post.media" :key="media.id" type="button" class="shot" @click="active = media">
          <motion.img
            :src="media.url"
            :alt="alt"
            :layout-id="media.id === post.media[0]?.id ? `cover-${post.id}` : undefined"
          />
          <span class="zoom"><Maximize2 :size="16" /> 放大</span>
        </button>
      </div>
      <PostBody class="body" :content="post.content" />
      <div v-if="mine" class="row">
        <RouterLink class="btn quiet" :to="{ name: 'write', params: { id: post.id } }">修改这篇</RouterLink>
        <AppButton variant="quiet" type="button" @click="confirmOpen = true">删除这篇</AppButton>
      </div>
    </article>
    <section class="card">
      <h2>评论<span v-if="comments.length" class="count">{{ comments.length }}</span></h2>
      <p class="lede">
        <template v-if="canComment && session.user">用「{{ session.user.displayName }}」留言。</template>
        <template v-else-if="canComment">留个昵称就行。</template>
        <template v-else-if="!post.commentsOpen">评论已关闭。</template>
        <template v-else>这篇不开放评论。</template>
      </p>
      <CommentList
        :comments="comments"
        :can-moderate="Boolean(session.user)"
        @hide="setStatus($event, 'HIDDEN')"
        @show="setStatus($event, 'VISIBLE')"
        @remove="removeComment"
      />
      <p v-if="comments.length === 0" class="muted empty-note">还没有留言。</p>
      <p v-if="commentError" class="error">{{ commentError }}</p>
      <CommentForm v-if="canComment" :submit-comment="submitComment" />
    </section>
    <ConfirmDialog v-model:open="confirmOpen" title="删除这篇？" @confirm="removePost" />
    <ImageLightbox v-model:open="lightboxOpen" :src="active?.url || ''" :alt="alt" />
  </div>
  <p v-else-if="error" class="shell error">{{ error }}。如果这是仅双方的帖子，需要先登录。</p>
  <p v-else class="shell muted">正在翻开这一页。</p>
  </div>
</template>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

time {
  color: var(--muted);
  font-size: 13px;
}

h1,
h2 {
  color: var(--heading);
  font-weight: 600;
  line-height: 1.3;
}

h1 {
  font-size: 24px;
}

h2 {
  margin-bottom: 6px;
  font-size: 18px;
}

.count {
  margin-left: 6px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--field);
  color: var(--heading);
  font-size: 14px;
}

.gallery {
  display: grid;
  gap: 12px;
}

.shot {
  position: relative;
  width: 100%;
  padding: 0;
  cursor: zoom-in;
}

img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: var(--radius);
}

.zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--heading);
  font-size: 13px;
  box-shadow: var(--shadow);
}

.empty-note {
  margin-bottom: 16px;
}
</style>
