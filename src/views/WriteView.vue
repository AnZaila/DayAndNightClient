<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Globe, Lock, MapPin } from '@lucide/vue'
import { createPost, deletePostMedia, fetchPost, updatePost, uploadPostCover } from '@/api/post'
import AppButton from '@/components/common/AppButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import AppCheckbox from '@/components/common/AppCheckbox.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppFilePicker from '@/components/common/AppFilePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import DiaryIcon from '@/components/post/DiaryIcon.vue'
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
const happenedDate = ref('')
const happenedTime = ref('00:00:00')
const mood = ref('none')
const weather = ref('none')
const location = ref('')
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const visibility = ref<Visibility>('PUBLIC')
const status = ref<PostStatus>('PUBLISHED')
const commentsOpen = ref(true)
const pickerKey = ref(0)
const pendingMedia = ref<number | null>(null)
const file = ref<File | null>(null)
const draft = ref<string | null>(null)
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
const moodPresets = ['开心', '平静', '想你', '甜蜜', '想家', '难过', '烦躁', '累了', '期待']
const weatherPresets = ['晴', '多云', '阴', '小雨', '大雨', '雷雨', '雪', '大风', '雾']

function choiceOptions(presets: string[], current: string) {
  const options = [
    { value: 'none', label: '不选' },
    ...presets.map((item) => ({ value: item, label: item })),
  ]
  if (current !== 'none' && current && !presets.includes(current)) {
    options.push({ value: current, label: current })
  }
  return options
}

const moodOptions = computed(() => choiceOptions(moodPresets, mood.value))
const weatherOptions = computed(() => choiceOptions(weatherPresets, weather.value))

function chosen(value: string) {
  return value === 'none' ? '' : value
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function applyNow() {
  const now = new Date()
  happenedDate.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  happenedTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function applyWhen(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?)?/)
  if (!match) {
    applyNow()
    return
  }
  happenedDate.value = match[1]
  happenedTime.value = match[2] ? `${match[2]}:${match[3] ?? '00'}` : '00:00:00'
}

function happenedAtValue() {
  const time = happenedTime.value.length === 5 ? `${happenedTime.value}:00` : happenedTime.value
  return happenedDate.value && time ? `${happenedDate.value}T${time}` : ''
}

function reset() {
  content.value = ''
  applyNow()
  mood.value = 'none'
  weather.value = 'none'
  location.value = ''
  latitude.value = null
  longitude.value = null
  visibility.value = 'PUBLIC'
  status.value = 'PUBLISHED'
  commentsOpen.value = true
  file.value = null
  pickerKey.value += 1
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
  applyWhen(post.happenedAt)
  mood.value = post.mood || 'none'
  weather.value = post.weather || 'none'
  location.value = post.location ?? ''
  latitude.value = post.latitude
  longitude.value = post.longitude
  visibility.value = post.visibility
  status.value = post.status
  commentsOpen.value = post.commentsOpen
  existing.value = post.media
  file.value = null
  pickerKey.value += 1
  ready.value = true
}

watch(file, (next) => {
  if (draft.value) URL.revokeObjectURL(draft.value)
  draft.value = next ? URL.createObjectURL(next) : null
})

onBeforeUnmount(() => {
  if (draft.value) URL.revokeObjectURL(draft.value)
})

function chooseCover(list: File[]) {
  file.value = list[0] ?? null
}

function clearCover() {
  file.value = null
  pickerKey.value += 1
}

watch(
  () => route.params.id,
  () => void load(),
  { immediate: true },
)

async function save() {
  if (!happenedDate.value || !happenedTime.value) {
    pushToast('选一个日期和时间', 'error')
    return
  }
  if (isBlankHtml(content.value)) {
    pushToast('正文还是空的', 'error')
    return
  }
  saving.value = true
  error.value = null
  const input = {
    content: content.value,
    happenedAt: happenedAtValue(),
    mood: chosen(mood.value),
    weather: chosen(weather.value),
    location: location.value,
    visibility: visibility.value,
    latitude: latitude.value,
    longitude: longitude.value,
  }
  try {
    const saved = editing.value
      ? await updatePost(postId.value, {
          ...input,
          status: status.value,
          commentsOpen: commentsOpen.value,
        })
      : await createPost(input)
    if (file.value) {
      try {
        await uploadPostCover(saved.id, file.value)
      } catch (cause) {
        const message = cause instanceof ApiError ? cause.message : '封面没有传上去'
        error.value = message
        if (!(cause instanceof ApiError)) pushToast(message, 'error')
        if (!editing.value) {
          await router.replace({ name: 'write', params: { id: saved.id } })
        }
        return
      }
    }
    pushToast(editing.value ? '已保存' : '已放进时间轴')
    await router.push({ name: 'post', params: { id: saved.id } })
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '保存失败'
    if (!(cause instanceof ApiError)) pushToast(error.value, 'error')
  } finally {
    saving.value = false
  }
}

function clearPoint() {
  latitude.value = null
  longitude.value = null
}

function askRemoveMedia(mediaId: number) {
  pendingMedia.value = mediaId
}

