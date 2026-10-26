<script setup lang="ts">
import {
  CalendarDays,
  ChartColumn,
  Heart,
  Info,
  LogIn,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  Milestone,
  Moon,
  PenLine,
  Settings,
  Sun,
  X,
} from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pushToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSessionStore } from '@/stores/session'
import { useSiteStore } from '@/stores/site'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const site = useSiteStore()
const { user } = storeToRefs(session)
const { site: setting } = storeToRefs(site)
const { theme, toggle } = useTheme()
const logoutOpen = ref(false)
const menuOpen = ref(false)
const headerEl = useTemplateRef('headerEl')
let headerSize: ResizeObserver | null = null

onMounted(() => {
  const el = headerEl.value
  if (!el) return
  const apply = () => {
    document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`)
  }
  headerSize = new ResizeObserver(apply)
  headerSize.observe(el)
  apply()
})

onBeforeUnmount(() => {
  headerSize?.disconnect()
  document.documentElement.style.removeProperty('--header-height')
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

function askLogout() {
  menuOpen.value = false
  logoutOpen.value = true
}

async function logout() {
  await session.logout()
  pushToast('已退出')
  await router.push({ name: 'timeline' })
}
</script>

<template>
  <header ref="headerEl" class="header" :class="{ open: menuOpen }">
    <button
      class="backdrop"
      type="button"
      aria-label="关闭菜单"
      :tabindex="menuOpen ? 0 : -1"
      :aria-hidden="!menuOpen"
      @click="menuOpen = false"
    />
    <div class="shell bar" :class="{ open: menuOpen }">
      <WaveLink class="brand" :to="{ name: 'timeline' }">{{ setting?.title || '朝暮' }}</WaveLink>
      <div class="sheet">
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
          <WaveLink :to="{ name: 'stats' }">
            <ChartColumn :size="16" />
            统计
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
            <button v-wave type="button" @click="askLogout">
              <LogOut :size="16" />
              退出
            </button>
          </template>
          <WaveLink v-else :to="{ name: 'login' }">
            <LogIn :size="16" />
            登录
          </WaveLink>
        </div>
      </div>
      <p v-if="setting" class="days">
        <Heart :size="14" />
        第 {{ setting.daysTogether }} 天
      </p>
      <button
        v-wave
        class="menu"
        type="button"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? '关闭菜单' : '打开菜单'"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="18" />
        <Menu v-else :size="18" />
      </button>
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
  z-index: var(--z-sticky);
  background: var(--surface);
  border-bottom: var(--rule-hair) solid var(--line);
  transition: background-color var(--dur-long) var(--ease-out);
}

.header .shell {
  width: min(var(--container), calc(100% - var(--space-lg) - var(--space-2xs)));
}

.bar {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-sm);
  min-height: var(--header-bar-min);
  border: 0;
}

.sheet {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-sm);
  min-width: 0;
}

.menu,
.backdrop {
  display: none;
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
  gap: var(--space-xs);
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
.days,
.me,
.theme {
  flex: none;
  white-space: nowrap;
}

nav a,
.actions a,
.actions button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 36px;
  padding: 0 var(--space-xs);
  color: var(--muted);
  cursor: pointer;
  transition:
    color var(--dur-short) var(--ease-out),
    transform var(--dur-micro) var(--ease-out);

  &:hover {
    color: var(--heading);
  }
}

nav a,
.actions a {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: var(--space-xs);
    bottom: 0;
    left: var(--space-xs);
    height: 2px;
    background: var(--primary);
    transform: scaleX(0);
    transform-origin: left center;
    pointer-events: none;
    transition: transform var(--dur-short) var(--ease-out);
  }
}

nav a.router-link-active,
.actions a.router-link-active {
  color: var(--primary);
  font-weight: 600;

  &::after {
    transform: scaleX(1);
  }
}

.me {
  gap: var(--space-xs);
}

.days {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin: 0;
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-pill);
  background: var(--primary-soft);
  color: var(--primary);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 720px) {
  .header .shell {
    width: min(var(--container), calc(100% - var(--space-md) - var(--space-2xs)));
  }

  .days {
    margin-left: auto;
  }

  .menu {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius);
    color: var(--heading);
    cursor: pointer;
  }

  .sheet {
    display: flex;
    visibility: hidden;
    position: absolute;
    top: 100%;
    right: -10px;
    left: -10px;
    z-index: 1;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2xs);
    max-height: calc(100dvh - 64px);
    padding: var(--space-xs) var(--space-sm) var(--space-md);
    overflow: auto;
    background: var(--surface);
    border-bottom: var(--rule-hair) solid var(--line);
    opacity: 0;
    translate: 0 -10px;
    scale: 0.98;
    transform-origin: 50% 0;
    pointer-events: none;
    transition:
      opacity var(--dur-short) var(--ease-out),
      translate var(--dur-short) var(--ease-out),
      scale var(--dur-short) var(--ease-out),
      visibility 0s linear var(--dur-short);
  }

  .bar.open .sheet {
    visibility: visible;
    opacity: 1;
    translate: 0 0;
    scale: 1;
    pointer-events: auto;
    transition:
      opacity var(--dur-short) var(--ease-out),
      translate var(--dur-short) var(--ease-out),
      scale var(--dur-short) var(--ease-out),
      visibility 0s linear 0s;
  }

  nav,
  .actions {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  }

  nav a,
  .actions a,
  .actions button,
  .theme {
    min-height: 44px;
    padding: 0 var(--space-xs);
    font-size: 15px;
  }

  .backdrop {
    display: block;
    visibility: hidden;
    position: fixed;
    inset: 0;
    z-index: 0;
    background: color-mix(in oklab, var(--color-ink) 28%, transparent);
    opacity: 0;
    pointer-events: none;
    cursor: pointer;
    transition:
      opacity var(--dur-short) var(--ease-out),
      visibility 0s linear var(--dur-short);
  }

  .header.open .backdrop {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    transition:
      opacity var(--dur-short) var(--ease-out),
      visibility 0s linear 0s;
  }
}

@media (max-width: 720px) and (prefers-reduced-motion: reduce) {
  .sheet,
  .bar.open .sheet,
  .backdrop,
  .header.open .backdrop {
    transition: none;
  }

  .sheet {
    translate: none;
    scale: none;
  }
}
</style>
