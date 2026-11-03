<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Maximize2, Pin } from '@lucide/vue'
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
import { deletePost, fetchPost, likePost, pinPost } from '@/api/post'
import { pushToast } from '@/composables/useToast'
import CommentForm from '@/components/comment/CommentForm.vue'
import CommentList from '@/components/comment/CommentList.vue'
import DanmakuForm from '@/components/danmaku/DanmakuForm.vue'
import DanmakuStage from '@/components/danmaku/DanmakuStage.vue'
import AppButton from '@/components/common/AppButton.vue'
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import PostArticle from '@/components/post/PostArticle.vue'
import PostStats from '@/components/post/PostStats.vue'
import type { Comment } from '@/types/comment'
import type { Danmaku } from '@/types/danmaku'
import type { Media, PostDetail } from '@/types/post'
import { ApiError } from '@/utils/request'
import { plainText } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
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
const alt = computed(() =>
  post.value ? plainText(post.value.content).slice(0, 40) : t('post.imageAlt'),
)
const flying = computed(() => notes.items.value.filter((item) => item.status === 'VISIBLE'))

async function load() {
  error.value = null
  try {
    post.value = await fetchPost(postId.value)
    thread.reset()
    notes.reset()
    await Promise.all([thread.more(), notes.more()])
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : t('action.loadFailed')
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
    if (created.status === 'VISIBLE' && post.value) {
      post.value.commentCount += 1
    }
    if (created.status === 'VISIBLE' || session.user) {
      if (created.parentId == null) {
        thread.items.value = [created, ...thread.items.value]
        thread.total.value += 1
      } else {
        thread.items.value = [...thread.items.value, created]
      }
    }
    pushToast(created.status === 'VISIBLE' ? t('post.left') : t('map.pending'))
  } catch (cause) {
    commentError.value = cause instanceof ApiError ? cause.message : t('post.commentFailed')
    if (!(cause instanceof ApiError)) pushToast(commentError.value, 'error')
    throw cause
  }
}

async function sendDanmaku(nickname: string | null, content: string, avatarUrl: string | null) {
  try {
    const created = await createPostDanmaku(postId.value, nickname, content, avatarUrl)
    if (created.status === 'VISIBLE') notes.items.value = [created, ...notes.items.value]
    pushToast(created.status === 'VISIBLE' ? t('map.sent') : t('map.pending'))
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast(t('map.sendFailed'), 'error')
    throw cause
  }
}

async function setStatus(id: number, status: 'VISIBLE' | 'HIDDEN') {
  const before = thread.items.value.find((item) => item.id === id)
  const updated = await updateCommentStatus(id, status)
  thread.items.value = thread.items.value.map((item) => (item.id === id ? updated : item))
  if (post.value && before && before.status !== status) {
    post.value.commentCount += status === 'VISIBLE' ? 1 : -1
    if (post.value.commentCount < 0) post.value.commentCount = 0
  }
  pushToast(status === 'HIDDEN' ? t('action.hidden') : t('action.shown'))
}

async function removeComment(id: number) {
  const gone = thread.items.value.filter((item) => item.id === id || item.parentId === id)
  await deleteComment(id)
  thread.items.value = thread.items.value.filter((item) => item.id !== id && item.parentId !== id)
  if (post.value) {
    const lost = gone.filter((item) => item.status === 'VISIBLE').length
    post.value.commentCount = Math.max(0, post.value.commentCount - lost)
  }
  pushToast(t('action.deleted'))
}

async function likeOne(id: number) {
  const updated = await likeComment(id)
  thread.items.value = thread.items.value.map((item) => (item.id === id ? updated : item))
}

async function likeThis() {
  if (!post.value) return
  try {
    post.value = await likePost(post.value.id)
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : t('post.likeFailed'), 'error')
  }
}

async function pinThis() {
  if (!post.value) return
  try {
    post.value = await pinPost(post.value.id)
    pushToast(post.value.pinned ? t('action.pinned') : t('action.unpinned'))
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : t('post.pinFailed'), 'error')
  }
}

