<script setup lang="ts">
import { ChevronDown, LogOut, MessageCircle, Settings, User } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { pushToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useSessionStore } from '@/stores/session'

type MenuRoute = 'profile' | 'comments' | 'settings'

const emit = defineEmits<{ navigate: [] }>()

const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const { user } = storeToRefs(session)
const logoutOpen = ref(false)

function go(name: MenuRoute) {
  emit('navigate')
  void router.push({ name })
}

function askLogout() {
  emit('navigate')
  logoutOpen.value = true
}

async function logout() {
  await session.logout()
  pushToast(t('menu.loggedOut'))
  await router.push({ name: 'timeline' })
}
</script>

<template>
  <template v-if="user">
    <DropdownMenuRoot>
      <DropdownMenuTrigger as-child>
        <button v-wave type="button" class="me" :aria-label="t('header.accountMenu', { name: user.displayName })">
          <UserAvatar :src="user.avatarUrl" :name="user.displayName" :size="26" />
          <span class="me-name">{{ user.displayName }}</span>
          <ChevronDown class="caret" :size="14" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="soft-menu more-menu" align="end" :side-offset="8">
          <DropdownMenuItem class="soft-item" @select="go('profile')">
            <User :size="16" />
            {{ t('menu.profile') }}
          </DropdownMenuItem>
          <DropdownMenuItem class="soft-item" @select="go('comments')">
            <MessageCircle :size="16" />
            {{ t('menu.comments') }}
          </DropdownMenuItem>
          <DropdownMenuItem class="soft-item" @select="go('settings')">
            <Settings :size="16" />
            {{ t('menu.settings') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator class="menu-rule" />
          <DropdownMenuItem class="soft-item" @select="askLogout">
            <LogOut :size="16" />
            {{ t('menu.logout') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
    <ConfirmDialog
      v-model:open="logoutOpen"
      :title="t('menu.logoutTitle')"
      :description="t('menu.logoutBody')"
      :confirm-label="t('menu.logout')"
      :cancel-label="t('action.cancel')"
      @confirm="logout"
    />
  </template>
</template>

<style scoped lang="scss">
@use '../../assets/styles/header-controls' as hc;

.me {
  @include hc.control;
  gap: var(--space-xs);
  max-width: 12rem;
}

.me-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.me[data-state='open'] {
  color: var(--heading);
}

.me[data-state='open'] .caret {
  rotate: 180deg;
}

.me .caret {
  flex: none;
}

.menu-rule {
  height: var(--rule-hair);
  margin: var(--space-2xs) var(--space-xs);
  background: var(--line);
}
</style>
