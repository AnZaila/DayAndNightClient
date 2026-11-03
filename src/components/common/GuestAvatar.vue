<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadGuestAvatar } from '@/api/post'
import AvatarGenerateDialog from '@/components/profile/AvatarGenerateDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { pushToast } from '@/composables/useToast'
import { ApiError } from '@/utils/request'

const { t } = useI18n()
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
    if (!(cause instanceof ApiError)) pushToast(t('guestAvatar.uploadFailed'), 'error')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="guest">
    <UserAvatar v-if="url" :src="url" :name="t('guestAvatar.name')" :size="36" />
    <button v-wave type="button" @click="open = true">
      {{ url ? t('guestAvatar.change') : t('guestAvatar.generate') }}
    </button>
    <button v-if="url" v-wave type="button" @click="url = null">{{ t('guestAvatar.skip') }}</button>
    <AvatarGenerateDialog v-if="open" v-model:open="open" :loading="uploading" @confirm="confirm" />
  </div>
</template>

<style scoped lang="scss">
.guest {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;

  button {
    min-height: 32px;
    padding: 0 var(--space-xs);
    border-radius: 999px;
    color: var(--primary);
    white-space: nowrap;
    cursor: pointer;
  }
}
</style>
