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
import { useRouter } from 'vue-router'
import { pushToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useSessionStore } from '@/stores/session'

type MenuRoute = 'profile' | 'comments' | 'settings'

const emit = defineEmits<{ navigate: [] }>()

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
  pushToast('已退出')
  await router.push({ name: 'timeline' })
}
</script>

<template>
  <template v-if="user">
    <DropdownMenuRoot>
      <DropdownMenuTrigger as-child>
        <button v-wave type="button" class="me" :aria-label="`${user.displayName} 的账户菜单`">
          <UserAvatar :src="user.avatarUrl" :name="user.displayName" :size="26" />
          <span class="me-name">{{ user.displayName }}</span>
          <ChevronDown class="caret" :size="14" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="soft-menu more-menu" align="end" :side-offset="8">
          <DropdownMenuItem class="soft-item" @select="go('profile')">
            <User :size="16" />
            个人主页
          </DropdownMenuItem>
          <DropdownMenuItem class="soft-item" @select="go('comments')">
            <MessageCircle :size="16" />
            评论管理
          </DropdownMenuItem>
          <DropdownMenuItem class="soft-item" @select="go('settings')">
            <Settings :size="16" />
            设置
          </DropdownMenuItem>
          <DropdownMenuSeparator class="menu-rule" />
          <DropdownMenuItem class="soft-item" @select="askLogout">
            <LogOut :size="16" />
            退出
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
    <ConfirmDialog
      v-model:open="logoutOpen"
      title="退出登录？"
      description="退出之后，写和改都要重新登录。"
      confirm-label="退出"
      cancel-label="取消"
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
