<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { deleteComment, updateCommentStatus } from '@/api/comment'
import { fetchLikedPosts, fetchReceived, fetchUserComments, fetchUserPosts } from '@/api/user'
import CommentList from '@/components/comment/CommentList.vue'
import Pager from '@/components/common/Pager.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import PostCard from '@/components/post/PostCard.vue'
import { usePaged } from '@/composables/usePaged'
import { pushToast } from '@/composables/useToast'
import type { CommentStatus } from '@/types/comment'
import type { Activity } from '@/types/stats'
import { formatDateTime, plainText } from '@/utils/text'

const props = withDefaults(
  defineProps<{
    userId: number
    self?: boolean
    showLikes?: boolean
    canModerate?: boolean
  }>(),
  {
    self: false,
    showLikes: false,
    canModerate: false,
  },
)

const slots = useSlots()
const router = useRouter()
const pageSize = 10
type Shelf = 'posts' | 'comments' | 'likes' | 'inbox' | 'profile'
const shelf = ref<Shelf>('posts')
const thread = usePaged((page) => fetchUserComments(props.userId, page, pageSize))
const writings = usePaged((page) => fetchUserPosts(props.userId, page, pageSize))
const liked = usePaged((page) => fetchLikedPosts(props.userId, page, pageSize))
const inbox = usePaged((page) => fetchReceived(props.userId, page, pageSize))
const hasProfile = computed(() => Boolean(slots.profile) && props.self)
const canLikes = computed(() => props.self || props.showLikes)

void writings.open(1)

function openPost(id: number) {
  void router.push({ name: 'post', params: { id } })
}

function showShelf(next: Shelf) {
  shelf.value = next
  if (next === 'comments' && thread.page.value === 0) void thread.open(1)
  if (next === 'likes' && liked.page.value === 0) void liked.open(1)
  if (next === 'inbox' && inbox.page.value === 0) void inbox.open(1)
}

function lineFor(item: Activity) {
  if (item.kind === 'POST_LIKE') return `${item.actorName} 赞了这篇`
  if (item.kind === 'COMMENT_LIKE') return `${item.actorName} 赞了你的评论`
  return `${item.actorName} 评了这篇`
}