async function likeNote(id: number) {
  const updated = await likeDanmaku(id)
  notes.items.value = notes.items.value.map((item) => (item.id === id ? updated : item))
}

async function removePost() {
  await deletePost(postId.value)
  pushToast(t('action.deleted'))
  await router.push({ name: 'timeline' })
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="post" class="shell stack wide">
      <PostArticle
        :display-name="post.displayName"
        :avatar-url="post.authorAvatarUrl"
        :author-id="post.authorId"
        :happened-at="post.happenedAt"
        :mood="post.mood"
        :weather="post.weather"
        :location="post.location"
        :visibility="post.visibility"
        :pinned="post.pinned"
        :content="post.content"
        :media="post.media"
        :latitude="post.latitude"
        :longitude="post.longitude"
        zoom
        @open="active = $event as Media"
      >
        <template #gallery>
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
              <span class="zoom"><Maximize2 :size="16" /> {{ t('action.zoomIn') }}</span>
            </button>
          </div>
        </template>
        <template #chips>
          <span v-if="post.status === 'HIDDEN'">{{ t('post.hiddenOnTimeline') }}</span>
        </template>
        <template #stats>
          <PostStats
            :view-count="post.viewCount"
            :like-count="post.likeCount"
            :comment-count="post.commentCount"
            :liked="post.liked"
            comment-href="#comments"
            @like="likeThis"
          />
        </template>
        <div v-if="session.user" class="row">
          <AppButton variant="plain" type="button" @click="pinThis">
            <Pin :size="16" :fill="post.pinned ? 'currentColor' : 'none'" />
            {{ post.pinned ? t('action.unpin') : t('action.pin') }}
          </AppButton>
          <template v-if="mine">
            <WaveLink class="btn quiet" :to="{ name: 'write', params: { id: post.id } }">{{
              t('post.edit')
            }}</WaveLink>
            <AppButton variant="plain" tone="danger" type="button" @click="confirmOpen = true">{{
              t('post.delete')
            }}</AppButton>
          </template>
        </div>
        <DanmakuStage :items="flying" @like="likeNote" @need-more="notes.more" />
      </PostArticle>
      <section class="card">
        <h2>{{ t('post.danmaku') }}</h2>
        <DanmakuForm :send="sendDanmaku" />
      </section>
      <section id="comments" class="card">
        <h2>
          {{ t('post.comments')
          }}<span v-if="post.commentCount" class="count">{{ post.commentCount }}</span>
        </h2>
        <p v-if="!canComment" class="lede">
          {{ post.commentsOpen ? t('post.commentsClosedOff') : t('post.commentsClosed') }}
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
          {{ t('post.noComments') }}
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
        :title="t('post.deleteTitle')"
        :description="t('post.deleteBody')"
        :confirm-label="t('action.delete')"
        tone="danger"
        @confirm="removePost"
      />
      <ImageLightbox v-model:open="lightboxOpen" :src="active?.url || ''" :alt="alt" />
    </div>
    <p v-else-if="error" class="shell wide error">
      {{ t('post.privateHint', { error }) }}
    </p>
    <Skeleton v-else class="shell wide" preset="detail" />
  </div>
</template>

<style scoped lang="scss">
h2 {
  margin-bottom: var(--space-xs);
  color: var(--heading);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: break-word;
  min-width: 0;
}

.count {
  margin-left: var(--space-xs);
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.chips span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 32px;
  color: var(--heading);
  font-size: var(--text-sm);
}

.gallery {
  display: grid;
  gap: var(--space-sm);
}

.shot {
  position: relative;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  cursor: zoom-in;
}

img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  transition: transform var(--dur-long) var(--ease-out);
}

.shot:hover img {
  transform: scale(1.03);
}

@media (prefers-reduced-motion: reduce) {
  .shot:hover img {
    transform: none;
  }
}

.zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--heading);
  font-size: var(--text-sm);
  border: var(--rule-hair) solid var(--line);
}

.empty-note {
  margin-bottom: var(--space-md);
}
</style>
