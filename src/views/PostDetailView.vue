<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Globe, Lock, MapPin, Maximize2 } from '@lucide/vue'
import { motion } from 'motion-v'
import { createComment, deleteComment, fetchComments, likeComment, updateCommentStatus } from '@/api/comment'
import { createPostDanmaku, fetchPostDanmaku, likeDanmaku } from '@/api/danmaku'
import { deletePost, fetchPost } from '@/api/post'
import { pushToast } from '@/composables/useToast'
import CommentForm from '@/components/comment/CommentForm.vue'
import CommentList from '@/components/comment/CommentList.vue'
import DanmakuForm from '@/components/danmaku/DanmakuForm.vue'
import DanmakuStage from '@/components/danmaku/DanmakuStage.vue'
import AppButton from '@/components/common/AppButton.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import DiaryIcon from '@/components/post/DiaryIcon.vue'
import PostBody from '@/components/post/PostBody.vue'
import type { Comment } from '@/types/comment'
import type { Danmaku } from '@/types/danmaku'
import type { Media, PostDetail } from '@/types/post'
import { ApiError } from '@/utils/request'
import { formatDate, plainText } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const post = ref<PostDetail | null>(null)
const comments = ref<Comment[]>([])
const danmaku = ref<Danmaku[]>([])
const error = ref<string | null>(null)
const commentError = ref<string | null>(null)
const replyTarget = ref<Comment | null>(null)
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
const flying = computed(() => danmaku.value.filter((item) => item.status === 'VISIBLE'))

async function load() {
  error.value = null
  try {
    const [detail, commentList, danmakuList] = await Promise.all([
      fetchPost(postId.value),
      fetchComments(postId.value),
      fetchPostDanmaku(postId.value),
    ])
    post.value = detail
    comments.value = commentList
    danmaku.value = danmakuList
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '加载失败'
  }
}

async function submitComment(nickname: string | null, content: string) {
  commentError.value = null
  try {
    const created = await createComment(postId.value, nickname, content, replyTarget.value?.id)
    if (created.status === 'VISIBLE' || session.user) {
      comments.value = [...comments.value, created]
    }
    pushToast(created.status === 'VISIBLE' ? '已留下' : '已提交，待显示')
  } catch (cause) {
    commentError.value = cause instanceof ApiError ? cause.message : '评论失败'
    if (!(cause instanceof ApiError)) pushToast(commentError.value, 'error')
    throw cause
  }
}

async function sendDanmaku(nickname: string | null, content: string) {
  try {
    const created = await createPostDanmaku(postId.value, nickname, content)
    if (created.status === 'VISIBLE') danmaku.value = [...danmaku.value, created]
    pushToast(created.status === 'VISIBLE' ? '已飞出去' : '已提交，待显示')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('弹幕没有发出去', 'error')
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
  comments.value = comments.value.filter((item) => item.id !== id && item.parentId !== id)
  pushToast('已删除')
}

async function likeOne(id: number) {
  const updated = await likeComment(id)
  comments.value = comments.value.map((item) => (item.id === id ? updated : item))
}

async function likeNote(id: number) {
  const updated = await likeDanmaku(id)
  danmaku.value = danmaku.value.map((item) => (item.id === id ? updated : item))
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
      <div class="author">
        <UserAvatar :src="post.authorAvatarUrl" :name="post.displayName" :size="42" />
        <div>
          <h1>{{ post.displayName }}写下的这一天</h1>
          <time :datetime="post.happenedAt">{{ formatDate(post.happenedAt) }}</time>
        </div>
      </div>
      <div class="chips">
        <span v-if="post.mood"><DiaryIcon kind="mood" :value="post.mood" /> {{ post.mood }}</span>
        <span v-if="post.weather"><DiaryIcon kind="weather" :value="post.weather" /> {{ post.weather }}</span>
        <span v-if="post.location"><MapPin :size="14" /> {{ post.location }}</span>
        <span v-if="post.visibility === 'PRIVATE'"><Lock :size="14" /> 仅双方</span>
        <span v-else><Globe :size="14" /> 公开</span>
        <span v-if="post.status === 'HIDDEN'">时间轴上已隐藏</span>
      </div>
      <MapPoint
        v-if="post.latitude != null && post.longitude != null"
        :key="`${post.id}-${post.latitude}-${post.longitude}`"
        :latitude="post.latitude"
        :longitude="post.longitude"
      />
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
        <WaveLink class="btn quiet" :to="{ name: 'write', params: { id: post.id } }">修改这篇</WaveLink>
        <AppButton variant="quiet" type="button" @click="confirmOpen = true">删除这篇</AppButton>
      </div>
      <DanmakuStage :items="flying" @like="likeNote" />
    </article>
    <section class="card">
      <h2>弹幕</h2>
      <p class="lede">短短一句，从画面上飞过去。鼠标停在上面会暂停。</p>
      <DanmakuForm :send="sendDanmaku" />
    </section>
    <section class="card">
      <h2>评论<span v-if="comments.length" class="count">{{ comments.length }}</span></h2>
      <p class="lede">
        <template v-if="canComment && session.user">用「{{ session.user.displayName }}」留言。</template>
        <template v-else-if="canComment">留个昵称就行。</template>
        <template v-else-if="!post.commentsOpen">评论已关闭。</template>
        <template v-else>这篇不开放评论。</template>
      </p>
      <CommentList
        threaded
        :comments="comments"
        :can-moderate="Boolean(session.user)"
        @hide="setStatus($event, 'HIDDEN')"
        @show="setStatus($event, 'VISIBLE')"
        @remove="removeComment"
        @like="likeOne"
        @reply="replyTarget = $event"
      />
      <p v-if="comments.length === 0" class="muted empty-note">还没有留言。</p>
      <p v-if="commentError" class="error">{{ commentError }}</p>
      <CommentForm
        v-if="canComment"
        :submit-comment="submitComment"
        :reply-to="replyTarget"
        @cancel-reply="replyTarget = null"
      />
    </section>
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="删除这篇？"
      description="删掉之后找不回来。"
      confirm-label="删除"
      @confirm="removePost"
    />
    <ImageLightbox v-model:open="lightboxOpen" :src="active?.url || ''" :alt="alt" />
  </div>
  <p v-else-if="error" class="shell error">{{ error }}。如果这是仅双方的帖子，需要先登录。</p>
  <p v-else class="shell muted">正在翻开这一页。</p>
  </div>
</template>

<style scoped lang="scss">
.detail {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.author {
  display: flex;
  align-items: center;
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
