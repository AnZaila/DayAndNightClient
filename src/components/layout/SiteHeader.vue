<script setup lang="ts">
import {
  CalendarDays,
  Heart,
  Info,
  LogIn,
  LogOut,
  MessageCircle,
  Milestone,
  Moon,
  PenLine,
  Settings,
  Sun,
} from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { pushToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useSessionStore } from '@/stores/session'
import { useSiteStore } from '@/stores/site'

const router = useRouter()
const session = useSessionStore()
const site = useSiteStore()
const { user } = storeToRefs(session)
const { site: setting } = storeToRefs(site)
const { theme, toggle } = useTheme()

async function logout() {
  await session.logout()
  pushToast('已退出')
  await router.push({ name: 'timeline' })
}
</script>

<template>
  <header class="header">
    <div class="shell bar">
      <RouterLink class="brand" :to="{ name: 'timeline' }">{{ setting?.title || '朝暮' }}</RouterLink>
      <nav>
        <RouterLink :to="{ name: 'timeline' }">
          <Milestone :size="16" />
          时间轴
        </RouterLink>
        <RouterLink :to="{ name: 'anniversaries' }">
          <CalendarDays :size="16" />
          纪念日
        </RouterLink>
        <RouterLink :to="{ name: 'about' }">
          <Info :size="16" />
          关于
        </RouterLink>
      </nav>
      <div class="actions">
        <button
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
          <RouterLink class="btn solid write" :to="{ name: 'write' }">
            <PenLine :size="16" />
            写一笔
          </RouterLink>
          <RouterLink class="me" :to="{ name: 'profile' }">
            <UserAvatar :src="user.avatarUrl" :name="user.displayName" :size="26" />
            {{ user.displayName }}
          </RouterLink>
          <RouterLink :to="{ name: 'settings' }">
            <Settings :size="16" />
            设置
          </RouterLink>
          <RouterLink :to="{ name: 'comments' }">
            <MessageCircle :size="16" />
            评论
          </RouterLink>
          <button type="button" @click="logout">
            <LogOut :size="16" />
            退出
          </button>
        </template>
        <RouterLink v-else :to="{ name: 'login' }">
          <LogIn :size="16" />
          登录
        </RouterLink>
        <p v-if="setting" class="days">
          <Heart :size="14" />
          第 {{ setting.daysTogether }} 天
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--surface);
  box-shadow: 0 6px 18px rgb(148 163 184 / 0.14);
  transition:
    background-color 0.45s ease,
    box-shadow 0.45s ease;
}

.header .shell {
  width: min(1120px, calc(100% - 28px));
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-height: 56px;
}

.brand {
  flex: none;
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--heading);
  white-space: nowrap;
}

nav,
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

nav {
  flex: 1 1 auto;
}

.actions {
  flex: none;
  justify-content: flex-end;
}

nav a,
.actions a,
.actions button,
.theme,
.days,
.write,
.me {
  flex: none;
  white-space: nowrap;
}

nav a,
.actions a,
.actions button,
.theme {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 8px;
  color: var(--muted);
  cursor: pointer;
}

nav a.router-link-active,
.actions a.router-link-active {
  color: var(--primary);
  font-weight: 600;
}

.actions a.write {
  min-height: 36px;
  padding: 0 16px;
  color: var(--on-primary);
  gap: 6px;

  &.router-link-active {
    color: var(--on-primary);
  }
}

.me {
  gap: 6px;
}

.days {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 720px) {
  .bar {
    padding: 8px 0;
  }

  nav,
  .actions {
    flex-basis: 100%;
    justify-content: flex-start;
  }

  nav a,
  .actions a,
  .actions button {
    padding: 0 6px;
    font-size: 13px;
  }
}
</style>
