<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppToast from '@/components/common/AppToast.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <router-view v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </router-view>
  </main>
  <AppToast />
</template>

<style scoped lang="scss">
main {
  padding: var(--space-lg) 0 var(--space-2xl);
}
</style>
