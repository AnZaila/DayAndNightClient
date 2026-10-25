<script setup lang="ts">
import { ref } from 'vue'
import { deleteComment, fetchRecentComments, updateCommentStatus } from '@/api/comment'
import { deleteDanmaku, fetchRecentDanmaku, updateDanmakuStatus } from '@/api/danmaku'
import AppButton from '@/components/common/AppButton.vue'
import CommentList from '@/components/comment/CommentList.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { pushToast } from '@/composables/useToast'
import type { Comment, CommentStatus } from '@/types/comment'
import type { Danmaku } from '@/types/danmaku'
import { formatDateTime } from '@/utils/text'

const comments = ref<Comment[]>([])
const notes = ref<Danmaku[]>([])
const error = ref<string | null>(null)
const loading = ref(true)
const pendingNote = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [commentList, noteList] = await Promise.all([
      fetchRecentComments('manage'),
      fetchRecentDanmaku(),
    ])
    comments.value = commentList
    notes.value = noteList
  } catch {
    error.value = '评论没有加载出来。'
  } finally {
    loading.value = false
  }
}

void load()

async function setStatus(id: number, status: CommentStatus) {
  const updated = await updateCommentStatus(id, status)
  comments.value = comments.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

async function removeComment(id: number) {
  await deleteComment(id)
  comments.value = comments.value.filter((item) => item.id !== id)
  pushToast('已删除')
}

async function setNoteStatus(id: number, status: Danmaku['status']) {
  const updated = await updateDanmakuStatus(id, status)
  notes.value = notes.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

function closeNoteConfirm(open: boolean) {
  if (!open) pendingNote.value = null
}

async function confirmRemoveNote() {
  const id = pendingNote.value
  pendingNote.value = null
  if (id == null) return
  await deleteDanmaku(id)
  notes.value = notes.value.filter((item) => item.id !== id)
  pushToast('已删除')
}
</script>

<template>
  <div class="shell stack page">
    <section class="card">
      <h1 class="page-title">评论管理</h1>
      <p class="lede">别人留下的。</p>
      <p v-if="loading" class="muted">正在读取评论。</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else-if="comments.length === 0" class="muted">还没有别人的留言。</p>
      <CommentList
        v-else
        :comments="comments"
        can-moderate
        show-post
        @hide="setStatus($event, 'HIDDEN')"
        @show="setStatus($event, 'VISIBLE')"
        @remove="removeComment"
      />
    </section>
    <section class="card">
      <h2>弹幕</h2>
      <p class="lede">包括自己发的。先审后发时，从这里放出来。</p>
      <p v-if="loading" class="muted">正在读取弹幕。</p>
      <p v-else-if="!error && notes.length === 0" class="muted">还没有弹幕。</p>
      <ul v-else-if="!error" class="notes">
        <li v-for="note in notes" :key="note.id">
          <div>
            <strong>{{ note.nickname }}</strong>
            <span class="muted"> · {{ formatDateTime(note.createdAt) }}</span>
            <span v-if="note.status === 'HIDDEN'" class="muted"> · 已隐藏</span>
            <p>
              <template v-if="note.replyToNickname">回复 {{ note.replyToNickname }}：</template>
              {{ note.content }}
            </p>
            <p class="muted">
              <WaveLink v-if="note.postId" :to="{ name: 'post', params: { id: note.postId } }">看这篇</WaveLink>
              <span v-else>地图</span>
            </p>
          </div>
          <div class="row">
            <AppButton
              v-if="note.status === 'VISIBLE'"
              variant="quiet"
              type="button"
              @click="setNoteStatus(note.id, 'HIDDEN')"
            >
              隐藏
            </AppButton>
            <AppButton v-else variant="quiet" type="button" @click="setNoteStatus(note.id, 'VISIBLE')">
              显示
            </AppButton>
            <AppButton variant="quiet" type="button" @click="pendingNote = note.id">删除</AppButton>
          </div>
        </li>
      </ul>
    </section>
    <ConfirmDialog
      :open="pendingNote !== null"
      title="删除这条弹幕？"
      description="删掉之后找不回来。"
      confirm-label="删除"
      @update:open="closeNoteConfirm"
      @confirm="confirmRemoveNote"
    />
  </div>
</template>

<style scoped lang="scss">
.page {
  width: min(760px, calc(100% - 28px));
}

h2 {
  margin: 0 0 6px;
  color: var(--heading);
  font-size: 22px;
  font-weight: 600;
}

.notes {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  p {
    margin: 4px 0 0;
  }
}

.row {
  display: flex;
  gap: 8px;
}
</style>
