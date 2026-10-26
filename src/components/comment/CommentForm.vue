<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import AppButton from '@/components/common/AppButton.vue'
import GuestAvatar from '@/components/common/GuestAvatar.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmojiPicker from '@/components/comment/EmojiPicker.vue'
import { pushToast } from '@/composables/useToast'

const props = defineProps<{
  submitComment: (
    nickname: string | null,
    content: string,
    avatarUrl: string | null,
  ) => Promise<void>
  replyTo?: { nickname: string } | null
}>()

const emit = defineEmits<{
  cancelReply: []
}>()

const session = useSessionStore()
const nickname = ref('')
const avatarUrl = ref<string | null>(null)
const content = ref('')
const sending = ref(false)
const emojiOpen = ref(false)
const box = ref<HTMLTextAreaElement | null>(null)
const emojiButton = ref<HTMLButtonElement | null>(null)
const signedIn = computed(() => Boolean(session.user))

function insertEmoji(emoji: string) {
  const el = box.value
  const start = el?.selectionStart ?? content.value.length
  const end = el?.selectionEnd ?? start
  const next = content.value.slice(0, start) + emoji + content.value.slice(end)
  if (next.length > 500) {
    pushToast('评论最多 500 字', 'error')
    return
  }
  content.value = next
  emojiOpen.value = false
  const caret = start + emoji.length
  requestAnimationFrame(() => {
    el?.focus()
    el?.setSelectionRange(caret, caret)
  })
}

async function submit() {
  if (!signedIn.value && !nickname.value.trim()) {
    pushToast('留一个昵称', 'error')
    return
  }
  if (!content.value.trim()) {
    pushToast('写一条评论', 'error')
    return
  }
  sending.value = true
  try {
    await props.submitComment(
      signedIn.value ? null : nickname.value.trim(),
      content.value,
      signedIn.value ? null : avatarUrl.value,
    )
    content.value = ''
    if (props.replyTo) emit('cancelReply')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <p v-if="replyTo" class="hint reply">
      回复 {{ replyTo.nickname }}
      <button v-wave type="button" @click="emit('cancelReply')">取消</button>
    </p>
    <p v-if="session.user" class="hint identity">
      <ProfileLink :user-id="session.user.id">
        <UserAvatar :src="session.user.avatarUrl" :name="session.user.displayName" :size="22" />
      </ProfileLink>
      以 {{ session.user.displayName }} 留言。
    </p>
    <template v-else>
      <label class="field">
        <span>昵称</span>
        <input v-model="nickname" maxlength="20" placeholder="怎么称呼你" />
      </label>
      <div class="field">
        <span>头像</span>
        <GuestAvatar v-model="avatarUrl" />
        <p class="optional">可以生成一张，也可以不选。</p>
      </div>
    </template>
    <div class="field anchor">
      <span class="label-line">
        <span>评论</span>
        <button
          ref="emojiButton"
          v-wave
          type="button"
          class="emoji"
          @click="emojiOpen = !emojiOpen"
        >
          表情
        </button>
      </span>
      <EmojiPicker
        v-if="emojiOpen"
        :ignore="emojiButton"
        @pick="insertEmoji"
        @close="emojiOpen = false"
      />
      <textarea
        ref="box"
        v-model="content"
        maxlength="500"
        :placeholder="replyTo ? `回复 ${replyTo.nickname}` : '留下一句就好'"
      />
    </div>
    <AppButton type="submit" :loading="sending">{{ replyTo ? '回复' : '留下' }}</AppButton>
  </form>
</template>

<style scoped lang="scss">
.form {
  margin-top: 8px;
}

.identity,
.reply {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.reply button {
  color: var(--primary);
  cursor: pointer;
}

.anchor {
  position: relative;
}

.label-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.emoji {
  min-height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  color: var(--primary);
  cursor: pointer;
}

.optional {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
}
</style>
