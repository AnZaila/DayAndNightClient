<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Globe, Lock, MapPin, Smile } from '@lucide/vue'
import { createPost, deletePostMedia, fetchPost, updatePost, uploadPostMedia } from '@/api/post'
import AppButton from '@/components/common/AppButton.vue'
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppFilePicker from '@/components/common/AppFilePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import PostBody from '@/components/post/PostBody.vue'
import RichEditor from '@/components/post/RichEditor.vue'
import { pushToast } from '@/composables/useToast'
import type { Media, PostStatus, Visibility } from '@/types/post'
import { ApiError } from '@/utils/request'
import { formatDate, isBlankHtml, toEditorHtml } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const editing = computed(() => route.params.id !== undefined)
const postId = computed(() => Number(route.params.id))

const content = ref('')
const happenedAt = ref(localToday())
const mood = ref('')
const location = ref('')
const visibility = ref<Visibility>('PUBLIC')
const status = ref<PostStatus>('PUBLISHED')
const commentsOpen = ref(true)
const files = ref<File[]>([])
const drafts = ref<string[]>([])
const existing = ref<Media[]>([])
const error = ref<string | null>(null)
const saving = ref(false)
const ready = ref(false)

const visibilityOptions = [
  { value: 'PUBLIC' as const, label: '公开' },
  { value: 'PRIVATE' as const, label: '仅双方' },
]
const statusOptions = [
  { value: 'PUBLISHED' as const, label: '显示在时间轴' },
  { value: 'HIDDEN' as const, label: '先从时间轴藏起来' },
]

function localToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function reset() {
  content.value = ''
  happenedAt.value = localToday()
  mood.value = ''
  location.value = ''
  visibility.value = 'PUBLIC'
  status.value = 'PUBLISHED'
  commentsOpen.value = true
  files.value = []
  existing.value = []
  ready.value = true
}

async function load() {
  error.value = null
  if (!editing.value) {
    reset()
    return
  }
  ready.value = false
  const post = await fetchPost(postId.value)
  if (session.user?.id !== post.authorId) {
    await router.replace({ name: 'post', params: { id: post.id } })
    return
  }
  content.value = toEditorHtml(post.content)
  happenedAt.value = post.happenedAt
  mood.value = post.mood ?? ''
  location.value = post.location ?? ''
  visibility.value = post.visibility
  status.value = post.status
  commentsOpen.value = post.commentsOpen
  existing.value = post.media
  files.value = []
  ready.value = true
}

watch(files, (list) => {
  drafts.value.forEach((url) => URL.revokeObjectURL(url))
  drafts.value = list.map((file) => URL.createObjectURL(file))
})

onBeforeUnmount(() => {
  drafts.value.forEach((url) => URL.revokeObjectURL(url))
})

const previewImages = computed(() => [...existing.value.map((item) => item.url), ...drafts.value])

watch(() => route.params.id, () => void load(), { immediate: true })

async function save() {
  if (isBlankHtml(content.value)) {
    pushToast('正文还是空的', 'error')
    return
  }
  saving.value = true
  error.value = null
  const input = {
    content: content.value,
    happenedAt: happenedAt.value,
    mood: mood.value,
    location: location.value,
    visibility: visibility.value,
  }
  try {
    const saved = editing.value
      ? await updatePost(postId.value, { ...input, status: status.value, commentsOpen: commentsOpen.value })
      : await createPost(input)
    if (files.value.length > 0) {
      await uploadPostMedia(saved.id, files.value)
    }
    pushToast(editing.value ? '已保存' : '已放进时间轴')
    await router.push({ name: 'post', params: { id: saved.id } })
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '保存失败'
    pushToast(error.value, 'error')
  } finally {
    saving.value = false
  }
}

async function removeMedia(mediaId: number) {
  try {
    await deletePostMedia(postId.value, mediaId)
    existing.value = existing.value.filter((item) => item.id !== mediaId)
    pushToast('已移除')
  } catch (cause) {
    pushToast(cause instanceof ApiError ? cause.message : '移除失败', 'error')
  }
}
</script>

<template>
  <div class="compose">
    <form class="card form" @submit.prevent="save">
      <h1 class="page-title">{{ editing ? '改一笔' : '写一笔' }}</h1>
      <div class="field">
        <span>发生在</span>
        <AppDatePicker v-model="happenedAt" required />
      </div>
      <div class="field">
        <span>正文</span>
        <RichEditor v-if="ready" v-model="content" />
      </div>
      <div class="split">
        <label class="field">
          <span>心情</span>
          <input v-model="mood" maxlength="32" placeholder="晴、想家" />
        </label>
        <label class="field">
          <span>地点</span>
          <input v-model="location" maxlength="80" placeholder="家里、火车上" />
        </label>
      </div>
      <div class="field">
        <span>谁可以看</span>
        <AppSelect v-model="visibility" :options="visibilityOptions" />
      </div>
      <template v-if="editing">
        <div class="field">
          <span>时间轴</span>
          <AppSelect v-model="status" :options="statusOptions" />
        </div>
        <AppCheckbox v-model="commentsOpen">允许评论</AppCheckbox>
        <div v-if="existing.length" class="photos">
          <figure v-for="media in existing" :key="media.id">
            <img :src="media.url" alt="" />
            <AppButton variant="quiet" type="button" @click="removeMedia(media.id)">移除</AppButton>
          </figure>
        </div>
      </template>
      <div class="field">
        <span>图片</span>
        <AppFilePicker accept="image/jpeg,image/png,image/webp" multiple @select="files = $event" />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <AppButton type="submit" :disabled="saving">{{ saving ? '保存中' : '放进时间轴' }}</AppButton>
    </form>
    <aside class="card preview">
      <p class="kicker">预览</p>
      <time>{{ formatDate(happenedAt) }}</time>
      <h2>{{ session.user?.displayName || '你' }}写下的这一天</h2>
      <div class="chips">
        <span v-if="mood"><Smile :size="14" /> {{ mood }}</span>
        <span v-if="location"><MapPin :size="14" /> {{ location }}</span>
        <span v-if="visibility === 'PRIVATE'"><Lock :size="14" /> 仅双方</span>
        <span v-else><Globe :size="14" /> 公开</span>
      </div>
      <div v-if="previewImages.length" class="gallery">
        <img v-for="(url, index) in previewImages" :key="url + index" :src="url" alt="" />
      </div>
      <PostBody v-if="!isBlankHtml(content)" :content="content" />
      <p v-else class="muted">正文会显示在这里。</p>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.compose {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 16px;
  align-items: start;
  width: min(1120px, calc(100% - 28px));
  margin: 0 auto;
}

.preview {
  position: sticky;
  top: 72px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kicker,
time {
  color: var(--muted);
  font-size: 13px;
}

h2 {
  color: var(--heading);
  font-size: 20px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 0 8px;
    border-radius: 999px;
    background: var(--field);
    color: var(--heading);
    font-size: 13px;
  }
}

.gallery {
  display: grid;
  gap: 8px;

  img {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: var(--radius);
  }
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin: 8px 0 16px;
}

figure {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  min-width: 0;

  img {
    width: 100%;
    height: 96px;
    object-fit: cover;
    border-radius: var(--radius);
  }
}

@media (max-width: 900px) {
  .compose {
    grid-template-columns: minmax(0, 1fr);
  }

  .preview {
    position: static;
  }
}

@media (max-width: 640px) {
  .split {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
