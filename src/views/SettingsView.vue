<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { updateSite } from '@/api/site'
import { pushToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import type { Site } from '@/types/site'
import { ApiError } from '@/utils/request'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()
const form = ref<Omit<Site, 'daysTogether'> | null>(null)
const saving = ref(false)

const commentOptions = [
  { value: 'OPEN' as const, label: '直接公开' },
  { value: 'REVIEW' as const, label: '先审后发' },
]

onMounted(() => {
  if (!siteStore.site) return
  const { daysTogether: ignored, ...rest } = siteStore.site
  void ignored
  form.value = { ...rest }
})

async function saveSite() {
  if (!form.value) return
  if (!form.value.title.trim() || !form.value.subtitle.trim() || !form.value.togetherSince) {
    pushToast('名称、小字和日期都要填', 'error')
    return
  }
  saving.value = true
  try {
    siteStore.site = await updateSite(form.value)
    pushToast('已保存')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('保存失败', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <section v-if="form" class="shell card wide">
      <h1 class="page-title">设置</h1>
      <p class="lede">整站的名字、日期，以及评论和弹幕怎么放出。</p>
      <form novalidate @submit.prevent="saveSite">
        <label class="field">
          <span>网站名称</span>
          <input v-model="form.title" maxlength="40" />
        </label>
        <label class="field">
          <span>一句小字</span>
          <input v-model="form.subtitle" maxlength="80" />
        </label>
        <div class="field">
          <span>在一起的日期</span>
          <AppDatePicker v-model="form.togetherSince" />
        </div>
        <label class="field">
          <span>关于页正文</span>
          <textarea v-model="form.about" class="tall" />
        </label>
        <div class="field">
          <span>评论和弹幕</span>
          <AppSelect v-model="form.commentMode" :options="commentOptions" />
        </div>
        <AppButton type="submit" :loading="saving">保存设置</AppButton>
      </form>
    </section>
    <Skeleton v-else class="shell wide" preset="fields" />
  </div>
</template>
