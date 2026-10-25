<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { deleteComment, fetchRecentComments, updateCommentStatus } from '@/api/comment'
import { usePaged } from '@/composables/usePaged'
import { updateProfile, uploadAvatar, uploadCover } from '@/api/auth'
import AppButton from '@/components/common/AppButton.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AvatarCropDialog from '@/components/profile/AvatarCropDialog.vue'
import AvatarGenerateDialog from '@/components/profile/AvatarGenerateDialog.vue'
import CommentList from '@/components/comment/CommentList.vue'
import Pager from '@/components/common/Pager.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import type { CommentStatus } from '@/types/comment'
import { ApiError } from '@/utils/request'

const session = useSessionStore()
const name = ref(session.user?.displayName ?? '')
const signature = ref(session.user?.signature ?? '')
const saving = ref(false)
const uploading = ref(false)
const cropOpen = ref(false)
const generateOpen = ref(false)
const cropKind = ref<'avatar' | 'cover'>('avatar')
const picked = ref<File | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const pageSize = 20
const thread = usePaged((page) => fetchRecentComments('mine', page, pageSize))
const coverOpen = ref(false)

const cropTitle = computed(() => (cropKind.value === 'cover' ? '裁剪背景' : '裁剪头像'))
const cropAspect = computed(() =>
  cropKind.value === 'cover' ? ([16, 7] as [number, number]) : ([1, 1] as [number, number]),
)
const cropOutput = computed(() => (cropKind.value === 'cover' ? 'cover.jpg' : 'avatar.jpg'))
const coverStyle = computed(() => {
  const url = session.user?.coverUrl
  return url ? { backgroundImage: `url("${url}")` } : undefined
})

watch(
  () => session.user,
  (user) => {
    if (!user) return
    name.value = user.displayName
    signature.value = user.signature ?? ''
  },
)

void thread.open(1)

async function saveProfile() {
  const next = name.value.trim()
  if (!next) {
    pushToast('写一个名字', 'error')
    return
  }
  saving.value = true
  try {
    session.user = await updateProfile(next, signature.value.trim())
    pushToast('资料已保存')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function chooseFile(event: Event, kind: 'avatar' | 'cover') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  cropKind.value = kind
  picked.value = file
  cropOpen.value = true
}

async function useFile(file: File) {
  uploading.value = true
  try {
    session.user = cropKind.value === 'cover' ? await uploadCover(file) : await uploadAvatar(file)
    cropOpen.value = false
    generateOpen.value = false
    pushToast(cropKind.value === 'cover' ? '背景已更新' : '头像已更新')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('上传失败', 'error')
  } finally {
    uploading.value = false
  }
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
  <div v-if="session.user" class="shell stack page">
    <section class="card hero">
      <div class="cover" :style="coverStyle">
        <button
          v-if="session.user.coverUrl"
          type="button"
          class="cover-view"
          aria-label="查看背景"
          @click="coverOpen = true"
        />
        <AppButton class="cover-action" type="button" @click="coverInput?.click()"
          >换背景</AppButton
        >
        <input
          ref="coverInput"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="chooseFile($event, 'cover')"
        />
      </div>
      <div class="who">
        <div class="portrait">
          <UserAvatar :src="session.user.avatarUrl" :name="session.user.displayName" :size="84" />
        </div>
        <div>
          <h1>{{ session.user.displayName }}</h1>
          <p class="sign">{{ session.user.signature || '还没有签名' }}</p>
          <p class="mail">{{ session.user.email }}</p>
        </div>
      </div>
    </section>

    <form class="card" novalidate @submit.prevent="saveProfile">
      <h2>资料</h2>
      <div class="row">
        <AppButton type="button" @click="avatarInput?.click()">上传头像</AppButton>
        <AppButton variant="quiet" type="button" @click="generateOpen = true">生成头像</AppButton>
        <input
          ref="avatarInput"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="chooseFile($event, 'avatar')"
        />
      </div>
      <label class="field">
        <span>名字</span>
        <input v-model="name" maxlength="40" />
      </label>
      <label class="field">
        <span>签名</span>
        <textarea v-model="signature" maxlength="120" placeholder="一句话就好" />
      </label>
      <AppButton type="submit" :loading="saving">保存</AppButton>
    </form>

    <section class="card">
      <h2>我的评论</h2>
      <p class="lede">你留下的。</p>
      <Skeleton
        v-if="thread.loading.value && thread.items.value.length === 0"
        preset="comment"
        :count="3"
      />
      <p v-else-if="thread.error.value && thread.items.value.length === 0" class="error">
        {{ thread.error.value }}
      </p>
      <p v-else-if="thread.items.value.length === 0" class="muted">你还没有留言。</p>
      <CommentList
        v-if="thread.items.value.length"
        :comments="thread.items.value"
        can-moderate
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

    <AvatarCropDialog
      v-model:open="cropOpen"
      :file="picked"
      :loading="uploading"
      :title="cropTitle"
      :aspect="cropAspect"
      :output-name="cropOutput"
      @confirm="useFile"
    />
    <AvatarGenerateDialog v-model:open="generateOpen" :loading="uploading" @confirm="useFile" />
    <ImageLightbox v-model:open="coverOpen" :src="session.user.coverUrl || ''" alt="背景" />
  </div>
</template>

<style scoped lang="scss">
.page {
  width: min(760px, calc(100% - 28px));
}

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

.cover-action {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
}

.who {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-top: -42px;
  padding: 0 18px;

  h1 {
    margin: 0;
    color: var(--heading);
    font-size: 22px;
  }
}

.portrait {
  z-index: 9;
  padding: 4px;
  border-radius: 50%;
  background: var(--surface);
}

.who > div {
  min-width: 0;
}

.sign,
.mail {
  overflow-wrap: anywhere;
}

.sign {
  margin: 4px 0 0;
  color: var(--text);
}

.mail {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}

h2 {
  margin: 0 0 12px;
  color: var(--heading);
  font-size: 18px;
}

.row {
  position: relative;
  margin-bottom: 16px;
}
</style>
