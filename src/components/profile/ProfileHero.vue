<script setup lang="ts">
import { computed, ref } from 'vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'

const props = defineProps<{
  name: string
  avatarUrl?: string | null
  coverUrl?: string | null
  signature?: string | null
  email?: string | null
}>()

const coverOpen = ref(false)
const coverStyle = computed(() => {
  const url = props.coverUrl
  return url ? { backgroundImage: `url("${url}")` } : undefined
})
</script>

<template>
  <section class="card hero">
    <div class="cover" :style="coverStyle">
      <button
        v-if="coverUrl"
        type="button"
        class="cover-view"
        aria-label="查看背景"
        @click="coverOpen = true"
      />
      <div class="cover-slot">
        <slot name="cover" />
      </div>
    </div>
    <div class="who">
      <div class="portrait">
        <UserAvatar :src="avatarUrl" :name="name" :size="84" preview />
      </div>
      <div class="meta">
        <h1>{{ name }}</h1>
        <p v-if="signature" class="sign">{{ signature }}</p>
        <p v-if="email" class="mail">{{ email }}</p>
        <slot name="meta" />
      </div>
    </div>
    <ImageLightbox v-if="coverUrl" v-model:open="coverOpen" :src="coverUrl" alt="背景" />
  </section>
</template>

<style scoped lang="scss">
.hero {
  padding: 0 0 var(--space-md);
  overflow: hidden;
}

.cover {
  position: relative;
  height: 288px;
  background-color: var(--primary-soft);
  background-image: none;
  background-position: center;
  background-size: cover;
}

.cover-view {
  position: absolute;
  inset: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.cover-slot {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
}

.who {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: 0 var(--space-md);

  h1 {
    margin: 0;
    color: var(--heading);
    font-size: 22px;
    overflow-wrap: break-word;
    min-width: 0;
  }
}

.portrait {
  z-index: 1;
  flex: none;
  margin-top: calc(var(--space-xl) * -1);
  padding: var(--space-2xs);
  border-radius: 50%;
  background: var(--surface);
}

.meta {
  min-width: 0;
  padding-top: var(--space-md);
}

.sign,
.mail {
  overflow-wrap: anywhere;
}

.sign {
  margin: var(--space-2xs) 0 0;
  color: var(--text);
}

.mail {
  margin: var(--space-3xs) 0 0;
  color: var(--muted);
  font-size: 13px;
}
</style>
