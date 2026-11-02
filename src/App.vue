<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppToast from '@/components/common/AppToast.vue'
</script>

<template>
  <div class="frame">
    <SiteHeader />
    <main>
      <router-view v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
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

main {
  position: relative;
  z-index: var(--z-raised);
  flex: 1;
  padding: var(--space-lg) 0 var(--space-xl);
}
</style>