function closeMediaConfirm(open: boolean) {
  if (!open) pendingMedia.value = null
}

async function confirmRemoveMedia() {
  const mediaId = pendingMedia.value
  pendingMedia.value = null
  if (mediaId == null) return
  await removeMedia(mediaId)
}

async function removeMedia(mediaId: number) {
  try {
    await deletePostMedia(postId.value, mediaId)
    existing.value = existing.value.filter((item) => item.id !== mediaId)
    pushToast('已移除')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('移除失败', 'error')
  }
}
</script>

<template>
  <div class="compose">
    <form class="card form" novalidate @submit.prevent="save">
      <h1 class="page-title">{{ editing ? '改一笔' : '写一笔' }}</h1>
      <div class="field">
        <span>发生在</span>
        <div class="when">
          <AppDatePicker v-model="happenedDate" />
          <input v-model="happenedTime" class="clock" type="time" step="1" aria-label="时间" />
        </div>
      </div>
      <div class="field">
        <span>正文</span>
        <RichEditor v-if="ready" v-model="content" />
        <Skeleton v-else preset="editor" />
      </div>
      <div class="split">
        <div class="field">
          <span>心情</span>
          <AppSelect v-model="mood" :options="moodOptions" />
        </div>
        <div class="field">
          <span>天气</span>
          <AppSelect v-model="weather" :options="weatherOptions" />
        </div>
      </div>
      <label class="field">
        <span>地点</span>
        <input v-model="location" maxlength="80" placeholder="家里、火车上" />
      </label>
      <div class="field">
        <span>地图</span>
        <MapPoint v-model:latitude="latitude" v-model:longitude="longitude" pick />
        <p class="hint">点一下标记，拖动可以移动地图。</p>
        <div v-if="latitude != null && longitude != null" class="point">
          <span>{{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}</span>
          <AppButton variant="quiet" type="button" @click="clearPoint">清除标记</AppButton>
        </div>
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
      </template>
      <div class="field">
        <span>封面</span>
        <AppFilePicker
          :key="pickerKey"
          label="选择封面"
          accept="image/jpeg,image/png,image/webp"
          @select="chooseCover"
        />
        <p class="hint">只放一张，显示在时间轴上。</p>
        <p v-if="file && existing.length" class="hint">保存后会换成这一张。</p>
      </div>
      <figure v-if="draft" class="pending">
        <img :src="draft" alt="" />
        <AppButton variant="quiet" type="button" @click="clearCover">取消这张</AppButton>
      </figure>
      <div v-else-if="existing.length" class="photos">
        <figure v-for="media in existing" :key="media.id">
          <img :src="media.url" alt="" />
          <AppButton variant="quiet" type="button" @click="askRemoveMedia(media.id)"
            >移除</AppButton
          >
        </figure>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <AppButton type="submit" :loading="saving">放进时间轴</AppButton>
    </form>
    <aside class="card preview">
      <p class="kicker">预览</p>
      <time>{{ formatDate(happenedAtValue()) }}</time>
      <div class="author">
        <UserAvatar :src="session.user?.avatarUrl" :name="session.user?.displayName" :size="36" />
        <h2>{{ session.user?.displayName || '你' }}写下的这一天</h2>
      </div>
      <div class="chips">
        <span v-if="mood !== 'none'"><DiaryIcon kind="mood" :value="mood" /> {{ mood }}</span>
        <span v-if="weather !== 'none'"
          ><DiaryIcon kind="weather" :value="weather" /> {{ weather }}</span
        >
        <span v-if="location"><MapPin :size="14" /> {{ location }}</span>
        <span v-if="visibility === 'PRIVATE'"><Lock :size="14" /> 仅双方</span>
        <span v-else><Globe :size="14" /> 公开</span>
      </div>
      <MapPoint
        v-if="latitude != null && longitude != null"
        :latitude="latitude"
        :longitude="longitude"
      />
      <div v-if="draft || existing.length" class="gallery">
        <img v-if="draft" :src="draft" alt="" />
        <template v-else>
          <img v-for="media in existing" :key="media.id" :src="media.url" alt="" />
        </template>
      </div>
      <PostBody v-if="!isBlankHtml(content)" :content="content" />
      <p v-else class="muted">正文会显示在这里。</p>
    </aside>
    <ConfirmDialog
      :open="pendingMedia !== null"
      title="移除这张封面？"
      description="删掉之后找不回来。"
      confirm-label="移除"
      @update:open="closeMediaConfirm"
      @confirm="confirmRemoveMedia"
    />
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

.author {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  color: var(--heading);
  font-size: 20px;
}

.point {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

.when {
  display: flex;
  gap: 8px;
  min-width: 0;

  :deep(.picker) {
    flex: 1;
    min-width: 0;
  }

  input.clock {
    width: 9.5rem;
    flex: none;
  }
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

.pending {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 280px;
  margin: 0 0 16px;

  img {
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: var(--radius);
  }
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

  .when {
    flex-wrap: wrap;
  }

  .when :deep(.picker),
  .when input.clock {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>
