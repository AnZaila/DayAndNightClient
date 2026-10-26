<script setup lang="ts">
import { ref } from 'vue'
import { uploadGuestAvatar } from '@/api/post'
import AvatarGenerateDialog from '@/components/profile/AvatarGenerateDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { pushToast } from '@/composables/useToast'
import { ApiError } from '@/utils/request'

const url = defineModel<string | null>({ default: null })
const open = ref(false)
const uploading = ref(false)

async function confirm(file: File) {
  uploading.value = true
  try {
    const image = await uploadGuestAvatar(file)
    url.value = image.url
    open.value = false
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('头像没有传上去', 'error')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="guest">
    <UserAvatar v-if="url" :src="url" name="头像" :size="36" />
    <button v-wave type="button" @click="open = true">{{ url ? '换一个' : '生成头像' }}</button>
    <button v-if="url" v-wave type="button" @click="url = null">不用头像</button>
    <AvatarGenerateDialog v-if="open" v-model:open="open" :loading="uploading" @confirm="confirm" />
  </div>
</template>

<style scoped lang="scss">
.guest {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  button {
    min-height: 32px;
    padding: 0 8px;
    border-radius: 999px;
    color: var(--primary);
    cursor: pointer;
  }
}
</style>
