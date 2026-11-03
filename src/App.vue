<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppToast from '@/components/common/AppToast.vue'
import { overlayBehind } from '@/composables/usePostOverlay'

const route = useRoute()
const overlay = computed(() => route.name === 'post')

watch(
  overlay,
  (on) => {
    document.body.style.overflow = on ? 'hidden' : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="frame" :class="{ overlaying: overlay }">
    <SiteHeader />
    <main>
      <router-view v-slot="{ Component, route: current }">
        <Transition name="page" mode="out-in" type="transition">
          <keep-alive>
            <component
              :is="overlay && overlayBehind ? overlayBehind.view : Component"
              v-if="!overlay || overlayBehind"
              :key="overlay && overlayBehind ? overlayBehind.key : current.fullPath"
            />
          </keep-alive>
        </Transition>
        <component :is="Component" v-if="overlay" />
      </router-view>
    </main>
    <AppToast />
  </div>
</template>

<style scoped lang="scss">
.frame {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.frame.overlaying {
  position: relative;
  z-index: 0;
  pointer-events: none;
}

.frame.overlaying :deep(.toasts) {
  pointer-events: auto;
}

main {
  position: relative;
  z-index: var(--z-raised);
  flex: 1;
  padding: var(--space-lg) 0 var(--space-xl);
}
</style>
