<script setup lang="ts">
import { CalendarDays, Heart, Info, LogIn, LogOut, Map, MessageCircle, Milestone, Moon, PenLine, Settings, Sun } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pushToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSessionStore } from '@/stores/session'
import { useSiteStore } from '@/stores/site'

const router = useRouter()
const session = useSessionStore()
const site = useSiteStore()
const { user } = storeToRefs(session)
const { site: setting } = storeToRefs(site)
const { theme, toggle } = useTheme()
const logoutOpen = ref(false)

async function logout() {
  await session.logout()
  pushToast('已退出')
  await router.push({ name: 'timeline' })
}
</script>

<template>
  <header class="header">
    <div class="shell bar">
      <WaveLink class="brand" :to="{ name: 'timeline' }">{{ setting?.title || '朝暮' }}</WaveLink>
      <nav>
        <WaveLink :to="{ name: 'timeline' }">
          <Milestone :size="16" />
          时间轴
        </WaveLink>
        <WaveLink :to="{ name: 'map' }">
          <Map :size="16" />
          地图
        </WaveLink>
        <WaveLink :to="{ name: 'anniversaries' }">
          <CalendarDays :size="16" />
          纪念日
        </WaveLink>
        <WaveLink :to="{ name: 'about' }">
          <Info :size="16" />
          关于
        </WaveLink>
      </nav>
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
          <WaveLink :to="{ name: 'comments' }">
            <MessageCircle :size="16" />
            评论管理
          </WaveLink>
          <WaveLink class="me" :to="{ name: 'profile' }">
            <UserAvatar :src="user.avatarUrl" :name="user.displayName" :size="26" />
            {{ user.displayName }}
          </WaveLink>
          <WaveLink :to="{ name: 'settings' }">
            <Settings :size="16" />
            设置
          </WaveLink>
          <button v-wave type="button" @click="logoutOpen = true">
            <LogOut :size="16" />
            退出
          </button>
        </template>
        <WaveLink v-else :to="{ name: 'login' }">
          <LogIn :size="16" />
          登录
        </WaveLink>
        <p v-if="setting" class="days">
          <Heart :size="14" />
          第 {{ setting.daysTogether }} 天
        </p>
      </div>
    </div>
    <ConfirmDialog
      v-model:open="logoutOpen"
      title="退出登录？"
      description="退出之后，写和改都要重新登录。"
      confirm-label="退出"
      cancel-label="取消"
      @confirm="logout"
    />
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
