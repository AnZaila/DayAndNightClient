<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PenLine } from '@lucide/vue'
import { useRouter } from 'vue-router'
import PostCard from '@/components/post/PostCard.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { usePaged } from '@/composables/usePaged'
import { fetchPosts } from '@/api/post'
import { useSessionStore } from '@/stores/session'
import { useSiteStore } from '@/stores/site'
import { formatMonthDay } from '@/utils/text'

const { t, locale } = useI18n()
const router = useRouter()
const session = useSessionStore()
const site = useSiteStore()
const mineOnly = ref(false)
const ascending = ref(false)
const todayLabel = computed(() => {
  void locale.value
  const now = new Date()
  return t('date.todayLabel', { m: now.getMonth() + 1, d: now.getDate() })
})
const todayMeta = computed(() => {
  void locale.value
  const now = new Date()
  return t('date.todayMeta', { y: now.getFullYear(), w: t(`weekday.${now.getDay()}`) })
})
const daysTogether = computed(() => site.site?.daysTogether ?? 0)
const {
  items: posts,
  loading,
  error,
  hasMore,
  page,
  total,
  more,
  reset,
} = usePaged((next) => fetchPosts(next, 10, mineOnly.value, ascending.value))

function showMine(value: boolean) {
  if (mineOnly.value === value) return
  mineOnly.value = value
  reset()
  void more()
}

function showOrder(value: boolean) {
  if (ascending.value === value) return
  ascending.value = value
  reset()
  void more()
}

function onPin() {
  reset()
  void more()
}

function openPost(id: number) {
  router.push({ name: 'post', params: { id } })
}

watch(
  () => session.user?.id ?? null,
  (id, previous) => {
    if (id === previous) return
    if (id == null) mineOnly.value = false
    reset()
    void more()
  },
)

void more()

function yearOf(value: string) {
  return value.slice(0, 4)
}

function showYear(index: number) {
  const current = posts.value[index]
  const previous = posts.value[index - 1]
  if (!current) return false
  return !previous || yearOf(current.happenedAt) !== yearOf(previous.happenedAt)
}
</script>

<template>
  <section class="shell wide">
    <HomeHero
      :day="todayLabel"
      :meta="todayMeta"
      :posts="total"
      :days="daysTogether"
      image="/hero/home.jpg"
      :slogan="t('hero.slogan')"
    />
    <header class="mast">
      <div class="mast-head">
        <h1 class="page-title">{{ t('timeline.title') }}</h1>
        <p v-if="page > 0" class="count">{{ t('timeline.count', { n: total }) }}</p>
      </div>
    </header>
    <div class="filters">
      <div v-if="session.user" class="group">
        <button type="button" :class="{ on: !mineOnly }" @click="showMine(false)">
          {{ t('timeline.all') }}
        </button>
        <button type="button" :class="{ on: mineOnly }" @click="showMine(true)">
          {{ t('timeline.mine') }}
        </button>
      </div>
      <div class="group">
        <button type="button" :class="{ on: !ascending }" @click="showOrder(false)">
          {{ t('timeline.newest') }}
        </button>
        <button type="button" :class="{ on: ascending }" @click="showOrder(true)">
          {{ t('timeline.oldest') }}
        </button>
      </div>
    </div>
    <Skeleton
      v-if="posts.length === 0 && !error && (loading || page === 0)"
      preset="timeline"
      :count="3"
    />
    <p v-else-if="error && posts.length === 0" class="error">{{ error }}</p>
    <div v-else-if="posts.length === 0" class="card empty">
      <h2>{{ mineOnly ? t('timeline.emptyMineTitle') : t('timeline.emptyTitle') }}</h2>
      <p>
        {{ mineOnly ? t('timeline.emptyMineBody') : t('timeline.emptyBody') }}
      </p>
      <WaveLink v-if="session.user" class="btn solid" :to="{ name: 'write' }">
        <PenLine :size="16" />
        {{ t('timeline.writeFirst') }}
      </WaveLink>
    </div>
    <ol v-if="posts.length" class="timeline">
      <li v-for="(post, index) in posts" :key="post.id" :class="{ lead: index === 0 }">
        <div class="rail">
          <time :datetime="post.happenedAt">
            <span v-if="post.pinned" class="year">{{ t('timeline.pinned') }}</span>
            <span v-else-if="showYear(index)" class="year">{{ yearOf(post.happenedAt) }}</span>
            <span>{{ formatMonthDay(post.happenedAt) }}</span>
          </time>
          <span class="node" />
        </div>
        <PostCard :post="post" :index="index" @open="openPost" @pin="onPin" />
      </li>
    </ol>
    <Skeleton v-if="loading && posts.length" preset="timeline" />
    <ScrollSentinel v-if="hasMore" :key="page" @visible="more" />
    <p v-else-if="posts.length" class="end" aria-hidden="true">· · ·</p>
  </section>
</template>

<style scoped lang="scss">
.mast {
  display: grid;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.mast-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
}

.mast .page-title {
  margin: 0;
}

.count {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  border-bottom: var(--rule-hair) solid var(--line);
}

.group {
  display: flex;
  gap: var(--space-md);

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

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);

  h2 {
    color: var(--heading);
    font-size: 18px;
  }

  p {
    max-width: 40em;
    color: var(--muted);
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: var(--space-sm);

    &::before {
      content: '';
      position: absolute;
      top: 46px;
      bottom: calc(var(--space-md) * -1);
      left: 39px;
      width: 2px;
      background: linear-gradient(var(--primary-soft), var(--line));
    }

    &:last-child::before {
      display: none;
    }
  }
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-xs);
  position: relative;
  z-index: 1;
}

time {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  text-align: center;
}

.year,
.rail time span {
  white-space: nowrap;
}

.year {
  color: var(--heading);
  font-weight: 600;
}

.node {
  width: 11px;
  height: 11px;
  border: 2px solid var(--primary);
  border-radius: var(--radius-pill);
  background: var(--bg);
  transition: transform var(--dur-short) var(--ease-out);
}

.lead .node {
  background: var(--primary-fill);
  border-color: var(--primary-fill);
  animation: live 2.6s var(--ease-out) infinite;
}

li:hover .node {
  transform: scale(1.25);
}

@keyframes live {
  0% {
    box-shadow: 0 0 0 0 var(--primary-soft);
  }

  70%,
  100% {
    box-shadow: 0 0 0 10px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lead .node,
  li:hover .node {
    animation: none;
    transform: none;
  }
}

@media (max-width: 640px) {
  .timeline li {
    grid-template-columns: 4.6rem minmax(0, 1fr);
    gap: var(--space-sm);

    &::before {
      left: calc(2.3rem - 1px);
    }
  }
}
</style>
