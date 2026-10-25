<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import { updateProfile, uploadAvatar } from '@/api/auth'
import AppButton from '@/components/common/AppButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AvatarCropDialog from '@/components/profile/AvatarCropDialog.vue'
import AvatarGenerateDialog from '@/components/profile/AvatarGenerateDialog.vue'
import { pushToast } from '@/composables/useToast'
import { ApiError } from '@/utils/request'

const session = useSessionStore()
const name = ref(session.user?.displayName ?? '')
const saving = ref(false)
const uploading = ref(false)
const cropOpen = ref(false)
const generateOpen = ref(false)
const picked = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

watch(
  () => session.user?.displayName,
  (value) => {
    if (value) name.value = value
  },
)

async function saveName() {
  const next = name.value.trim()
  if (!next) {
    pushToast('写一个名字', 'error')
    return
  }
  saving.value = true
  try {
    session.user = await updateProfile(next)
    pushToast('名字已保存')
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function chooseFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  picked.value = file
  cropOpen.value = true
  if (fileInput.value) fileInput.value.value = ''
}

async function useFile(file: File) {
  uploading.value = true
  try {
    session.user = await uploadAvatar(file)
    cropOpen.value = false
    generateOpen.value = false
    pushToast('头像已更新')
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : '头像上传失败', 'error')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section v-if="session.user" class="shell card profile">
    <h1 class="page-title">我</h1>
    <div class="hero">
      <UserAvatar :src="session.user.avatarUrl" :name="session.user.displayName" :size="84" />
      <div>
        <strong>{{ session.user.displayName }}</strong>
        <p>{{ session.user.email }}</p>
      </div>
    </div>
    <div class="row">
      <AppButton type="button" @click="fileInput?.click()">上传头像</AppButton>
      <AppButton variant="quiet" type="button" @click="generateOpen = true">生成头像</AppButton>
      <input ref="fileInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" @change="chooseFile" />
    </div>
    <form @submit.prevent="saveName">
      <label class="field">
        <span>名字</span>
        <input v-model="name" maxlength="40" required />
      </label>
      <AppButton type="submit" :disabled="saving">保存</AppButton>
    </form>
    <AvatarCropDialog v-model:open="cropOpen" :file="picked" :loading="uploading" @confirm="useFile" />
    <AvatarGenerateDialog v-model:open="generateOpen" :loading="uploading" @confirm="useFile" />
  </section>
</template>

<style scoped lang="scss">
.profile {
  max-width: 560px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;

  strong {
    color: var(--heading);
    font-size: 18px;
  }

  p {
    color: var(--muted);
    font-size: 13px;
  }
}

.row {
  position: relative;
  margin-bottom: 16px;
}
</style>
