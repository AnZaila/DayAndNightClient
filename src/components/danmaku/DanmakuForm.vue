<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'
import AppSwitch from '@/components/common/AppSwitch.vue'
import GuestAvatar from '@/components/common/GuestAvatar.vue'
import { useDanmakuVisible } from '@/composables/useDanmakuVisible'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  send: (nickname: string | null, content: string, avatarUrl: string | null) => Promise<void>
}>()

const { t } = useI18n()
const { shown } = useDanmakuVisible()

const session = useSessionStore()
const nickname = ref('')
const avatarUrl = ref<string | null>(null)
const content = ref('')
const sending = ref(false)
const signedIn = computed(() => Boolean(session.user))

async function submit() {
  if (!signedIn.value && !nickname.value.trim()) {
    pushToast(t('danmaku.needNickname'), 'error')
    return
  }
  if (!content.value.trim()) {
    pushToast(t('danmaku.needBody'), 'error')
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
      <input
        v-model="nickname"
        class="nick"
        maxlength="20"
        :placeholder="t('danmaku.nickname')"
        :aria-label="t('danmaku.nickname')"
      />
    </template>
    <input
      v-model="content"
      maxlength="40"
      :placeholder="t('danmaku.fly')"
      :aria-label="t('danmaku.content')"
    />
    <AppSwitch v-model="shown">{{ t('danmaku.toggle') }}</AppSwitch>
    <AppButton type="submit" :loading="sending">{{ t('action.send') }}</AppButton>
  </form>
</template>

<style scoped lang="scss">
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;

  input {
    min-width: 0;
    min-height: 40px;
    padding: var(--space-xs) var(--space-sm);
    background: var(--field);
    border: 0;
    border-radius: var(--radius);
    transition:
      background-color var(--dur-short) var(--ease-out),
      box-shadow var(--dur-short) var(--ease-out),
      outline-color var(--dur-short) var(--ease-out);
  }

  .nick {
    width: 108px;
    flex: none;
  }

  input:last-of-type {
    flex: 1 1 10rem;
    min-width: min(100%, 10rem);
  }
}
</style>
