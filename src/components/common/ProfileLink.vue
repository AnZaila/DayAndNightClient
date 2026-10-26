<script setup lang="ts">
import WaveLink from '@/components/common/WaveLink.vue'

defineProps<{
  userId?: number | null
}>()
</script>

<template>
  <WaveLink
    v-if="userId"
    class="profile-link"
    :to="{ name: 'user', params: { id: userId } }"
    @click.stop
  >
    <slot />
  </WaveLink>
  <span v-else class="profile-link">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.profile-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  color: inherit;
  vertical-align: middle;
}

a.profile-link:hover {
  color: var(--primary);
}
</style>
