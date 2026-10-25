<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useDanmakuVisible } from '@/composables/useDanmakuVisible'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  send: (nickname: string | null, content: string) => Promise<void>
  replyTo?: { nickname: string } | null
}>()

const emit = defineEmits<{
  cancelReply: []
}>()

const { shown, toggle } = useDanmakuVisible()

const session = useSessionStore()
const nickname = ref('')
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
    await props.send(signedIn.value ? null : nickname.value.trim(), content.value.trim())
    content.value = ''
    if (props.replyTo) emit('cancelReply')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="bar" novalidate @submit.prevent="submit">
    <p v-if="replyTo" class="reply">
      回复 {{ replyTo.nickname }}
      <button v-wave type="button" @click="emit('cancelReply')">取消</button>
    </p>
    <input
      v-if="!signedIn"
      v-model="nickname"
      maxlength="20"
      placeholder="昵称"
      aria-label="昵称"
    />
    <input
      v-model="content"
      maxlength="40"
      :placeholder="replyTo ? `回复 ${replyTo.nickname}` : '飞一句过去'"
      aria-label="弹幕"
    />
    <AppButton variant="quiet" type="button" @click="toggle">{{ shown ? '关掉弹幕' : '打开弹幕' }}</AppButton>
    <AppButton type="submit" :disabled="sending">{{ replyTo ? '回复' : '发送' }}</AppButton>
  </form>
</template>

<style scoped lang="scss">
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  .reply {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    margin: 0;
    color: var(--muted);
    font-size: 13px;

    button {
      color: var(--primary);
      cursor: pointer;
    }
  }

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
    flex: 1;
  }
}
</style>