async function setStatus(id: number, status: CommentStatus) {
  const updated = await updateCommentStatus(id, status)
  thread.items.value = thread.items.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

async function removeComment(id: number) {
  await deleteComment(id)
  const next =
    thread.items.value.length === 1 && thread.page.value > 1
      ? thread.page.value - 1
      : thread.page.value
  await thread.open(next || 1)
  pushToast('已删除')
}
</script>

<template>
  <div class="filters">
    <button type="button" :class="{ on: shelf === 'posts' }" @click="showShelf('posts')">
      写下的
    </button>
    <button type="button" :class="{ on: shelf === 'comments' }" @click="showShelf('comments')">
      {{ self ? '我评过' : '评过的' }}
    </button>
    <button
      v-if="canLikes"
      type="button"
      :class="{ on: shelf === 'likes' }"
      @click="showShelf('likes')"
    >
      {{ self ? '我赞过' : '赞过的' }}
    </button>
    <button
      v-if="self"
      type="button"
      :class="{ on: shelf === 'inbox' }"
      @click="showShelf('inbox')"
    >
      收到的
    </button>
    <button
      v-if="hasProfile"
      type="button"
      :class="{ on: shelf === 'profile' }"
      @click="showShelf('profile')"
    >
      资料
    </button>
  </div>

  <section v-if="shelf === 'posts'">
    <Skeleton
      v-if="writings.loading.value && writings.page.value === 0"
      preset="timeline"
      :count="2"
    />
    <p v-else-if="writings.error.value" class="error">{{ writings.error.value }}</p>
    <p v-else-if="writings.items.value.length === 0" class="muted">
      {{ self ? '还没有写下的日子。' : '还没有公开的文字。' }}
    </p>
    <div v-if="writings.items.value.length" class="posts">
      <PostCard
        v-for="(post, index) in writings.items.value"
        :key="post.id"
        :post="post"
        :index="index"
        show-when
        @open="openPost"
        @pin="writings.open(writings.page.value || 1)"
      />
    </div>
    <Pager
      :page="writings.page.value"
      :total="writings.total.value"
      :size="writings.size.value || pageSize"
      :disabled="writings.loading.value"
      @page="writings.open"
    />
  </section>

  <section v-else-if="shelf === 'likes' && canLikes">
    <Skeleton v-if="liked.loading.value && liked.page.value === 0" preset="timeline" :count="2" />
    <p v-else-if="liked.error.value" class="error">{{ liked.error.value }}</p>
    <p v-else-if="liked.items.value.length === 0" class="muted">
      {{ self ? '还没有点过赞。' : '还没有公开的点赞。' }}
    </p>
    <div v-if="liked.items.value.length" class="posts">
      <PostCard
        v-for="(post, index) in liked.items.value"
        :key="post.id"
        :post="post"
        :index="index"
        show-when
        @open="openPost"
      />
    </div>
    <Pager
      :page="liked.page.value"
      :total="liked.total.value"
      :size="liked.size.value || pageSize"
      :disabled="liked.loading.value"
      @page="liked.open"
    />
  </section>

  <section v-else-if="shelf === 'comments'">
    <Skeleton v-if="thread.loading.value && thread.page.value === 0" preset="comment" :count="2" />
    <p v-else-if="thread.error.value" class="error">{{ thread.error.value }}</p>
    <p v-else-if="thread.items.value.length === 0" class="muted">
      {{ self ? '你还没有留言。' : '还没有公开的留言。' }}
    </p>
    <CommentList
      v-if="thread.items.value.length"
      :comments="thread.items.value"
      :can-moderate="canModerate"
      show-post
      @hide="setStatus($event, 'HIDDEN')"
      @show="setStatus($event, 'VISIBLE')"
      @remove="removeComment"
    />
    <Pager
      :page="thread.page.value"
      :total="thread.total.value"
      :size="thread.size.value || pageSize"
      :disabled="thread.loading.value"
      @page="thread.open"
    />
  </section>

  <section v-else-if="shelf === 'inbox' && self">
    <Skeleton v-if="inbox.loading.value && inbox.page.value === 0" preset="comment" :count="2" />
    <p v-else-if="inbox.error.value" class="error">{{ inbox.error.value }}</p>
    <p v-else-if="inbox.items.value.length === 0" class="muted">还没有收到赞或评论。</p>
    <ul v-if="inbox.items.value.length" class="inbox">
      <li v-for="item in inbox.items.value" :key="`${item.kind}-${item.createdAt}-${item.postId}`">
        <div class="note" @click="openPost(item.postId)">
          <ProfileLink :user-id="item.actorUserId">
            <UserAvatar :src="item.actorAvatarUrl" :name="item.actorName" :size="36" />
          </ProfileLink>
          <div>
            <p>{{ lineFor(item) }}</p>
            <p v-if="item.commentContent" class="quote">{{ item.commentContent }}</p>
            <p class="clip">{{ plainText(item.excerpt) }}</p>
            <span class="when">{{ formatDateTime(item.createdAt) }}</span>
          </div>
        </div>
      </li>
    </ul>
    <Pager
      :page="inbox.page.value"
      :total="inbox.total.value"
      :size="inbox.size.value || pageSize"
      :disabled="inbox.loading.value"
      @page="inbox.open"
    />
  </section>

  <section v-else-if="shelf === 'profile' && hasProfile">
    <slot name="profile" />
  </section>
</template>

<style scoped lang="scss">
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  border-bottom: var(--rule-hair) solid var(--line);

  button {
    min-height: 36px;
    padding: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition:
      color var(--dur-short) var(--ease-out),
      border-color var(--dur-short) var(--ease-out);

    &.on {
      border-bottom-color: var(--primary);
      color: var(--primary);
      font-weight: 600;
    }
  }
}

.posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.inbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.note {
  display: flex;
  gap: var(--space-sm);
  width: 100%;
  min-width: 0;
  padding: var(--space-sm);
  background: var(--surface);
  border-radius: var(--radius);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.quote,
.clip,
.when {
  margin: var(--space-2xs) 0 0;
  color: var(--muted);
  font-size: 13px;
}

.clip {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
</style>
