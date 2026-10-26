<script setup lang="ts">
import { ref } from 'vue'
import { PenLine } from '@lucide/vue'
import { useRouter } from 'vue-router'
import PostCard from '@/components/post/PostCard.vue'
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { usePaged } from '@/composables/usePaged'
import { fetchPosts } from '@/api/post'
import { useSessionStore } from '@/stores/session'
import { formatMonthDay } from '@/utils/text'

const router = useRouter()
const session = useSessionStore()
const mineOnly = ref(false)
const {
  items: posts,
  loading,
  error,
  hasMore,
  page,
  total,
  more,
  reset,
} = usePaged((next) => fetchPosts(next, 10, mineOnly.value))

function showMine(value: boolean) {
  if (mineOnly.value === value) return
  mineOnly.value = value
  reset()
  void more()
}

function openPost(id: number) {
  router.push({ name: 'post', params: { id } })
}

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
    <h1 class="page-title">时间轴</h1>
    <p class="lede">从最近往下读。</p>
    <p v-if="page > 0" class="hint tally">{{ total }} 篇</p>
    <div v-if="session.user" class="filters">
      <button type="button" :class="{ on: !mineOnly }" @click="showMine(false)">全部</button>
      <button type="button" :class="{ on: mineOnly }" @click="showMine(true)">只看我的</button>
    </div>
    <Skeleton
      v-if="posts.length === 0 && !error && (loading || page === 0)"
      preset="timeline"
      :count="3"
    />
    <p v-else-if="error && posts.length === 0" class="error">{{ error }}</p>
    <div v-else-if="posts.length === 0" class="card empty">
      <h2>{{ mineOnly ? '你还没有写过' : '还没有记下的日子' }}</h2>
      <p>
        {{ mineOnly ? '对方写的在「全部」里。' : '从今天写起，也可以补以前的日子。' }}
      </p>
      <WaveLink v-if="session.user" class="btn solid" :to="{ name: 'write' }">
        <PenLine :size="16" />
        写第一笔
      </WaveLink>
    </div>
    <ol v-if="posts.length" class="timeline">
      <li v-for="(post, index) in posts" :key="post.id">
        <div class="rail">
          <time :datetime="post.happenedAt">
            <span v-if="showYear(index)" class="year">{{ yearOf(post.happenedAt) }}</span>
            <span>{{ formatMonthDay(post.happenedAt) }}</span>
          </time>
          <span class="dot" />
        </div>
        <PostCard :post="post" :index="index" @open="openPost" />
      </li>
    </ol>
    <Skeleton v-if="loading && posts.length" preset="timeline" />
    <ScrollSentinel v-if="hasMore" :key="page" @visible="more" />
  </section>
</template>

<style scoped lang="scss">
.tally {
  margin-top: -8px;
}

.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  button {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--surface);
    color: var(--muted);
    box-shadow: var(--shadow);
    cursor: pointer;

    &.on {
      background: var(--primary-soft);
      color: var(--primary);
      font-weight: 600;
    }
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

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
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 14px;

    &::before {
      content: '';
      position: absolute;
      top: 32px;
      bottom: -18px;
      left: 39px;
      width: 2px;
      background: var(--line);
    }

    &:last-child::before {
      bottom: 12px;
    }
  }
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  position: relative;
  z-index: 1;
}

time {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--muted);
  font-size: 13px;
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

.dot {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--primary-fill);
  box-shadow: 0 0 0 4px var(--bg);
  animation: dot-in 0.45s ease both;

  &::after {
    content: '';
    position: absolute;
    inset: -5px;
    border: 2px solid var(--primary-fill);
    border-radius: 999px;
    opacity: 0;
    animation: dot-ping 2.4s ease-out infinite;
  }
}

@for $i from 1 through 10 {
  li:nth-child(#{$i}) .dot {
    animation-delay: #{($i - 1) * 0.07}s;
  }
}

@keyframes dot-in {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}

@keyframes dot-ping {
  0% {
    opacity: 0.55;
    transform: scale(0.7);
  }

  100% {
    opacity: 0;
    transform: scale(1.7);
  }
}

@media (max-width: 640px) {
  .timeline li {
    grid-template-columns: 4.6rem minmax(0, 1fr);
    gap: 10px;

    &::before {
      left: calc(2.3rem - 1px);
    }
  }
}
</style>
