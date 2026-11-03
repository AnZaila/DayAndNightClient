<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Smile } from '@lucide/vue'
import { useSessionStore } from '@/stores/session'
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
  bar?: boolean
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
const canSend = computed(() => content.value.trim().length > 0)

watch(
  () => props.replyTo,
  (value) => {
    if (value) void nextTick(() => box.value?.focus())
  },
)

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

function onBox() {
  const el = box.value
  if (!el || props.bar) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`
}

function onKey(event: KeyboardEvent) {
  if (!props.bar || event.key !== 'Enter' || event.shiftKey) return
  event.preventDefault()
  void submit()
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
    await nextTick()
    onBox()
    if (props.replyTo) emit('cancelReply')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="composer" :class="{ bar }" novalidate @submit.prevent="submit">
    <p v-if="replyTo" class="hint reply">
      {{ t('comment.replyTo', { name: replyTo.nickname }) }}
      <button v-wave type="button" @click="emit('cancelReply')">{{ t('comment.cancel') }}</button>
    </p>
    <div v-if="!signedIn" class="guest">
      <GuestAvatar v-model="avatarUrl" />
      <input
        v-model="nickname"
        maxlength="20"
        :placeholder="t('comment.nicknamePlaceholder')"
        :aria-label="t('comment.nickname')"
      />
    </div>
    <div class="row">
      <ProfileLink v-if="session.user && !bar" :user-id="session.user.id">
        <UserAvatar :src="session.user.avatarUrl" :name="session.user.displayName" :size="32" />
      </ProfileLink>
      <div class="box">
        <textarea
          ref="box"
          v-model="content"
          maxlength="500"
          rows="1"
          :placeholder="
            replyTo
              ? t('comment.placeholderReply', { name: replyTo.nickname })
              : t('comment.placeholder')
          "
          :aria-label="t('comment.body')"
          @input="onBox"
          @keydown="onKey"
        />
        <div class="tools">
          <button
            ref="emojiButton"
            v-wave
            type="button"
            class="icon"
            :aria-label="t('comment.emoji')"
            @click="emojiOpen = !emojiOpen"
          >
            <Smile :size="20" />
          </button>
          <button
            v-wave
            type="submit"
            class="send"
            :disabled="sending || !canSend"
            :aria-busy="sending || undefined"
          >
            {{ replyTo ? t('action.reply') : t('comment.submit') }}
          </button>
        </div>
        <Transition :name="reduced ? undefined : 'pop'">
          <EmojiPicker
            v-if="emojiOpen"
            :ignore="emojiButton"
            @pick="insertEmoji"
            @close="emojiOpen = false"
          />
        </Transition>
      </div>
    </div>
  </form>
</template>

<style scoped lang="scss">
.composer {
  display: grid;
  gap: var(--space-sm);
}

.reply {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  color: var(--muted);
  font-size: var(--text-sm);
}

.reply button {
  color: var(--primary);
  cursor: pointer;
}

.guest {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);

  input {
    flex: 1;
    min-width: 140px;
    min-height: 40px;
    padding: var(--space-xs) var(--space-sm);
    background: var(--field);
    border: var(--rule-hair) solid var(--line);
    border-radius: var(--radius);
  }
}

.row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
}

.box {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: var(--space-xs);
  min-width: 0;
}

textarea {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  max-height: 96px;
  padding: 10px 0;
  resize: none;
  background: transparent;
  border: 0;
  line-height: 1.4;
}

.tools {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-xs);
  padding-bottom: 6px;
}

.icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--muted);
  cursor: pointer;

  &:hover {
    color: var(--heading);
  }
}

.send {
  padding: 0 var(--space-xs);
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    color: color-mix(in oklab, var(--primary) 40%, var(--muted));
    cursor: default;
  }
}

.composer.bar {
  display: contents;
}

.composer.bar .reply,
.composer.bar .guest {
  flex: 1 0 100%;
}

.composer.bar .guest input {
  min-height: 36px;
  background: color-mix(in oklab, var(--heading) 4%, var(--surface));
  border: 0;
  border-radius: 20px;
}

.composer.bar .row {
  flex: 1;
  min-width: 0;
  align-items: center;
}

.composer.bar .box {
  align-items: center;
  height: 40px;
  min-height: 40px;
  padding: 0 8px 0 16px;
  overflow: hidden;
  background: color-mix(in oklab, var(--heading) 4%, var(--surface));
  border-radius: 20px;
}

.composer.bar textarea {
  height: 22px;
  min-height: 22px;
  max-height: 22px;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 14px;
  line-height: 22px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.composer.bar .tools {
  padding-bottom: 0;
}
</style>
