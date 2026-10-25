<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps<{
  submitComment: (nickname: string | null, content: string) => Promise<void>
}>()

const session = useSessionStore()
const nickname = ref('')
const content = ref('')
const sending = ref(false)
const signedIn = computed(() => Boolean(session.user))

async function submit() {
  sending.value = true
  try {
    await props.submitComment(signedIn.value ? null : nickname.value.trim(), content.value)
    content.value = ''
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <p v-if="session.user" class="hint identity">以 {{ session.user.displayName }} 留言。</p>
    <label v-else class="field">
      <span>昵称</span>
      <input v-model="nickname" maxlength="20" required placeholder="怎么称呼你" />
    </label>
    <label class="field">
      <span>评论</span>
      <textarea v-model="content" maxlength="500" required placeholder="留下一句就好" />
    </label>
    <AppButton type="submit" :disabled="sending">留下</AppButton>
  </form>
</template>

<style scoped lang="scss">
.form {
  margin-top: 8px;
}

.identity {
  margin-bottom: 10px;
}
</style>
