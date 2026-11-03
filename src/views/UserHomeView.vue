<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { fetchUser } from '@/api/user'
import Skeleton from '@/components/common/Skeleton.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileShelf from '@/components/profile/ProfileShelf.vue'
import { useSessionStore } from '@/stores/session'
import type { PublicProfile } from '@/types/auth'
import { ApiError } from '@/utils/request'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const userId = computed(() => Number(route.params.id))
const profile = ref<PublicProfile | null>(null)
const loading = ref(true)
const failed = ref<string | null>(null)

async function load() {
  loading.value = true
  failed.value = null
  profile.value = null
  if (!Number.isInteger(userId.value) || userId.value < 1) {
    failed.value = t('profile.missing')
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
  } catch (cause) {
    failed.value = cause instanceof ApiError ? cause.message : t('profile.missing')
  } finally {
    loading.value = false
  }
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
    if (!loading.value) void load()
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
        <p v-if="!profile.open" class="closed">{{ t('profile.closed') }}</p>
      </template>
    </ProfileHero>

    <ProfileShelf v-if="profile.open" :user-id="profile.id" :show-likes="profile.showLikes" />
  </div>
</template>

<style scoped lang="scss">
.closed {
  margin: var(--space-3xs) 0 0;
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}
</style>
