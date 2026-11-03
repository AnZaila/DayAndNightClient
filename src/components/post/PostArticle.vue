<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, MapPin, Maximize2, Pin } from '@lucide/vue'
import MapPoint from '@/components/common/MapPoint.vue'
import ProfileLink from '@/components/common/ProfileLink.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import DiaryIcon from '@/components/post/DiaryIcon.vue'
import PostBody from '@/components/post/PostBody.vue'
import { namedLabel } from '@/i18n'
import { formatDate, isBlankHtml, plainText } from '@/utils/text'

export type ArticleMedia = { id?: number; url: string }

const props = withDefaults(
  defineProps<{
    displayName: string
    avatarUrl?: string | null
    authorId?: number | null
    happenedAt: string
    mood?: string | null
    weather?: string | null
    location?: string | null
    visibility?: string | null
    pinned?: boolean
    title?: string | null
    content?: string | null
    media?: ArticleMedia[]
    latitude?: number | null
    longitude?: number | null
    zoom?: boolean
    empty?: string
  }>(),
  {
    avatarUrl: null,
    authorId: null,
    mood: null,
    weather: null,
    location: null,
    visibility: 'PUBLIC',
    pinned: false,
    title: '',
    content: '',
    media: () => [],
    latitude: null,
    longitude: null,
    zoom: false,
    empty: '',
  },
)

const emit = defineEmits<{
  open: [media: ArticleMedia]
}>()

const { t } = useI18n()
const alt = computed(
  () => props.title?.trim() || plainText(props.content || '').slice(0, 40) || t('post.imageAlt'),
)
const hasMood = computed(() => Boolean(props.mood) && props.mood !== 'none')
const hasWeather = computed(() => Boolean(props.weather) && props.weather !== 'none')
const when = computed(() => formatDate(props.happenedAt).replace(/(\s00:00(:00)?)$/, ''))
</script>

<template>
  <article class="card article">
    <slot name="gallery">
      <div v-if="media.length" class="gallery">
        <component
          :is="zoom ? 'button' : 'div'"
          v-for="(item, index) in media"
          :key="item.id ?? item.url"
          class="shot"
          :class="{ still: !zoom }"
          :type="zoom ? 'button' : undefined"
          @click="zoom && emit('open', item)"
        >
          <img :src="item.url" :alt="alt" />
          <span v-if="zoom && index === 0" class="zoom"
            ><Maximize2 :size="16" /> {{ t('action.zoomIn') }}</span
          >
        </component>
      </div>
    </slot>
    <div class="author">
      <ProfileLink :user-id="authorId">
        <UserAvatar :src="avatarUrl" :name="displayName" :size="42" />
      </ProfileLink>
      <div>
        <h1>
          <ProfileLink :user-id="authorId">{{ displayName }}</ProfileLink
          >{{ t('post.wroteThisDay') }}
        </h1>
        <time :datetime="happenedAt">{{ when }}</time>
      </div>
    </div>
    <div class="chips">
      <span v-if="hasMood" class="tag tag-mood"
        ><DiaryIcon kind="mood" :value="mood!" />{{ namedLabel('mood', mood) }}</span
      >
      <span v-if="hasWeather" class="tag tag-weather"
        ><DiaryIcon kind="weather" :value="weather!" />{{ namedLabel('weather', weather) }}</span
      >
      <span v-if="location" class="tag tag-place"><MapPin :size="14" />{{ location }}</span>
      <span v-if="visibility === 'PRIVATE'" class="tag tag-private"
        ><Lock :size="14" />{{ t('visibility.PRIVATE') }}</span
      >
      <span v-if="pinned" class="tag tag-pinned"
        ><Pin :size="12" :fill="'currentColor'" />{{ t('action.pin') }}</span
      >
      <slot name="chips" />
    </div>
    <slot name="stats" />
    <MapPoint
      v-if="latitude != null && longitude != null"
      :key="`${latitude}-${longitude}`"
      :latitude="latitude"
      :longitude="longitude"
    />
    <h2 v-if="title?.trim()" class="post-title">{{ title }}</h2>
    <PostBody v-if="content && !isBlankHtml(content)" class="body" :content="content" />
    <p v-else-if="empty" class="muted">{{ empty }}</p>
    <slot />
  </article>
</template>

<style scoped lang="scss">
.article {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.author {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  > div {
    min-width: 0;
  }
}

time {
  color: var(--muted);
  font-size: 13px;
}

h1 {
  color: var(--heading);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
  min-width: 0;
}

.post-title {
  margin: 0;
  color: var(--heading);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.chips span:not(.tag),
.chips :slotted(span:not(.tag)) {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 32px;
  color: var(--heading);
  font-size: var(--text-sm);
}

.chips .tag {
  height: 22px;
  padding: 0 8px;
  font-size: 11.5px;
}

.gallery {
  display: grid;
  gap: var(--space-sm);
}

.shot {
  position: relative;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  cursor: zoom-in;

  &.still {
    cursor: default;
  }
}

img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  transition: transform var(--dur-long) var(--ease-out);
}

.shot:hover:not(.still) img {
  transform: scale(1.03);
}

.zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--heading);
  font-size: var(--text-sm);
  border: var(--rule-hair) solid var(--line);
}

@media (prefers-reduced-motion: reduce) {
  .shot:hover img {
    transform: none;
  }
}
</style>
