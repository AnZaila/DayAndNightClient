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
  const trimmed = email.value.trim()
  if (!trimmed || !password.value) {
    error.value = '邮箱和密码都要填'
    return
  }
  if (!trimmed.includes('@')) {
    error.value = '邮箱要写成 name@example.com 这样'
    return
  }
  sending.value = true
  error.value = null
  try {
    await session.login(trimmed, password.value)
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
  <div class="shell wide gate">
    <div class="intro">
      <h1 class="page-title">登录</h1>
      <p class="lede">只给两个人登录，看的人不用账号。</p>
    </div>
    <form class="card narrow" novalidate @submit.prevent="submit">
    <label class="field">
      <span>邮箱</span>
      <input v-model="email" type="text" inputmode="email" autocomplete="username" />
    </label>
    <label class="field">
      <span>密码</span>
      <input v-model="password" type="password" autocomplete="current-password" />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <AppButton type="submit" :loading="sending">进入</AppButton>
    </form>
  </div>
</template>

<style scoped lang="scss">
.gate {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 440px);
  gap: var(--space-xl);
  align-items: start;
}

.intro .lede {
  margin: 0;
}

.narrow {
  width: 100%;
}

@media (max-width: 720px) {
  .gate {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-md);
  }
}
</style>
