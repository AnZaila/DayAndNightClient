<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EllipsisVertical, Pin } from '@lucide/vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
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
import { namedLabel } from '@/i18n'
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

const { t } = useI18n()
const session = useSessionStore()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const head = computed(() => props.post.title.trim() || plainText(props.post.excerpt))
const when = computed(() => formatDate(props.post.happenedAt).replace(/ \d{2}:\d{2}:\d{2}$/, ''))
const clock = computed(() => {
  const value = props.post.happenedAt.match(/[T ](\d{2}:\d{2})/)?.[1] ?? ''
  return value === '00:00' ? '' : value
})
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
    pushToast(cause instanceof ApiError ? cause.message : t('post.likeFailed'), 'error')
  }
}

async function togglePin() {
  menuOpen.value = false
  try {
    const updated = await pinPost(props.post.id)
    pinned.value = updated.pinned
    pushToast(updated.pinned ? t('action.pinned') : t('action.unpinned'))
    emit('pin')
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : t('post.pinFailed'), 'error')
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
    <article
      class="card post"
      :class="{ split: post.coverUrl, pinned }"
      @click="emit('open', post.id)"
    >
      <div v-if="post.coverUrl" class="frame">
        <img :src="post.coverUrl" alt="" />
      </div>
      <div class="copy">
        <time v-if="showWhen" :datetime="post.happenedAt">{{ when }}</time>
        <p class="head">{{ head || t('timeline.excerptFallback') }}</p>
        <small class="facts">
          <ProfileLink :user-id="post.authorId">
            <UserAvatar :src="post.authorAvatarUrl" :name="post.displayName" :size="22" />
            <span>{{ post.displayName }}</span>
          </ProfileLink>
          <span v-if="post.mood" class="tag tag-mood">
            <DiaryIcon kind="mood" :value="post.mood" :size="13" />{{ namedLabel('mood', post.mood) }}
          </span>
          <span v-if="post.weather" class="tag tag-weather">
            <DiaryIcon kind="weather" :value="post.weather" :size="13" />{{
              namedLabel('weather', post.weather)
            }}
          </span>
          <span v-if="post.visibility === 'PRIVATE'" class="tag tag-private">{{
            t('visibility.PRIVATE')
          }}</span>
          <span v-if="pinned" class="tag tag-pinned"
            ><Pin :size="12" fill="currentColor" />{{ t('action.pin') }}</span
          >
          <span v-if="clock" class="tag tag-time">{{ clock }}</span>
          <PopoverRoot v-if="session.user" v-model:open="menuOpen">
            <PopoverTrigger as-child>
              <button type="button" class="more" :aria-label="t('action.more')" @pointerdown.stop @click.stop>
                <EllipsisVertical :size="16" />
              </button>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent class="soft-menu more-menu" align="end" :side-offset="6" @click.stop>
                <button type="button" class="soft-item" @click="togglePin">
                  <Pin :size="14" :fill="pinned ? 'currentColor' : 'none'" />
                  {{ pinned ? t('action.unpin') : t('action.pin') }}
                </button>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </small>
        <div class="foot">
          <PostStats
            :view-count="post.viewCount"
            :like-count="likeCount"
            :comment-count="post.commentCount"
            :liked="liked"
            @like="toggleLike"
          />
        </div>
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
  width: 200px;
  height: 140px;
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

.head {
  display: -webkit-box;
  overflow: hidden;
  color: var(--heading);
  font-size: 15.5px;
  line-height: 1.65;
  letter-spacing: 0.01em;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.facts {
  gap: var(--space-2xs) var(--space-xs);
}

.foot {
  padding-top: var(--space-2xs);
  border-top: var(--rule-hair) solid var(--line);
}

small {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  color: var(--muted);
  font-size: 13px;
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
