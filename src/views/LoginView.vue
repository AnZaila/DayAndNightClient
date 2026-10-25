<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import { useSessionStore } from '@/stores/session'
import { ApiError } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const sending = ref(false)

async function submit() {
  sending.value = true
  error.value = null
  try {
    await session.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '登录失败'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="shell card narrow" @submit.prevent="submit">
    <h1 class="page-title">登录</h1>
    <p class="lede">朝暮只给两个人登录。看的人不用账号。</p>
    <label class="field">
      <span>邮箱</span>
      <input v-model="email" type="email" autocomplete="username" required />
    </label>
    <label class="field">
      <span>密码</span>
      <input v-model="password" type="password" autocomplete="current-password" required />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <AppButton type="submit" :disabled="sending">进入</AppButton>
  </form>
</template>

<style scoped lang="scss">
.narrow {
  max-width: 440px;
}
</style>
