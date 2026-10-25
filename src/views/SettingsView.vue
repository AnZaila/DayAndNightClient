<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { updateSite } from '@/api/site'
import { pushToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import type { Site } from '@/types/site'
import { ApiError } from '@/utils/request'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()
const form = ref<Omit<Site, 'daysTogether'> | null>(null)

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
  try {
    siteStore.site = await updateSite(form.value)
    pushToast('已保存')
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : '保存失败', 'error')
  }
}
</script>

<template>
  <div>
  <section v-if="form" class="shell card form">
    <h1 class="page-title">设置</h1>
    <p class="lede">整站的名字、日期和评论方式。</p>
    <form @submit.prevent="saveSite">
      <label class="field">
        <span>网站名称</span>
        <input v-model="form.title" required maxlength="40" />
      </label>
      <label class="field">
        <span>一句小字</span>
        <input v-model="form.subtitle" required maxlength="80" />
      </label>
      <div class="field">
        <span>在一起的日期</span>
        <AppDatePicker v-model="form.togetherSince" required />
      </div>
      <label class="field">
        <span>关于页正文</span>
        <textarea v-model="form.about" class="tall" />
      </label>
      <div class="field">
        <span>游客评论</span>
        <AppSelect v-model="form.commentMode" :options="commentOptions" />
      </div>
      <AppButton type="submit">保存设置</AppButton>
    </form>
  </section>
  <p v-else class="shell muted">站点信息还没加载出来。</p>
  </div>
</template>

<style scoped lang="scss">
.form {
  max-width: 680px;
}
</style>
