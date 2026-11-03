<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, Heart, Trash2 } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import type { Comment } from '@/types/comment'
import { formatDateTime } from '@/utils/text'

const props = defineProps<{
  comments: Comment[]
  canModerate: boolean
  showPost?: boolean
  threaded?: boolean
  dense?: boolean
}>()

const emit = defineEmits<{
  hide: [id: number]
  show: [id: number]
  remove: [id: number]
  like: [id: number]
  reply: [comment: Comment]
}>()

const { t } = useI18n()
const pendingId = ref<number | null>(null)
const openThreads = ref<number[]>([])

const threads = computed(() => {
  const ids = new Set(props.comments.map((item) => item.id))
  const roots = props.comments.filter((item) => item.parentId == null || !ids.has(item.parentId))
  return roots.map((root) => ({
    root,
    replies: props.comments.filter((item) => item.parentId === root.id),
  }))
})

function visibleReplies(rootId: number, replies: Comment[]) {
  if (replies.length <= 1 || openThreads.value.includes(rootId)) return replies
  return replies.slice(0, 1)
}

function toggleThread(id: number) {
  openThreads.value = openThreads.value.includes(id)
    ? openThreads.value.filter((item) => item !== id)
    : [...openThreads.value, id]
}

function askRemove(id: number) {
  pendingId.value = id
}

function closeConfirm(open: boolean) {
  if (!open) pendingId.value = null
}

function confirmRemove() {
  if (pendingId.value == null) return
  emit('remove', pendingId.value)
  pendingId.value = null
}
</script>

<template>
  <ul v-if="comments.length && threaded" class="list" :class="{ dense }">
    <li v-for="thread in threads" :key="thread.root.id" class="thread">
      <article class="comment">
        <ProfileLink :user-id="thread.root.userId">
          <UserAvatar :src="thread.root.avatarUrl" :name="thread.root.nickname" :size="36" />
        </ProfileLink>
        <div class="body">
          <p class="text" :class="{ stack: dense }">
            <ProfileLink :user-id="thread.root.userId">
              <strong>{{ thread.root.nickname }}</strong>
            </ProfileLink>
            {{ thread.root.content }}
          </p>
          <div class="meta">
            <span class="muted">{{ formatDateTime(thread.root.createdAt) }}</span>
            <span v-if="thread.root.status === 'HIDDEN'" class="muted">{{
              t('comment.hidden')
            }}</span>
            <button v-wave type="button" class="text-btn" @click="emit('reply', thread.root)">
              {{ t('action.reply') }}
            </button>
            <WaveLink
              v-if="showPost"
              class="text-btn"
              :to="{ name: 'post', params: { id: thread.root.postId } }"
            >
              {{ t('comment.viewPost') }}
            </WaveLink>
            <template v-if="canModerate">
              <button
                v-if="thread.root.status === 'VISIBLE'"
                v-wave
                type="button"
                class="text-btn warn"
                @click="emit('hide', thread.root.id)"
              >
                <EyeOff :size="14" /> {{ t('action.hide') }}
              </button>
              <button
                v-else
                v-wave
                type="button"
                class="text-btn ok"
                @click="emit('show', thread.root.id)"
              >
                <Eye :size="14" /> {{ t('action.show') }}
              </button>
              <button
                v-wave
                type="button"
                class="text-btn danger"
                @click="askRemove(thread.root.id)"
              >
                <Trash2 :size="14" /> {{ t('action.delete') }}
              </button>
            </template>
          </div>
          <div v-if="thread.replies.length" class="replies">
            <article
              v-for="reply in visibleReplies(thread.root.id, thread.replies)"
              :key="reply.id"
              class="comment"
            >
              <ProfileLink :user-id="reply.userId">
                <UserAvatar :src="reply.avatarUrl" :name="reply.nickname" :size="24" />
              </ProfileLink>
              <div class="body">
                <p class="text" :class="{ stack: dense }">
                  <ProfileLink :user-id="reply.userId">
                    <strong>{{ reply.nickname }}</strong>
                  </ProfileLink>
                  <template v-if="reply.replyToNickname">
                    {{ t('comment.reply') }} <span class="at">{{ reply.replyToNickname }}</span>
                  </template>
                  {{ reply.content }}
                </p>
                <div class="meta">
                  <span class="muted">{{ formatDateTime(reply.createdAt) }}</span>
                  <span v-if="reply.status === 'HIDDEN'" class="muted">{{
                    t('comment.hidden')
                  }}</span>
                  <button v-wave type="button" class="text-btn" @click="emit('reply', reply)">
                    {{ t('action.reply') }}
                  </button>
                  <template v-if="canModerate">
                    <button
                      v-if="reply.status === 'VISIBLE'"
                      v-wave
                      type="button"
                      class="text-btn warn"
                      @click="emit('hide', reply.id)"
                    >
                      {{ t('action.hide') }}
                    </button>
                    <button
                      v-else
                      v-wave
                      type="button"
                      class="text-btn ok"
                      @click="emit('show', reply.id)"
                    >
                      {{ t('action.show') }}
                    </button>
                    <button
                      v-wave
                      type="button"
                      class="text-btn danger"
                      @click="askRemove(reply.id)"
                    >
                      {{ t('action.delete') }}
                    </button>
                  </template>
                </div>
              </div>
              <button
                v-wave
                type="button"
                class="like"
                :class="{ on: reply.liked }"
                :aria-label="reply.liked ? t('action.unlike') : t('action.like')"
                @click="emit('like', reply.id)"
              >
                <Heart :size="14" :fill="reply.liked ? 'currentColor' : 'none'" />
                <span v-if="reply.likeCount">{{ reply.likeCount }}</span>
              </button>
            </article>
            <button
              v-if="thread.replies.length > 1"
              v-wave
              type="button"
              class="text-btn more"
              @click="toggleThread(thread.root.id)"
            >
              {{
                openThreads.includes(thread.root.id)
                  ? t('comment.collapse')
                  : t('comment.expand', { n: thread.replies.length - 1 })
              }}
            </button>
          </div>
        </div>
        <button
          v-wave
          type="button"
          class="like"
          :class="{ on: thread.root.liked }"
          :aria-label="thread.root.liked ? t('action.unlike') : t('action.like')"
          @click="emit('like', thread.root.id)"
        >
          <Heart :size="16" :fill="thread.root.liked ? 'currentColor' : 'none'" />
          <span v-if="thread.root.likeCount">{{ thread.root.likeCount }}</span>
        </button>
      </article>
    </li>
  </ul>
  <ul v-else-if="comments.length" class="list">
    <li v-for="comment in comments" :key="comment.id">
      <div class="who">
        <ProfileLink :user-id="comment.userId">
          <UserAvatar :src="comment.avatarUrl" :name="comment.nickname" :size="32" />
        </ProfileLink>
        <div class="facts">
          <ProfileLink :user-id="comment.userId">
            <strong>{{ comment.nickname }}</strong>
          </ProfileLink>
          <span class="muted">{{ formatDateTime(comment.createdAt) }}</span>
          <span v-if="comment.status === 'HIDDEN'" class="muted">{{ t('comment.hidden') }}</span>
          <span v-if="comment.likeCount" class="muted">{{
            t('comment.likes', { n: comment.likeCount })
          }}</span>
        </div>
      </div>
      <p class="text">
        <template v-if="comment.replyToNickname">{{
          t('comment.replyTo', { name: comment.replyToNickname })
        }}</template>
        {{ comment.content }}
      </p>
      <div v-if="canModerate || showPost" class="row">
        <WaveLink
          v-if="showPost"
          class="btn quiet"
          :to="{ name: 'post', params: { id: comment.postId } }"
        >
          {{ t('comment.viewPost') }}
        </WaveLink>
        <template v-if="canModerate">
          <AppButton
            v-if="comment.status === 'VISIBLE'"
            variant="plain"
            tone="warning"
            type="button"
            @click="emit('hide', comment.id)"
          >
            <EyeOff :size="16" />
            {{ t('action.hide') }}
          </AppButton>
          <AppButton
            v-else
            variant="plain"
            tone="success"
            type="button"
            @click="emit('show', comment.id)"
          >
            <Eye :size="16" />
            {{ t('action.show') }}
          </AppButton>
          <AppButton variant="plain" tone="danger" type="button" @click="askRemove(comment.id)">
            <Trash2 :size="16" />
            {{ t('action.delete') }}
          </AppButton>
        </template>
      </div>
    </li>
  </ul>
  <ConfirmDialog
    :open="pendingId !== null"
    :title="t('comments.deleteCommentTitle')"
    :description="t('comments.deleteCommentBody')"
    :confirm-label="t('action.delete')"
    tone="danger"
    @update:open="closeConfirm"
    @confirm="confirmRemove"
  />
