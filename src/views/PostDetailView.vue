<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Globe, Lock, MapPin, Maximize2 } from '@lucide/vue'
import { motion } from 'motion-v'
import {
  createComment,
  deleteComment,
  fetchComments,
  likeComment,
  updateCommentStatus,
} from '@/api/comment'
import { createPostDanmaku, fetchPostDanmaku, likeDanmaku } from '@/api/danmaku'
import { usePaged } from '@/composables/usePaged'
import { deletePost, fetchPost } from '@/api/post'
import { pushToast } from '@/composables/useToast'
import CommentForm from '@/components/comment/CommentForm.vue'
import CommentList from '@/components/comment/CommentList.vue'
import DanmakuForm from '@/components/danmaku/DanmakuForm.vue'
import DanmakuStage from '@/components/danmaku/DanmakuStage.vue'
import AppButton from '@/components/common/AppButton.vue'
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
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
const error = ref<string | null>(null)
const commentError = ref<string | null>(null)
const thread = usePaged<Comment>((page) => fetchComments(postId.value, page, 10))
const notes = usePaged<Danmaku>((page) => fetchPostDanmaku(postId.value, page, 20))
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
  () =>
    post.value?.commentsOpen &&
    post.value.visibility === 'PUBLIC' &&
    post.value.status === 'PUBLISHED',
)
const alt = computed(() => (post.value ? plainText(post.value.content).slice(0, 40) : '帖子图片'))
const flying = computed(() => notes.items.value.filter((item) => item.status === 'VISIBLE'))

async function load() {
  error.value = null
  try {
    post.value = await fetchPost(postId.value)
    thread.reset()
    notes.reset()
    await Promise.all([thread.more(), notes.more()])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '加载失败'
  }
}

async function submitComment(nickname: string | null, content: string, avatarUrl: string | null) {
  commentError.value = null
  try {
    const created = await createComment(
      postId.value,
      nickname,
      content,
      replyTarget.value?.id,
      avatarUrl,
    )
    if (created.status === 'VISIBLE' || session.user) {
      if (created.parentId == null) {
        thread.items.value = [created, ...thread.items.value]
        thread.total.value += 1
      } else {
        thread.items.value = [...thread.items.value, created]
      }
    }
    pushToast(created.status === 'VISIBLE' ? '已留下' : '已提交，待显示')
  } catch (cause) {
    commentError.value = cause instanceof ApiError ? cause.message : '评论失败'
    if (!(cause instanceof ApiError)) pushToast(commentError.value, 'error')
    throw cause
  }
}

async function sendDanmaku(nickname: string | null, content: string, avatarUrl: string | null) {
  try {
    const created = await createPostDanmaku(postId.value, nickname, content, avatarUrl)
    if (created.status === 'VISIBLE') notes.items.value = [created, ...notes.items.value]
    pushToast(created.status === 'VISIBLE' ? '已飞出去' : '已提交，待显示')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('弹幕没有发出去', 'error')
    throw cause
  }
}

async function setStatus(id: number, status: 'VISIBLE' | 'HIDDEN') {
  const updated = await updateCommentStatus(id, status)
  thread.items.value = thread.items.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

async function removeComment(id: number) {
  await deleteComment(id)
  thread.items.value = thread.items.value.filter((item) => item.id !== id && item.parentId !== id)
  pushToast('已删除')
}

async function likeOne(id: number) {
  const updated = await likeComment(id)
  thread.items.value = thread.items.value.map((item) => (item.id === id ? updated : item))
}

async function likeNote(id: number) {
  const updated = await likeDanmaku(id)
  notes.items.value = notes.items.value.map((item) => (item.id === id ? updated : item))
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
    <div v-if="post" class="shell stack wide">
      <article class="card detail">
        <div class="author">
          <ProfileLink :user-id="post.authorId">
            <UserAvatar :src="post.authorAvatarUrl" :name="post.displayName" :size="42" />
          </ProfileLink>
          <div>
            <h1>
              <ProfileLink :user-id="post.authorId">{{ post.displayName }}</ProfileLink
              >写下的这一天
            </h1>
            <time :datetime="post.happenedAt">{{ formatDate(post.happenedAt) }}</time>
          </div>
        </div>
        <div class="chips">
          <span v-if="post.mood"><DiaryIcon kind="mood" :value="post.mood" /> {{ post.mood }}</span>
          <span v-if="post.weather"
            ><DiaryIcon kind="weather" :value="post.weather" /> {{ post.weather }}</span
          >
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
          <button
            v-for="media in post.media"
            :key="media.id"
            type="button"
            class="shot"
            @click="active = media"
          >
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
          <WaveLink class="btn quiet" :to="{ name: 'write', params: { id: post.id } }"
            >修改这篇</WaveLink
          >
          <AppButton variant="plain" tone="danger" type="button" @click="confirmOpen = true"
            >删除这篇</AppButton
          >
        </div>
        <DanmakuStage :items="flying" @like="likeNote" @need-more="notes.more" />
      </article>
      <section class="card">
        <h2>弹幕</h2>
        <p class="lede">短短一句，从画面上飞过去。鼠标停在上面会暂停。</p>
        <DanmakuForm :send="sendDanmaku" />
      </section>
      <section class="card">
        <h2>
          评论<span v-if="thread.total.value" class="count">{{ thread.total.value }}</span>
        </h2>
        <p class="lede">
          <template v-if="canComment && session.user"
            >用「{{ session.user.displayName }}」留言。</template
          >
          <template v-else-if="canComment">留个昵称就行。</template>
          <template v-else-if="!post.commentsOpen">评论已关闭。</template>
          <template v-else>这篇不开放评论。</template>
        </p>
        <Skeleton
          v-if="thread.loading.value && thread.page.value === 0"
          preset="comment"
          :count="3"
        />
        <CommentList
          v-else
          threaded
          :comments="thread.items.value"
          :can-moderate="Boolean(session.user)"
          @hide="setStatus($event, 'HIDDEN')"
          @show="setStatus($event, 'VISIBLE')"
          @remove="removeComment"
          @like="likeOne"
          @reply="replyTarget = $event"
        />
        <p v-if="thread.error.value && thread.items.value.length === 0" class="error">
          {{ thread.error.value }}
        </p>
        <p
          v-else-if="thread.page.value > 0 && thread.items.value.length === 0"
          class="muted empty-note"
        >
          还没有留言。
        </p>
        <Skeleton v-if="thread.loading.value && thread.items.value.length" preset="comment" />
        <ScrollSentinel
          v-if="thread.hasMore.value && thread.page.value > 0"
          :key="thread.page.value"
          @visible="thread.more"
        />
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
        tone="danger"
        @confirm="removePost"
      />
      <ImageLightbox v-model:open="lightboxOpen" :src="active?.url || ''" :alt="alt" />
    </div>
    <p v-else-if="error" class="shell wide error">
      {{ error }}。如果这是仅双方的帖子，需要先登录。
    </p>
    <Skeleton v-else class="shell wide" preset="detail" />
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

  > div {
    min-width: 0;
  }
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
  overflow-wrap: anywhere;
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
