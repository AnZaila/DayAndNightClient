<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchUser, fetchUserComments, fetchUserPosts } from '@/api/user'
import CommentList from '@/components/comment/CommentList.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import Pager from '@/components/common/Pager.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import PostCard from '@/components/post/PostCard.vue'
import { usePaged } from '@/composables/usePaged'
import type { PublicProfile } from '@/types/auth'
import { ApiError } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const userId = computed(() => Number(route.params.id))
const profile = ref<PublicProfile | null>(null)
const loading = ref(true)
const failed = ref<string | null>(null)
const coverOpen = ref(false)
const pageSize = 10
const thread = usePaged((page) => fetchUserComments(userId.value, page, pageSize))
const writings = usePaged((page) => fetchUserPosts(userId.value, page, pageSize))

const coverStyle = computed(() => {
  const url = profile.value?.coverUrl
  return url ? { backgroundImage: `url("${url}")` } : undefined
})

const notice = computed(() => {
  const current = profile.value
  if (!current?.self || !current.profileVisibility) return ''
  if (current.profileVisibility === 'SELF') return '其他人打开这里，只会看到名字和头像。'
  if (current.profileVisibility === 'PRIVATE') return '没有登录的人打开这里，只会看到名字和头像。'
  return ''
})

async function load() {
  loading.value = true
  failed.value = null
  profile.value = null
  coverOpen.value = false
  thread.reset()
  writings.reset()
  if (!Number.isInteger(userId.value) || userId.value < 1) {
    failed.value = '这份主页不存在'
    loading.value = false
    return
  }
  try {
    const next = await fetchUser(userId.value)
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
</script>

<template>
  <Skeleton v-if="loading" class="shell wide" preset="detail" />
  <p v-else-if="failed" class="shell wide error">{{ failed }}</p>
  <div v-else-if="profile" class="shell stack wide">
    <section class="card hero">
      <div class="cover" :style="coverStyle">
        <button
          v-if="profile.coverUrl"
          type="button"
          class="cover-view"
          aria-label="查看背景"
          @click="coverOpen = true"
        />
      </div>
      <div class="who">
        <div class="portrait">
          <UserAvatar :src="profile.avatarUrl" :name="profile.displayName" :size="84" preview />
        </div>
        <div class="meta">
          <h1>{{ profile.displayName }}</h1>
          <p v-if="profile.signature" class="sign">{{ profile.signature }}</p>
          <p v-if="profile.email" class="mail">{{ profile.email }}</p>
          <p v-if="!profile.open" class="closed">这份主页收起来了。</p>
          <p v-else-if="notice" class="closed">{{ notice }}</p>
          <WaveLink v-if="profile.self" class="btn quiet edit" :to="{ name: 'profile' }"
            >编辑主页</WaveLink
          >
        </div>
      </div>
    </section>

    <section v-if="profile.open">
      <h2>
        写下的<span v-if="writings.total.value"> · {{ writings.total.value }}</span>
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

    <ImageLightbox
      v-if="profile.coverUrl"
      v-model:open="coverOpen"
      :src="profile.coverUrl"
      alt="背景"
    />
  </div>
</template>

<style scoped lang="scss">
.hero {
  padding: 0 0 18px;
  overflow: hidden;
}

.cover {
  position: relative;
  height: 188px;
  background-color: var(--primary-soft);
  background-image: linear-gradient(120deg, var(--primary-soft), var(--field));
  background-position: center;
  background-size: cover;
}

.cover-view {
  position: absolute;
  inset: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.who {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 0 18px;

  h1 {
    margin: 0;
    color: var(--heading);
    font-size: 22px;
  }
}

.portrait {
  z-index: 1;
  flex: none;
  margin-top: -46px;
  padding: 4px;
  border-radius: 50%;
  background: var(--surface);
}

.meta {
  min-width: 0;
  padding-top: 14px;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sign,
.mail,
.closed {
  overflow-wrap: anywhere;
}

.sign {
  margin: 4px 0 0;
  color: var(--text);
}

.mail,
.closed {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.edit {
  margin-top: 10px;
}

h2 {
  margin: 0 0 12px;
  color: var(--heading);
  font-size: 18px;
}
</style>