</template>

<style scoped lang="scss">
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  list-style: none;
  margin: 0 0 var(--space-lg);
  padding: 0;
}

.comment {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.body {
  flex: 1;
  min-width: 0;
}

.text {
  margin: var(--space-3xs) 0 0;
  white-space: pre-wrap;
  word-break: break-word;

  &.inline {
    margin: 0;
  }

  &.inline :deep(.profile-link) {
    display: inline;
    vertical-align: baseline;
  }

  &.inline strong {
    margin-right: 6px;
  }

  &.stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
  }

  &.stack :deep(.profile-link) {
    display: inline;
  }

  &.stack strong {
    color: color-mix(in oklab, var(--heading) 80%, transparent);
    font-size: 14px;
    font-weight: 500;
  }
}

.list.dense {
  gap: var(--space-sm);
  margin-bottom: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-2xs);
  color: var(--muted);
  font-size: 12px;
}

.replies {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-sm);

  .text {
    font-size: 14px;
  }
}

.at {
  color: var(--primary);
}

.text-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0;
  color: var(--muted);
  white-space: nowrap;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    color: var(--heading);
  }

  &.warn {
    color: var(--warning);
  }

  &.ok {
    color: var(--ok);
  }

  &.danger {
    color: var(--danger);
  }

  &.warn:hover,
  &.ok:hover,
  &.danger:hover {
    filter: brightness(1.08);
  }
}

.more {
  align-self: flex-start;
  color: var(--primary);
}

.like {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3xs);
  min-width: 28px;
  margin-top: var(--space-3xs);
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;

  &.on {
    color: var(--danger);
  }
}

.who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

strong {
  color: var(--heading);
}
</style>
