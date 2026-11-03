<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { createPost, deletePostMedia, fetchPost, updatePost, uploadPostMedia } from '@/api/post'
import AppButton from '@/components/common/AppButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import AppSwitch from '@/components/common/AppSwitch.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppFilePicker from '@/components/common/AppFilePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import PostArticle from '@/components/post/PostArticle.vue'
import RichEditor from '@/components/post/RichEditor.vue'
import { pushToast } from '@/composables/useToast'
import type { Media, PostStatus, Visibility } from '@/types/post'
import { ApiError } from '@/utils/request'
import { namedLabel } from '@/i18n'
import { isBlankHtml, toEditorHtml } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()
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
const files = ref<File[]>([])
const drafts = ref<string[]>([])
const existing = ref<Media[]>([])
const error = ref<string | null>(null)
const saving = ref(false)
const ready = ref(false)

const visibilityOptions = computed(() => [
  { value: 'PUBLIC' as const, label: t('visibility.PUBLIC') },
  { value: 'PRIVATE' as const, label: t('visibility.PRIVATE') },
])
const statusOptions = computed(() => [
  { value: 'PUBLISHED' as const, label: t('write.published') },
  { value: 'HIDDEN' as const, label: t('write.hidden') },
])
const moodPresets = ['开心', '平静', '想你', '甜蜜', '想家', '难过', '烦躁', '累了', '期待']
const weatherPresets = ['晴', '多云', '阴', '小雨', '大雨', '雷雨', '雪', '大风', '雾']

