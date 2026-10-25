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
  padding: 20px 0 56px;
}
</style>
