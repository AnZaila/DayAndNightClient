<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateSite } from '@/api/site'
import { pushToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import type { Site } from '@/types/site'
import { ApiError } from '@/utils/request'
import { useSiteStore } from '@/stores/site'

const { t } = useI18n()
const siteStore = useSiteStore()
const form = ref<Omit<Site, 'daysTogether'> | null>(null)
const saving = ref(false)

const commentOptions = computed(() => [
  { value: 'OPEN' as const, label: t('settings.open') },
  { value: 'REVIEW' as const, label: t('settings.review') },
])

onMounted(() => {
  if (!siteStore.site) return
  const { daysTogether: ignored, ...rest } = siteStore.site
  void ignored
  form.value = { ...rest }
})

async function saveSite() {
  if (!form.value) return
  if (!form.value.title.trim() || !form.value.subtitle.trim() || !form.value.togetherSince) {
    pushToast(t('settings.needAll'), 'error')
    return
  }
  saving.value = true
  try {
    siteStore.site = await updateSite(form.value)
    pushToast(t('action.saved'))
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast(t('action.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <section v-if="form" class="shell card wide">
      <h1 class="page-title">{{ t('settings.title') }}</h1>
      <form novalidate @submit.prevent="saveSite">
        <label class="field">
          <span>{{ t('settings.name') }}</span>
          <input v-model="form.title" maxlength="40" />
        </label>
        <label class="field">
          <span>{{ t('settings.tagline') }}</span>
          <input v-model="form.subtitle" maxlength="80" />
        </label>
        <div class="field">
          <span>{{ t('settings.since') }}</span>
          <AppDatePicker v-model="form.togetherSince" />
        </div>
        <label class="field">
          <span>{{ t('settings.about') }}</span>
          <textarea v-model="form.about" class="tall" />
        </label>
        <div class="field">
          <span>{{ t('settings.comments') }}</span>
          <AppSelect v-model="form.commentMode" :options="commentOptions" />
        </div>
        <AppButton type="submit" :loading="saving">{{ t('action.save') }}</AppButton>
      </form>
    </section>
    <Skeleton v-else class="shell wide" preset="fields" />
  </div>
</template>
