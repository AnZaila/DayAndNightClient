<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const session = useSessionStore()
const nickname = ref('')
const avatarUrl = ref<string | null>(null)
const content = ref('')
const sending = ref(false)
const emojiOpen = ref(false)
const box = ref<HTMLTextAreaElement | null>(null)
const emojiButton = ref<HTMLButtonElement | null>(null)
const signedIn = computed(() => Boolean(session.user))
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function insertEmoji(emoji: string) {
  const el = box.value
  const start = el?.selectionStart ?? content.value.length
  const end = el?.selectionEnd ?? start
  const next = content.value.slice(0, start) + emoji + content.value.slice(end)
  if (next.length > 500) {
    pushToast(t('comment.tooLong'), 'error')
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
    pushToast(t('comment.needNickname'), 'error')
    return
  }
  if (!content.value.trim()) {
    pushToast(t('comment.needBody'), 'error')
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
      {{ t('comment.replyTo', { name: replyTo.nickname }) }}
      <button v-wave type="button" @click="emit('cancelReply')">{{ t('comment.cancel') }}</button>
    </p>
    <p v-if="session.user" class="hint identity">
      <ProfileLink :user-id="session.user.id">
        <UserAvatar :src="session.user.avatarUrl" :name="session.user.displayName" :size="22" />
      </ProfileLink>
      {{ t('comment.asUser', { name: session.user.displayName }) }}
    </p>
    <template v-else>
      <label class="field">
        <span>{{ t('comment.nickname') }}</span>
        <input v-model="nickname" maxlength="20" :placeholder="t('comment.nicknamePlaceholder')" />
      </label>
      <div class="field">
        <span>{{ t('comment.avatar') }}</span>
        <GuestAvatar v-model="avatarUrl" />
        <p class="optional">{{ t('comment.avatarOptional') }}</p>
      </div>
    </template>
    <div class="field anchor">
      <span class="label-line">
        <span>{{ t('comment.body') }}</span>
        <button
          ref="emojiButton"
          v-wave
          type="button"
          class="emoji"
          @click="emojiOpen = !emojiOpen"
        >
          {{ t('comment.emoji') }}
        </button>
      </span>
      <Transition :name="reduced ? undefined : 'pop'">
        <EmojiPicker
          v-if="emojiOpen"
          :ignore="emojiButton"
          @pick="insertEmoji"
          @close="emojiOpen = false"
        />
      </Transition>
      <textarea
        ref="box"
        v-model="content"
        maxlength="500"
        :placeholder="
          replyTo
            ? t('comment.placeholderReply', { name: replyTo.nickname })
            : t('comment.placeholder')
        "
      />
    </div>
    <AppButton type="submit" :loading="sending">{{
      replyTo ? t('action.reply') : t('comment.submit')
    }}</AppButton>
  </form>
</template>

<style scoped lang="scss">
.form {
  margin-top: var(--space-xs);
}

.identity,
.reply {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
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
  padding: 0 var(--space-xs);
  border-radius: 999px;
  color: var(--primary);
  cursor: pointer;
}

.optional {
  margin: var(--space-xs) 0 0;
  color: var(--muted);
  font-size: 12px;
}
</style>
