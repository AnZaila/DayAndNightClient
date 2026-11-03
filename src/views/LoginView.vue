<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import { useSessionStore } from '@/stores/session'
import { ApiError } from '@/utils/request'

const { t } = useI18n()
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
    error.value = t('login.needBoth')
    return
  }
  if (!trimmed.includes('@')) {
    error.value = t('login.emailFormat')
    return
  }
  sending.value = true
  error.value = null
  try {
    await session.login(trimmed, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : t('login.failed')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="shell wide gate">
    <div class="intro">
      <h1 class="page-title">{{ t('login.title') }}</h1>
      <p class="lede">{{ t('login.lede') }}</p>
    </div>
    <form class="card narrow" novalidate @submit.prevent="submit">
    <label class="field">
      <span>{{ t('login.email') }}</span>
      <input v-model="email" type="text" inputmode="email" autocomplete="username" />
    </label>
    <label class="field">
      <span>{{ t('login.password') }}</span>
      <input v-model="password" type="password" autocomplete="current-password" />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <AppButton type="submit" :loading="sending">{{ t('login.enter') }}</AppButton>
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
