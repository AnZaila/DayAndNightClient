<script setup lang="ts">
import { ref } from 'vue'
import { deleteComment, fetchRecentComments, updateCommentStatus } from '@/api/comment'
import { deleteDanmaku, fetchRecentDanmaku, updateDanmakuStatus } from '@/api/danmaku'
import AppButton from '@/components/common/AppButton.vue'
import CommentList from '@/components/comment/CommentList.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Pager from '@/components/common/Pager.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { usePaged } from '@/composables/usePaged'
import { pushToast } from '@/composables/useToast'
import type { Comment, CommentStatus } from '@/types/comment'
import type { Danmaku } from '@/types/danmaku'
import { formatDateTime } from '@/utils/text'

const pageSize = 20
const thread = usePaged<Comment>((page) => fetchRecentComments('manage', page, pageSize))
const notes = usePaged<Danmaku>((page) => fetchRecentDanmaku(page, pageSize))
const pendingNote = ref<number | null>(null)

void thread.open(1)
void notes.open(1)

async function setStatus(id: number, status: CommentStatus) {
  const updated = await updateCommentStatus(id, status)
  thread.items.value = thread.items.value.map((item) => (item.id === id ? updated : item))
  pushToast(status === 'HIDDEN' ? '已隐藏' : '已显示')
}

async function removeComment(id: number) {
  await deleteComment(id)
  const next =
    thread.items.value.length === 1 && thread.page.value > 1
      ? thread.page.value - 1
      : thread.page.value
  await thread.open(next || 1)
  pushToast('已删除')
}

async function setNoteStatus(id: number, status: Danmaku['status']) {
  const updated = await updateDanmakuStatus(id, status)
  notes.items.value = notes.items.value.map((item) => (item.id === id ? updated : item))
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
  const next =
    notes.items.value.length === 1 && notes.page.value > 1 ? notes.page.value - 1 : notes.page.value
  await notes.open(next || 1)
  pushToast('已删除')
}
</script>

<template>
  <div class="shell stack page">
    <section class="card">
      <h1 class="page-title">评论管理</h1>
      <p class="lede">别人留下的。</p>
      <Skeleton
        v-if="thread.loading.value && thread.items.value.length === 0"
        preset="comment"
        :count="4"
      />
      <p v-else-if="thread.error.value && thread.items.value.length === 0" class="error">
        {{ thread.error.value }}
      </p>
      <p v-else-if="thread.items.value.length === 0" class="muted">还没有别人的留言。</p>
      <CommentList
        v-if="thread.items.value.length"
        :comments="thread.items.value"
        can-moderate
        show-post
        @hide="setStatus($event, 'HIDDEN')"
        @show="setStatus($event, 'VISIBLE')"
        @remove="removeComment"
      />
      <Pager
        :page="thread.page.value"
        :total="thread.total.value"
        :size="thread.size.value || pageSize"
        :disabled="thread.loading.value"
        @page="thread.open"
      />
    </section>
    <section class="card">
      <h2>弹幕</h2>
      <p class="lede">包括自己发的。先审后发时，从这里放出来。</p>
      <Skeleton
        v-if="notes.loading.value && notes.items.value.length === 0"
        preset="note"
        :count="4"
      />
      <p v-else-if="notes.error.value && notes.items.value.length === 0" class="error">
        {{ notes.error.value }}
      </p>
      <p v-else-if="notes.items.value.length === 0" class="muted">还没有弹幕。</p>
      <ul v-if="notes.items.value.length" class="notes">
        <li v-for="note in notes.items.value" :key="note.id">
          <div>
            <strong>{{ note.nickname }}</strong>
            <span class="muted"> · {{ formatDateTime(note.createdAt) }}</span>
            <span v-if="note.status === 'HIDDEN'" class="muted"> · 已隐藏</span>
            <p>{{ note.content }}</p>
            <p class="muted">
              <WaveLink v-if="note.postId" :to="{ name: 'post', params: { id: note.postId } }"
                >看这篇</WaveLink
              >
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
            <AppButton
              v-else
              variant="quiet"
              type="button"
              @click="setNoteStatus(note.id, 'VISIBLE')"
            >
              显示
            </AppButton>
            <AppButton variant="quiet" type="button" @click="pendingNote = note.id">删除</AppButton>
          </div>
        </li>
      </ul>
      <Pager
        :page="notes.page.value"
        :total="notes.total.value"
        :size="notes.size.value || pageSize"
        :disabled="notes.loading.value"
        @page="notes.open"
      />
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
