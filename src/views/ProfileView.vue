<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
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

const visibilityOptions = computed(() => [
  { value: 'PUBLIC' as const, label: t('visibility.PUBLIC') },
  { value: 'PRIVATE' as const, label: t('visibility.PRIVATE') },
  { value: 'SELF' as const, label: t('visibility.SELF') },
])
const cropTitle = computed(() =>
  cropKind.value === 'cover' ? t('profile.cropCover') : t('profile.cropAvatar'),
)
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
    pushToast(t('profile.needName'), 'error')
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
    pushToast(t('profile.saved'))
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast(t('action.saveFailed'), 'error')
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
    pushToast(cropKind.value === 'cover' ? t('profile.coverUpdated') : t('profile.avatarUpdated'))
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast(t('profile.uploadFailed'), 'error')
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
      :signature="session.user.signature || t('profile.noSignature')"
      :email="session.user.email"
    >
      <template #cover>
        <AppButton type="button" @click="coverInput?.click()">{{
          t('profile.changeCover')
        }}</AppButton>
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
              ? t('profile.closedPublic')
              : t('profile.closedGuest')
          }}
        </p>
      </template>
    </ProfileHero>

    <ProfileShelf :user-id="session.user.id" self can-moderate>
      <template #profile>
        <form class="card" novalidate @submit.prevent="saveProfile">
          <div class="row">
            <AppButton type="button" @click="avatarInput?.click()">{{
              t('profile.uploadAvatar')
            }}</AppButton>
            <AppButton variant="quiet" type="button" @click="generateOpen = true">{{
              t('profile.generateAvatar')
            }}</AppButton>
            <input
              ref="avatarInput"
              class="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="chooseFile($event, 'avatar')"
            />
          </div>
          <label class="field">
            <span>{{ t('profile.name') }}</span>
            <input v-model="name" maxlength="40" />
          </label>
          <label class="field">
            <span>{{ t('profile.signature') }}</span>
            <textarea
              v-model="signature"
              maxlength="120"
              :placeholder="t('profile.signaturePlaceholder')"
            />
          </label>
          <div class="field">
            <span>{{ t('profile.who') }}</span>
            <AppSelect v-model="visibility" :options="visibilityOptions" />
          </div>
          <div class="priv">
            <AppSwitch v-model="showSignature">{{ t('profile.showSignature') }}</AppSwitch>
            <AppSwitch v-model="showCover">{{ t('profile.showCover') }}</AppSwitch>
            <AppSwitch v-model="showEmail">{{ t('profile.showEmail') }}</AppSwitch>
            <AppSwitch v-model="showLikes">{{ t('profile.showLikes') }}</AppSwitch>
          </div>
          <p class="hint">{{ t('profile.hint') }}</p>
          <AppButton type="submit" :loading="saving">{{ t('action.save') }}</AppButton>
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