function choiceOptions(presets: string[], current: string) {
  const options = [
    { value: 'none', label: t('write.none') },
    ...presets.map((item) => ({
      value: item,
      label: namedLabel(presets === moodPresets ? 'mood' : 'weather', item) || item,
    })),
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

const previewMedia = computed(() => [
  ...existing.value,
  ...drafts.value.map((url) => ({ url })),
])

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
  files.value = []
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
  const post = await fetchPost(postId.value, false)
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
  files.value = []
  pickerKey.value += 1
  ready.value = true
}

watch(files, (next) => {
  drafts.value.forEach((url) => URL.revokeObjectURL(url))
  drafts.value = next.map((file) => URL.createObjectURL(file))
})

onBeforeUnmount(() => {
  drafts.value.forEach((url) => URL.revokeObjectURL(url))
})

function choosePhotos(list: File[]) {
  files.value = list
}

function dropDraft(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
  if (!files.value.length) pickerKey.value += 1
}

watch(
  () => route.params.id,
  () => void load(),
  { immediate: true },
)

async function save() {
  if (!happenedDate.value || !happenedTime.value) {
    pushToast(t('write.needWhen'), 'error')
    return
  }
  if (isBlankHtml(content.value)) {
    pushToast(t('write.needBody'), 'error')
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
    if (files.value.length) {
      try {
        for (const photo of files.value) {
          await uploadPostMedia(saved.id, photo)
        }
      } catch (cause) {
        const message = cause instanceof ApiError ? cause.message : t('write.photosFailed')
        error.value = message
        if (!(cause instanceof ApiError)) pushToast(message, 'error')
        if (!editing.value) {
          await router.replace({ name: 'write', params: { id: saved.id } })
        }
        return
      }
    }
    pushToast(editing.value ? t('write.savedEdit') : t('write.savedNew'))
    await router.push({ name: 'post', params: { id: saved.id } })
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : t('write.saveFailed')
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
    pushToast(t('write.removed'))
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast(t('write.removeFailed'), 'error')
  }
}
</script>

<template>
  <div class="compose">
    <form class="card form" novalidate @submit.prevent="save">
      <h1 class="page-title">{{ editing ? t('write.edit') : t('write.create') }}</h1>
      <div class="field">
        <span>{{ t('write.happened') }}</span>
        <div class="when">
          <AppDatePicker v-model="happenedDate" />
          <input
            v-model="happenedTime"
            class="clock"
            type="time"
            step="1"
            :aria-label="t('write.time')"
          />
        </div>
      </div>
      <div class="field">
        <span>{{ t('write.body') }}</span>
        <RichEditor v-if="ready" v-model="content" />
        <Skeleton v-else preset="editor" />
      </div>
      <div class="split">
        <div class="field">
          <span>{{ t('write.mood') }}</span>
          <AppSelect v-model="mood" :options="moodOptions" />
        </div>
        <div class="field">
          <span>{{ t('write.weather') }}</span>
          <AppSelect v-model="weather" :options="weatherOptions" />
        </div>
      </div>
      <label class="field">
        <span>{{ t('write.location') }}</span>
        <input v-model="location" maxlength="80" :placeholder="t('write.locationPlaceholder')" />
      </label>
      <div class="field">
        <span>{{ t('write.map') }}</span>
        <MapPoint v-model:latitude="latitude" v-model:longitude="longitude" pick />
        <p class="hint">{{ t('write.mapHint') }}</p>
        <div v-if="latitude != null && longitude != null" class="point">
          <span>{{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}</span>
          <AppButton variant="quiet" type="button" @click="clearPoint">{{
            t('write.clearPin')
          }}</AppButton>
        </div>
      </div>
      <div class="field">
        <span>{{ t('write.who') }}</span>
        <AppSelect v-model="visibility" :options="visibilityOptions" />
      </div>
      <template v-if="editing">
        <div class="field">
          <span>{{ t('write.timeline') }}</span>
          <AppSelect v-model="status" :options="statusOptions" />
        </div>
        <AppSwitch v-model="commentsOpen">{{ t('write.comments') }}</AppSwitch>
      </template>
      <div class="field">
        <span>{{ t('write.photos') }}</span>
        <AppFilePicker
          :key="pickerKey"
          :label="t('write.pickPhotos')"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hide-names
          @select="choosePhotos"
        />
        <p class="hint">{{ t('write.photosHint') }}</p>
      </div>
      <div v-if="existing.length || drafts.length" class="photos">
        <figure v-for="(media, index) in existing" :key="media.id">
          <img :src="media.url" alt="" />
          <span v-if="index === 0" class="mark">{{ t('write.cover') }}</span>
          <AppButton variant="plain" tone="danger" type="button" @click="askRemoveMedia(media.id)">{{
            t('write.remove')
          }}</AppButton>
        </figure>
        <figure v-for="(url, index) in drafts" :key="url">
          <img :src="url" alt="" />
          <span v-if="!existing.length && index === 0" class="mark">{{ t('write.cover') }}</span>
          <AppButton variant="quiet" type="button" @click="dropDraft(index)">{{
            t('write.cancelPhoto')
          }}</AppButton>
        </figure>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <AppButton type="submit" :loading="saving">{{ t('write.submit') }}</AppButton>
    </form>
    <aside class="preview">
      <p class="preview-label">{{ t('write.preview') }}</p>
      <PostArticle
        :display-name="session.user?.displayName || t('write.you')"
        :avatar-url="session.user?.avatarUrl"
        :author-id="session.user?.id"
        :happened-at="happenedAtValue()"
        :mood="chosen(mood)"
        :weather="chosen(weather)"
        :location="location"
        :visibility="visibility"
        :content="content"
        :media="previewMedia"
        :latitude="latitude"
        :longitude="longitude"
        :empty="t('write.emptyPreview')"
      />
    </aside>
    <ConfirmDialog
      :open="pendingMedia !== null"
      :title="t('write.removePhotoTitle')"
      :description="t('write.removePhotoBody')"
      :confirm-label="t('write.remove')"
      tone="danger"
      @update:open="closeMediaConfirm"
      @confirm="confirmRemoveMedia"
    />
  </div>
</template>

<style scoped lang="scss">
.compose {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-md);
  align-items: start;
  width: min(var(--measure-write), calc(100% - var(--space-lg) - var(--space-2xs)));
  margin: 0 auto;
}

.preview {
  position: sticky;
  top: 72px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.preview-label {
  color: var(--muted);
  font-size: 13px;
}

.point {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  color: var(--muted);
  font-size: 13px;
}

.when {
  display: flex;
  gap: var(--space-xs);
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

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-sm);
}

.photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-sm);
  margin: var(--space-xs) 0 var(--space-md);
}

figure {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  min-width: 0;

  img {
    width: 100%;
    height: 96px;
    object-fit: cover;
    border-radius: var(--radius);
  }
}

.mark {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--surface) 82%, transparent);
  color: var(--heading);
  font-size: 11px;
  pointer-events: none;
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
