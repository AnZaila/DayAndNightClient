<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { EllipsisVertical, Pin } from '@lucide/vue'
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { motion } from 'motion-v'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import DiaryIcon from '@/components/post/DiaryIcon.vue'
import PostStats from '@/components/post/PostStats.vue'
import { likePost, pinPost } from '@/api/post'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import type { PostSummary } from '@/types/post'
import { ApiError } from '@/utils/request'
import { formatDate, plainText } from '@/utils/text'

const props = defineProps<{
  post: PostSummary
  index: number
  showWhen?: boolean
}>()

const emit = defineEmits<{
  open: [id: number]
  pin: []
}>()

const session = useSessionStore()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const excerpt = computed(() => plainText(props.post.excerpt))
const when = computed(() => formatDate(props.post.happenedAt).replace(/ \d{2}:\d{2}:\d{2}$/, ''))
const liked = ref(props.post.liked)
const likeCount = ref(props.post.likeCount)
const pinned = ref(props.post.pinned)
const menuOpen = ref(false)

watch(
  () => [props.post.liked, props.post.likeCount, props.post.pinned] as const,
  ([nextLiked, nextCount, nextPinned]) => {
    liked.value = nextLiked
    likeCount.value = nextCount
    pinned.value = nextPinned
  },
)

watch(
  () => session.user,
  (user, previous) => {
    if (!user && previous) liked.value = false
  },
)

async function toggleLike() {
  try {
    const updated = await likePost(props.post.id)
    liked.value = updated.liked
    likeCount.value = updated.likeCount
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : '没有点上', 'error')
  }
}

async function togglePin() {
  menuOpen.value = false
  try {
    const updated = await pinPost(props.post.id)
    pinned.value = updated.pinned
    pushToast(updated.pinned ? '已置顶' : '已放下')
    emit('pin')
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : '没有置上', 'error')
  }
}
</script>

<template>
  <motion.div
    :initial="reduced ? false : { opacity: 0, y: 22 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="
      reduced
        ? { duration: 0 }
        : { type: 'spring', stiffness: 420, damping: 28, delay: Math.min(index, 6) * 0.07 }
    "
  >
    <article class="card post" :class="{ split: post.coverUrl, pinned }" @click="emit('open', post.id)">
      <div v-if="post.coverUrl" class="frame">
        <img :src="post.coverUrl" alt="" />
      </div>
      <div class="copy">
        <time v-if="showWhen" :datetime="post.happenedAt">{{ when }}</time>
        <p>{{ excerpt || '点进去看这一篇。' }}</p>
        <small class="facts">
          <ProfileLink :user-id="post.authorId">
            <UserAvatar :src="post.authorAvatarUrl" :name="post.displayName" :size="22" />
            <span>{{ post.displayName }}</span>
          </ProfileLink>
          <span v-if="post.mood" class="mark"
            ><DiaryIcon kind="mood" :value="post.mood" :size="13" /> {{ post.mood }}</span
          >
          <span v-if="post.weather" class="mark"
            ><DiaryIcon kind="weather" :value="post.weather" :size="13" /> {{ post.weather }}</span
          >
          <span v-if="post.visibility === 'PRIVATE'">仅双方</span>
          <span v-if="pinned" class="mark">
            <Pin :size="13" fill="currentColor" /> 置顶
          </span>
          <PopoverRoot v-if="session.user" v-model:open="menuOpen">
            <PopoverTrigger as-child>
              <button type="button" class="more" aria-label="更多" @pointerdown.stop @click.stop>
                <EllipsisVertical :size="16" />
              </button>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent class="soft-menu more-menu" align="end" :side-offset="6" @click.stop>
                <button type="button" class="soft-item" @click="togglePin">
                  <Pin :size="14" :fill="pinned ? 'currentColor' : 'none'" />
                  {{ pinned ? '取消置顶' : '置顶' }}
                </button>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </small>
        <PostStats
          :view-count="post.viewCount"
          :like-count="likeCount"
          :comment-count="post.commentCount"
          :liked="liked"
          @like="toggleLike"
        />
      </div>
    </article>
  </motion.div>
</template>

<style scoped lang="scss">
.post {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
  padding: var(--space-sm);
  background: var(--surface);
  border: 0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition:
    transform var(--dur-short) var(--ease-out),
    box-shadow var(--dur-short) var(--ease-out);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-hover);
  }

  &.split {
    flex-direction: row;
    align-items: center;
  }
}

.frame {
  width: 148px;
  height: 112px;
  flex: none;
  overflow: hidden;
  border-radius: var(--radius);
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition: transform var(--dur-long) var(--ease-out);
}

.post:hover img {
  transform: scale(1.06);
}

.copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

time {
  color: var(--muted);
  font-size: 12px;
}

p {
  display: -webkit-box;
  overflow: hidden;
  color: var(--heading);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

small {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  color: var(--muted);
  font-size: 13px;
}

.mark {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
}

.more {
  margin-left: auto;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  color: var(--muted);
  cursor: pointer;

  &:hover,
  &[data-state='open'] {
    color: var(--heading);
    background: var(--field);
  }
}

@media (max-width: 640px) {
  .frame {
    width: 96px;
    height: 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post:hover,
  .post:hover img {
    transform: none;
  }
}

</style>
