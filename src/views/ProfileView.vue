<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { updateProfile, uploadAvatar, uploadCover } from '@/api/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppSwitch from '@/components/common/AppSwitch.vue'
import AvatarCropDialog from '@/components/profile/AvatarCropDialog.vue'
import AvatarGenerateDialog from '@/components/profile/AvatarGenerateDialog.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileShelf from '@/components/profile/ProfileShelf.vue'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import type { ProfileVisibility } from '@/types/auth'
import { ApiError } from '@/utils/request'

const session = useSessionStore()
const name = ref(session.user?.displayName ?? '')
const signature = ref(session.user?.signature ?? '')
const visibility = ref<ProfileVisibility>(session.user?.profileVisibility ?? 'PUBLIC')
const showSignature = ref(session.user?.showSignature ?? true)
const showCover = ref(session.user?.showCover ?? true)
const showEmail = ref(session.user?.showEmail ?? false)
const showLikes = ref(session.user?.showLikes ?? false)
const saving = ref(false)
const uploading = ref(false)
const cropOpen = ref(false)
const generateOpen = ref(false)
const cropKind = ref<'avatar' | 'cover'>('avatar')
const picked = ref<File | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)

const visibilityOptions = [
  { value: 'PUBLIC' as const, label: '公开' },
  { value: 'PRIVATE' as const, label: '仅双方' },
  { value: 'SELF' as const, label: '仅自己' },
]
const cropTitle = computed(() => (cropKind.value === 'cover' ? '裁剪背景' : '裁剪头像'))
const cropAspect = computed(() =>
  cropKind.value === 'cover' ? ([16, 7] as [number, number]) : ([1, 1] as [number, number]),
)
const cropOutput = computed(() => (cropKind.value === 'cover' ? 'cover.jpg' : 'avatar.jpg'))
watch(
  () => session.user,
  (user) => {
    if (!user) return
    name.value = user.displayName
    signature.value = user.signature ?? ''
    visibility.value = user.profileVisibility ?? 'PUBLIC'
    showSignature.value = user.showSignature
    showCover.value = user.showCover
    showEmail.value = user.showEmail
    showLikes.value = user.showLikes ?? false
  },
)

async function saveProfile() {
  const next = name.value.trim()
  if (!next) {
    pushToast('写一个名字', 'error')
    return
  }
  saving.value = true
  try {
    session.user = await updateProfile(
      next,
      signature.value.trim(),
      visibility.value,
      showSignature.value,
      showCover.value,
      showEmail.value,
      session.user?.showComments ?? false,
      showLikes.value,
    )
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

</script>

<template>
  <div v-if="session.user" class="shell stack wide">
    <ProfileHero
      :name="session.user.displayName"
      :avatar-url="session.user.avatarUrl"
      :cover-url="session.user.coverUrl"
      :signature="session.user.signature || '还没有签名'"
      :email="session.user.email"
    >
      <template #cover>
        <AppButton type="button" @click="coverInput?.click()">换背景</AppButton>
        <input
          ref="coverInput"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="chooseFile($event, 'cover')"
        />
      </template>
      <template v-if="session.user.profileVisibility !== 'PUBLIC'" #meta>
        <p class="closed">
          {{
            session.user.profileVisibility === 'SELF'
              ? '其他人打开这里，只会看到名字和头像。'
              : '没有登录的人打开这里，只会看到名字和头像。'
          }}
        </p>
      </template>
    </ProfileHero>

    <ProfileShelf :user-id="session.user.id" self can-moderate>
      <template #profile>
        <form class="card" novalidate @submit.prevent="saveProfile">
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
          <div class="field">
            <span>谁可以看</span>
            <AppSelect v-model="visibility" :options="visibilityOptions" />
          </div>
          <div class="priv">
            <AppSwitch v-model="showSignature">签名</AppSwitch>
            <AppSwitch v-model="showCover">背景</AppSwitch>
            <AppSwitch v-model="showEmail">邮箱</AppSwitch>
            <AppSwitch v-model="showLikes">赞过的</AppSwitch>
          </div>
          <p class="hint">
            公开时访客也能看，仅双方要登录，仅自己只有你能看。打开赞过的后，别人打开你的主页也能看到你赞过的公开帖子。名字和头像仍会出现在帖子上。
          </p>
          <AppButton type="submit" :loading="saving">保存</AppButton>
        </form>
      </template>
    </ProfileShelf>

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
  </div>
</template>

<style scoped lang="scss">
.closed {
  margin: var(--space-3xs) 0 0;
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

h2 {
  margin: 0 0 var(--space-sm);
  color: var(--heading);
  font-size: 18px;
}

.row {
  position: relative;
  margin-bottom: var(--space-md);
}

.priv {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm) var(--space-lg);
  margin-bottom: var(--space-sm);
}
</style>
