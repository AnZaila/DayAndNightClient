<script setup lang="ts">
import { computed, ref } from 'vue'
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
}>()

const emit = defineEmits<{
  hide: [id: number]
  show: [id: number]
  remove: [id: number]
  like: [id: number]
  reply: [comment: Comment]
}>()

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
  <ul v-if="comments.length && threaded" class="list">
    <li v-for="thread in threads" :key="thread.root.id" class="thread">
      <article class="comment">
        <ProfileLink :user-id="thread.root.userId">
          <UserAvatar :src="thread.root.avatarUrl" :name="thread.root.nickname" :size="36" />
        </ProfileLink>
        <div class="body">
          <ProfileLink :user-id="thread.root.userId">
            <strong>{{ thread.root.nickname }}</strong>
          </ProfileLink>
          <p class="text">{{ thread.root.content }}</p>
          <div class="meta">
            <span class="muted">{{ formatDateTime(thread.root.createdAt) }}</span>
            <span v-if="thread.root.status === 'HIDDEN'" class="muted">已隐藏</span>
            <button v-wave type="button" class="text-btn" @click="emit('reply', thread.root)">
              回复
            </button>
            <WaveLink
              v-if="showPost"
              class="text-btn"
              :to="{ name: 'post', params: { id: thread.root.postId } }"
            >
              看这篇
            </WaveLink>
            <template v-if="canModerate">
              <button
                v-if="thread.root.status === 'VISIBLE'"
                v-wave
                type="button"
                class="text-btn warn"
                @click="emit('hide', thread.root.id)"
              >
                <EyeOff :size="14" /> 隐藏
              </button>
              <button
                v-else
                v-wave
                type="button"
                class="text-btn ok"
                @click="emit('show', thread.root.id)"
              >
                <Eye :size="14" /> 显示
              </button>
              <button
                v-wave
                type="button"
                class="text-btn danger"
                @click="askRemove(thread.root.id)"
              >
                <Trash2 :size="14" /> 删除
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
                <ProfileLink :user-id="reply.userId">
                  <strong>{{ reply.nickname }}</strong>
                </ProfileLink>
                <p class="text">
                  <template v-if="reply.replyToNickname">
                    回复 <span class="at">{{ reply.replyToNickname }}</span>
                  </template>
                  {{ reply.content }}
                </p>
                <div class="meta">
                  <span class="muted">{{ formatDateTime(reply.createdAt) }}</span>
                  <span v-if="reply.status === 'HIDDEN'" class="muted">已隐藏</span>
                  <button v-wave type="button" class="text-btn" @click="emit('reply', reply)">
                    回复
                  </button>
                  <template v-if="canModerate">
                    <button
                      v-if="reply.status === 'VISIBLE'"
                      v-wave
                      type="button"
                      class="text-btn warn"
                      @click="emit('hide', reply.id)"
                    >
                      隐藏
                    </button>
                    <button
                      v-else
                      v-wave
                      type="button"
                      class="text-btn ok"
                      @click="emit('show', reply.id)"
                    >
                      显示
                    </button>
                    <button
                      v-wave
                      type="button"
                      class="text-btn danger"
                      @click="askRemove(reply.id)"
                    >
                      删除
                    </button>
                  </template>
                </div>
              </div>
              <button
                v-wave
                type="button"
                class="like"
                :class="{ on: reply.liked }"
                :aria-label="reply.liked ? '取消赞' : '赞'"
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
                  ? '收起回复'
                  : `展开 ${thread.replies.length - 1} 条回复`
              }}
            </button>
          </div>
        </div>
        <button
          v-wave
          type="button"
          class="like"
          :class="{ on: thread.root.liked }"
          :aria-label="thread.root.liked ? '取消赞' : '赞'"
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
        <div>
          <ProfileLink :user-id="comment.userId">
            <strong>{{ comment.nickname }}</strong>
          </ProfileLink>
          <span class="muted"> · {{ formatDateTime(comment.createdAt) }}</span>
          <span v-if="comment.status === 'HIDDEN'" class="muted"> · 已隐藏</span>
          <span v-if="comment.likeCount" class="muted"> · {{ comment.likeCount }} 赞</span>
        </div>
      </div>
      <p class="text">
        <template v-if="comment.replyToNickname">回复 {{ comment.replyToNickname }}：</template>
        {{ comment.content }}
      </p>
      <div v-if="canModerate || showPost" class="row">
        <WaveLink
          v-if="showPost"
          class="btn quiet"
          :to="{ name: 'post', params: { id: comment.postId } }"
        >
          看这篇
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
            隐藏
          </AppButton>
          <AppButton
            v-else
            variant="plain"
            tone="success"
            type="button"
            @click="emit('show', comment.id)"
          >
            <Eye :size="16" />
            显示
          </AppButton>
          <AppButton variant="plain" tone="danger" type="button" @click="askRemove(comment.id)">
            <Trash2 :size="16" />
            删除
          </AppButton>
        </template>
      </div>
    </li>
  </ul>
  <ConfirmDialog
    :open="pendingId !== null"
    title="删除这条评论？"
    description="删掉之后找不回来。"
    confirm-label="删除"
    tone="danger"
    @update:open="closeConfirm"
    @confirm="confirmRemove"
  />
</template>

<style scoped lang="scss">
.list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
}

.comment {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.body {
  flex: 1;
  min-width: 0;
}

.text {
  margin: 2px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.replies {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  padding: 10px 10px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--field) 70%, transparent);

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
  gap: 4px;
  padding: 0;
  color: var(--muted);
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
  gap: 2px;
  min-width: 28px;
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;

  &.on {
    color: var(--danger);
  }
}

.who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

strong {
  color: var(--heading);
}
</style>
