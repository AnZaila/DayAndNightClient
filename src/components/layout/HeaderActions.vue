<script setup lang="ts">
import { Languages, LogIn, Moon, PenLine, Sun } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import { useTheme } from '@/composables/useTheme'
import UserMenu from '@/components/layout/UserMenu.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { user } = storeToRefs(session)
const { theme, toggle } = useTheme()
const { locale, toggle: toggleLocale } = useLocale()
const { t } = useI18n()

const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <div class="actions">
    <button
      v-wave
      type="button"
      class="theme"
      :aria-label="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')"
      @click="toggle"
    >
      <Sun v-if="theme === 'dark'" :size="16" />
      <Moon v-else :size="16" />
      {{ theme === 'dark' ? t('theme.dark') : t('theme.light') }}
    </button>
    <button
      v-wave
      type="button"
      class="theme"
      :aria-label="locale === 'zh-CN' ? t('locale.toEn') : t('locale.toZh')"
      @click="toggleLocale"
    >
      <Languages :size="16" />
      {{ locale === 'zh-CN' ? t('locale.en') : t('locale.zh') }}
    </button>
    <template v-if="user">
      <WaveLink :to="{ name: 'write' }">
        <PenLine :size="16" />
        {{ t('action.write') }}
      </WaveLink>
      <UserMenu @navigate="emit('navigate')" />
    </template>
    <WaveLink v-else :to="{ name: 'login' }">
      <LogIn :size="16" />
      {{ t('action.login') }}
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
