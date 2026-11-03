<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Ellipsis, Lock, Pin } from '@lucide/vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
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
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import DiaryIcon from '@/components/post/DiaryIcon.vue'
import PostBody from '@/components/post/PostBody.vue'
import PostCarousel from '@/components/post/PostCarousel.vue'
import PostStats from '@/components/post/PostStats.vue'
import type { Comment } from '@/types/comment'
import type { Danmaku } from '@/types/danmaku'
import type { PostDetail } from '@/types/post'
import { namedLabel } from '@/i18n'
import { ApiError } from '@/utils/request'
import { formatDate, isBlankHtml, plainText } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const postId = computed(() => Number(route.params.id))
const post = ref<PostDetail | null>(null)
const error = ref<string | null>(null)
const commentError = ref<string | null>(null)
const thread = usePaged<Comment>((page) => fetchComments(postId.value, page, 10))
const notes = usePaged<Danmaku>((page) => fetchPostDanmaku(postId.value, page, 20))
const replyTarget = ref<Comment | null>(null)
const confirmOpen = ref(false)
const menuOpen = ref(false)
const shot = ref(0)

const mine = computed(() => session.user?.id === post.value?.authorId)
const canComment = computed(
  () =>
    post.value?.commentsOpen &&
    post.value.visibility === 'PUBLIC' &&
    post.value.status === 'PUBLISHED',
)
const alt = computed(() =>
  post.value
    ? post.value.title.trim() || plainText(post.value.content).slice(0, 40)
    : t('post.imageAlt'),
)
const flying = computed(() => notes.items.value.filter((item) => item.status === 'VISIBLE'))
const hasMood = computed(() => Boolean(post.value?.mood) && post.value?.mood !== 'none')
const hasWeather = computed(() => Boolean(post.value?.weather) && post.value?.weather !== 'none')
const when = computed(() =>
  post.value ? formatDate(post.value.happenedAt).replace(/(\s00:00(:00)?)$/, '') : '',
)
async function load() {
  error.value = null
  shot.value = 0
  post.value = null
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
  menuOpen.value = false
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

function askDelete() {
  menuOpen.value = false
  confirmOpen.value = true
}

watch(postId, load, { immediate: true })
</script>

<template>
  <div class="page shell">
    <article v-if="post" class="note" :class="{ 'has-media': post.media.length }">
      <div v-if="post.media.length" class="media">
        <PostCarousel v-model="shot" :items="post.media" :alt="alt" :layout-id="`cover-${post.id}`" />
        <DanmakuStage contained :items="flying" @like="likeNote" @need-more="notes.more" />
      </div>
      <div class="side">
        <header class="who">
          <ProfileLink :user-id="post.authorId">
            <UserAvatar :src="post.authorAvatarUrl" :name="post.displayName" :size="40" />
          </ProfileLink>
          <div class="by">
            <p class="name">
              <ProfileLink :user-id="post.authorId">{{ post.displayName }}</ProfileLink>
            </p>
          </div>
          <PopoverRoot v-if="session.user" v-model:open="menuOpen">
            <PopoverTrigger as-child>
              <button
                type="button"
                class="more"
                :aria-label="t('action.more')"
                @pointerdown.stop
                @click.stop
              >
                <Ellipsis :size="20" />
              </button>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                class="soft-menu more-menu"
                align="end"
                :side-offset="6"
                @click.stop
              >
                <button type="button" class="soft-item" @click="pinThis">
                  <Pin :size="14" :fill="post.pinned ? 'currentColor' : 'none'" />
                  {{ post.pinned ? t('action.unpin') : t('action.pin') }}
                </button>
                <WaveLink
                  v-if="mine"
                  class="soft-item"
                  :to="{ name: 'write', params: { id: post.id } }"
                  @click="menuOpen = false"
                >
                  {{ t('post.edit') }}
                </WaveLink>
                <button v-if="mine" type="button" class="soft-item danger" @click="askDelete">
                  {{ t('post.delete') }}
                </button>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </header>
        <div class="caption">
          <div
            v-if="
              hasMood ||
              hasWeather ||
              post.visibility === 'PRIVATE' ||
              post.pinned ||
              post.status === 'HIDDEN'
            "
            class="chips"
          >
            <span v-if="hasMood" class="tag tag-mood"
              ><DiaryIcon kind="mood" :value="post.mood!" />{{
                namedLabel('mood', post.mood)
              }}</span
            >
            <span v-if="hasWeather" class="tag tag-weather"
              ><DiaryIcon kind="weather" :value="post.weather!" />{{
                namedLabel('weather', post.weather)
              }}</span
            >
            <span v-if="post.visibility === 'PRIVATE'" class="tag tag-private"
              ><Lock :size="12" />{{ t('visibility.PRIVATE') }}</span
            >
            <span v-if="post.pinned" class="tag tag-pinned"
              ><Pin :size="12" fill="currentColor" />{{ t('action.pin') }}</span
            >
            <span v-if="post.status === 'HIDDEN'" class="muted">{{
              t('post.hiddenOnTimeline')
            }}</span>
          </div>
          <h2 v-if="post.title" class="headline">{{ post.title }}</h2>
          <PostBody v-if="post.content && !isBlankHtml(post.content)" :content="post.content" />
          <p class="when">
            <time :datetime="post.happenedAt">{{ when }}</time>
            <span v-if="post.location"> · {{ post.location }}</span>
          </p>
        </div>
        <footer class="dock">
          <p v-if="!canComment" class="lede">
            {{ post.commentsOpen ? t('post.commentsClosedOff') : t('post.commentsClosed') }}
          </p>
          <p v-if="commentError" class="error">{{ commentError }}</p>
          <div class="engage">
            <CommentForm
              v-if="canComment"
              bar
              :submit-comment="submitComment"
              :reply-to="replyTarget"
              @cancel-reply="replyTarget = null"
            />
            <PostStats
              size="bar"
              :view-count="post.viewCount"
              :like-count="post.likeCount"
              :comment-count="post.commentCount"
              :liked="post.liked"
              comment-href="#comments"
              @like="likeThis"
            />
          </div>
        </footer>
        <div class="thread">
          <h2 id="comments" class="section">
            {{ t('post.commentsCount', { n: post.commentCount }) }}
          </h2>
          <Skeleton
            v-if="thread.loading.value && thread.page.value === 0"
            preset="comment"
            :count="3"
          />
          <CommentList
            v-else
            threaded
            dense
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
        </div>
        <div class="notes">
          <p class="notes-label">{{ t('post.danmaku') }}</p>
          <DanmakuForm :send="sendDanmaku" />
        </div>
      </div>
    </article>
    <p v-else-if="error" class="fail">
      {{ t('post.privateHint', { error }) }}
    </p>
    <Skeleton v-else class="note loading" preset="detail" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="t('post.deleteTitle')"
      :description="t('post.deleteBody')"
      :confirm-label="t('action.delete')"
      tone="danger"
      @confirm="removePost"
    />
  </div>
</template>

<style scoped lang="scss">
.note {
  background: var(--surface);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.media {
  position: relative;
  width: 100%;
  height: 480px;
  overflow: hidden;
  border-radius: 20px 20px 0 0;
  background: color-mix(in oklab, var(--heading) 4%, var(--surface));
}

.side {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.who {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  height: 81px;
  padding: 20px;
  border-bottom: 1px solid color-mix(in oklab, var(--heading) 6%, transparent);
}

.by {
  flex: 1;
  min-width: 0;
}

.name {
  color: var(--heading);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: break-word;
  min-width: 0;
}

.more {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--heading);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
}

.caption {
  display: grid;
  gap: 8px;
  padding: 16px 20px;
  font-size: 16px;
  line-height: 1.5;
}

.headline {
  margin: 0;
  color: var(--heading);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
}

.when {
  margin: 8px 0 0;
  color: color-mix(in oklab, var(--heading) 30%, transparent);
  font-size: 14px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.dock {
  padding: 0 16px 16px;
}

.engage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.engage :deep(.row) {
  min-width: 0;
}

.thread {
  padding: 0 0 16px;
}

.section {
  margin: 0 8px 12px 20px;
  color: color-mix(in oklab, var(--heading) 60%, transparent);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
  overflow-wrap: break-word;
  min-width: 0;
}

.thread :deep(.list) {
  padding: 0 12px 16px 20px;
}

.notes {
  padding: 12px 16px 16px;
  border-top: var(--rule-hair) solid var(--line);
}

.notes-label {
  margin: 0 0 var(--space-xs);
  color: var(--muted);
  font-size: 12px;
}

.empty-note {
  margin: 0 20px 16px;
}

.lede,
.error {
  margin: 0 0 8px;
}

.fail {
  padding: var(--space-lg);
  border-radius: 20px;
  background: var(--surface);
  color: var(--danger);
}

.note.loading {
  padding: var(--space-md);
}

:deep(.soft-item.danger) {
  color: var(--danger);
}

@media (prefers-reduced-motion: reduce) {
  .note {
    transition: none;
  }
}

@media (max-width: 640px) {
  .media {
    height: 360px;
  }
}
</style>
