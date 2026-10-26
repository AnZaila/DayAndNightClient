<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchUser, fetchUserComments, fetchUserPosts } from '@/api/user'
import CommentList from '@/components/comment/CommentList.vue'
import Pager from '@/components/common/Pager.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import PostCard from '@/components/post/PostCard.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import { usePaged } from '@/composables/usePaged'
import { useSessionStore } from '@/stores/session'
import type { PublicProfile } from '@/types/auth'
import { ApiError } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const userId = computed(() => Number(route.params.id))
const profile = ref<PublicProfile | null>(null)
const loading = ref(true)
const failed = ref<string | null>(null)
const pageSize = 10
const thread = usePaged((page) => fetchUserComments(userId.value, page, pageSize))
const writings = usePaged((page) => fetchUserPosts(userId.value, page, pageSize))

async function load() {
  loading.value = true
  failed.value = null
  profile.value = null
  thread.reset()
  writings.reset()
  if (!Number.isInteger(userId.value) || userId.value < 1) {
    failed.value = '这份主页不存在'
    loading.value = false
    return
  }
  try {
    const next = await fetchUser(userId.value)
    if (next.self) {
      await router.replace({ name: 'profile' })
      return
    }
    profile.value = next
    if (next.open) {
      const jobs = [writings.open(1)]
      if (next.showComments) jobs.push(thread.open(1))
      await Promise.all(jobs)
    }
  } catch (cause) {
    failed.value = cause instanceof ApiError ? cause.message : '这份主页不存在'
  } finally {
    loading.value = false
  }
}

function openPost(id: number) {
  void router.push({ name: 'post', params: { id } })
}

watch(
  () => route.params.id,
  () => void load(),
  { immediate: true },
)

watch(
  () => session.user?.id ?? null,
  (id, previous) => {
    if (id === previous) return
    if (id != null && id === userId.value) {
      void router.replace({ name: 'profile' })
      return
    }
    if (!profile.value?.open) return
    writings.reset()
    void writings.open(1)
  },
)
</script>

<template>
  <Skeleton v-if="loading" class="shell wide" preset="detail" />
  <p v-else-if="failed" class="shell wide error">{{ failed }}</p>
  <div v-else-if="profile" class="shell stack wide">
    <ProfileHero
      :name="profile.displayName"
      :avatar-url="profile.avatarUrl"
      :cover-url="profile.coverUrl"
      :signature="profile.signature"
      :email="profile.email"
    >
      <template #meta>
        <p v-if="!profile.open" class="closed">这份主页收起来了。</p>
      </template>
    </ProfileHero>

    <section v-if="profile.open">
      <h2>
        写下的<span v-if="writings.total.value" class="tally">{{ writings.total.value }}</span>
      </h2>
      <Skeleton
        v-if="writings.loading.value && writings.page.value === 0"
        preset="timeline"
        :count="2"
      />
      <p v-else-if="writings.error.value" class="error">{{ writings.error.value }}</p>
      <p v-else-if="writings.items.value.length === 0" class="muted">还没有公开的文字。</p>
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

    <section v-if="profile.open && profile.showComments" class="card">
      <h2>留言</h2>
      <Skeleton
        v-if="thread.loading.value && thread.page.value === 0"
        preset="comment"
        :count="2"
      />
      <p v-else-if="thread.error.value" class="error">{{ thread.error.value }}</p>
      <p v-else-if="thread.items.value.length === 0" class="muted">还没有公开的留言。</p>
      <CommentList
        v-if="thread.items.value.length"
        :comments="thread.items.value"
        :can-moderate="false"
        show-post
      />
      <Pager
        :page="thread.page.value"
        :total="thread.total.value"
        :size="thread.size.value || pageSize"
        :disabled="thread.loading.value"
        @page="thread.open"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.closed {
  margin: var(--space-3xs) 0 0;
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

h2 {
  margin: 0 0 var(--space-sm);
  color: var(--heading);
  font-size: var(--text-lg);
  overflow-wrap: break-word;
  min-width: 0;
}

.tally {
  margin-left: var(--space-xs);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
