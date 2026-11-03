<script setup lang="ts">
import { Heart, Menu, X } from '@lucide/vue'
import { useWindowScroll } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import HeaderActions from '@/components/layout/HeaderActions.vue'
import HeaderBrand from '@/components/layout/HeaderBrand.vue'
import HeaderNav from '@/components/layout/HeaderNav.vue'
import { useSiteStore } from '@/stores/site'

const { t } = useI18n()
const route = useRoute()
const site = useSiteStore()
const { site: setting } = storeToRefs(site)
const { y } = useWindowScroll()
const menuOpen = ref(false)
const headerEl = useTemplateRef('headerEl')
let headerSize: ResizeObserver | null = null

/* 首页顶部是整幅插画，滚动不到 88px 时页头浮在画面上 */
const overHero = computed(() => route.name === 'timeline' && y.value < 88 && !menuOpen.value)

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
</script>

<template>
  <header ref="headerEl" class="header" :class="{ open: menuOpen, 'over-hero': overHero }">
    <button
      class="backdrop"
      type="button"
      :aria-label="t('header.closeMenu')"
      :tabindex="menuOpen ? 0 : -1"
      :aria-hidden="!menuOpen"
      @click="menuOpen = false"
    />
    <div class="shell bar" :class="{ open: menuOpen }">
      <HeaderBrand :name="setting?.title" />
      <div class="sheet">
        <HeaderNav />
        <HeaderActions @navigate="menuOpen = false" />
      </div>
      <p v-if="setting" class="days">
        <Heart :size="14" />
        {{ t('header.dayCount', { n: setting.daysTogether }) }}
      </p>
      <button
        v-wave
        class="menu"
        type="button"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? t('header.closeMenu') : t('header.openMenu')"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="18" />
        <Menu v-else :size="18" />
      </button>
    </div>
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
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-xs) var(--space-sm);
  min-height: var(--header-bar-min);
  border: 0;
}

.sheet {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: center;
  min-width: 0;
  gap: var(--space-xs) var(--space-sm);
}

.menu,
.backdrop {
  display: none;
}

.days {
  display: inline-flex;
  flex: none;
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
  white-space: nowrap;
}

/* 浮在首页插画上时，页头透明、文字转白 */
.header.over-hero {
  background: transparent;
  border-bottom-color: transparent;

  :deep(.brand-name),
  :deep(nav a),
  :deep(.actions a),
  :deep(.actions button),
  :deep(.menu) {
    color: rgb(255 255 255 / 84%);
  }

  :deep(.brand-mark) {
    filter: invert(1);
  }

  :deep(nav a:hover),
  :deep(.actions a:hover),
  :deep(.actions button:hover),
  :deep(nav a.router-link-active),
  :deep(.actions a.router-link-active),
  :deep(.menu:hover) {
    color: #fff;
  }

  :deep(nav a::after),
  :deep(.actions a::after) {
    background: #fff;
  }

  :deep(.days) {
    background: rgb(255 255 255 / 18%);
    color: #fff;
  }
}

@media (max-width: 980px) {
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

  // 面板里导航和动作都竖过来，点区加高到 44px。
  .sheet :deep(nav),
  .sheet :deep(.actions) {
    flex: none;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  }

  .sheet :deep(nav a),
  .sheet :deep(.actions a),
  .sheet :deep(.actions button) {
    min-height: 44px;
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

@media (max-width: 980px) and (prefers-reduced-motion: reduce) {
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
