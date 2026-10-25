<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PenLine } from '@lucide/vue'
import { useRouter } from 'vue-router'
import PostCard from '@/components/post/PostCard.vue'
import { usePostList } from '@/composables/usePostList'
import { useSessionStore } from '@/stores/session'
import { formatDate } from '@/utils/text'

const router = useRouter()
const session = useSessionStore()
const { posts, loading, error, load } = usePostList()
const mineOnly = ref(false)

const visible = computed(() => {
  if (!mineOnly.value || !session.user) return posts.value
  return posts.value.filter((post) => post.authorId === session.user?.id)
})

onMounted(load)

function openPost(id: number) {
  router.push({ name: 'post', params: { id } })
}

function yearOf(value: string) {
  return value.slice(0, 4)
}

function showYear(index: number) {
  const current = visible.value[index]
  const previous = visible.value[index - 1]
  if (!current) return false
  return !previous || yearOf(current.happenedAt) !== yearOf(previous.happenedAt)
}

function monthDay(value: string) {
  return formatDate(value).replace(/^\d+年/, '')
}
</script>

<template>
  <section class="shell">
    <h1 class="page-title">时间轴</h1>
    <p class="lede">从最近往下读。</p>
    <p v-if="!loading && !error" class="hint tally">{{ visible.length }} 篇</p>
    <div v-if="session.user" class="filters">
      <button type="button" :class="{ on: !mineOnly }" @click="mineOnly = false">全部</button>
      <button type="button" :class="{ on: mineOnly }" @click="mineOnly = true">只看我的</button>
    </div>
    <p v-if="loading" class="muted">正在把日子排开。</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <div v-else-if="visible.length === 0" class="card empty">
      <h2>{{ mineOnly ? '你还没有写过' : '还没有记下的日子' }}</h2>
      <p>
        {{
          mineOnly ? '对方写的在「全部」里。' : '从今天写起，也可以补以前的日子。'
        }}
      </p>
      <RouterLink v-if="session.user" class="btn solid" :to="{ name: 'write' }">
        <PenLine :size="16" />
        写第一笔
      </RouterLink>
    </div>
    <ol v-else class="timeline">
      <li v-for="(post, index) in visible" :key="post.id">
        <div class="rail">
          <time :datetime="post.happenedAt">
            <span v-if="showYear(index)" class="year">{{ yearOf(post.happenedAt) }}</span>
            <span>{{ monthDay(post.happenedAt) }}</span>
          </time>
          <span class="dot" />
        </div>
        <PostCard :post="post" :index="index" @open="openPost" />
      </li>
    </ol>
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
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px;

    &::before {
      left: 31px;
    }
  }
}
</style>
