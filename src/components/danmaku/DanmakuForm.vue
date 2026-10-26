<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSwitch from '@/components/common/AppSwitch.vue'
import GuestAvatar from '@/components/common/GuestAvatar.vue'
import { useDanmakuVisible } from '@/composables/useDanmakuVisible'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  send: (nickname: string | null, content: string, avatarUrl: string | null) => Promise<void>
}>()

const { shown } = useDanmakuVisible()

const session = useSessionStore()
const nickname = ref('')
const avatarUrl = ref<string | null>(null)
const content = ref('')
const sending = ref(false)
const signedIn = computed(() => Boolean(session.user))

async function submit() {
  if (!signedIn.value && !nickname.value.trim()) {
    pushToast('留一个昵称', 'error')
    return
  }
  if (!content.value.trim()) {
    pushToast('写一条弹幕', 'error')
    return
  }
  sending.value = true
  try {
    await props.send(
      signedIn.value ? null : nickname.value.trim(),
      content.value.trim(),
      signedIn.value ? null : avatarUrl.value,
    )
    content.value = ''
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="bar" novalidate @submit.prevent="submit">
    <template v-if="!signedIn">
      <GuestAvatar v-model="avatarUrl" />
      <input v-model="nickname" maxlength="20" placeholder="昵称" aria-label="昵称" />
    </template>
    <input v-model="content" maxlength="40" placeholder="飞一句过去" aria-label="弹幕内容" />
    <AppSwitch v-model="shown">弹幕</AppSwitch>
    <AppButton type="submit" :loading="sending">发送</AppButton>
  </form>
</template>

<style scoped lang="scss">
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  input {
    min-width: 0;
    min-height: 40px;
    padding: 8px 12px;
    background: var(--field);
    border: 0;
    border-radius: var(--radius);
  }

  input[aria-label='昵称'] {
    width: 108px;
    flex: none;
  }

  input:last-of-type {
    flex: 1 1 10rem;
    min-width: min(100%, 10rem);
  }
}
</style>
