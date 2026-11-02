<script setup lang="ts">
import { LogIn, Moon, PenLine, Sun } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useTheme } from '@/composables/useTheme'
import UserMenu from '@/components/layout/UserMenu.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { user } = storeToRefs(session)
const { theme, toggle } = useTheme()

const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <div class="actions">
    <button
      v-wave
      type="button"
      class="theme"
      :aria-label="theme === 'dark' ? '切换到亮色' : '切换到暗色'"
      @click="toggle"
    >
      <Sun v-if="theme === 'dark'" :size="16" />
      <Moon v-else :size="16" />
      {{ theme === 'dark' ? '暗色' : '亮色' }}
    </button>
    <template v-if="user">
      <WaveLink :to="{ name: 'write' }">
        <PenLine :size="16" />
        写一笔
      </WaveLink>
      <UserMenu @navigate="emit('navigate')" />
    </template>
    <WaveLink v-else :to="{ name: 'login' }">
      <LogIn :size="16" />
      登录
    </WaveLink>
  </div>
</template>

<style scoped lang="scss">
@use '../../assets/styles/header-controls' as hc;

.actions {
  display: flex;
  flex: none;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-xs);
}

.actions a,
.actions button {
  @include hc.control;
}

.actions a {
  @include hc.underline;
}

.actions a.router-link-active {
  @include hc.active;
}
</style>
