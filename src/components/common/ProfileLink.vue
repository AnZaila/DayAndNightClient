<script setup lang="ts">
import { computed } from 'vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  userId?: number | null
}>()

const session = useSessionStore()
const to = computed(() => {
  if (!props.userId) return undefined
  if (session.user?.id === props.userId) return { name: 'profile' as const }
  return { name: 'user' as const, params: { id: props.userId } }
})
</script>

<template>
  <WaveLink v-if="to" class="profile-link" :to="to" @click.stop>
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
  gap: var(--space-xs);
  max-width: 100%;
  color: inherit;
  vertical-align: middle;
}

a.profile-link:hover {
  color: var(--primary);
}
</style>
