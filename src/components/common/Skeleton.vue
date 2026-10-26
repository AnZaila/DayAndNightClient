<script setup lang="ts">
import { computed } from 'vue'
import SkeletonBone from '@/components/common/SkeletonBone.vue'

const props = withDefaults(
  defineProps<{
    preset:
      | 'timeline'
      | 'comment'
      | 'detail'
      | 'note'
      | 'anniversary'
      | 'about'
      | 'fields'
      | 'editor'
      | 'map'
    count?: number
  }>(),
  { count: 1 },
)

const rows = computed(() => Array.from({ length: Math.max(props.count, 1) }, (_, index) => index))
</script>

<template>
  <div class="block" :class="preset" role="status" aria-busy="true">
    <span class="sr-only">正在加载</span>
    <template v-if="preset === 'timeline'">
      <div v-for="row in rows" :key="row" class="timeline">
        <div class="rail">
          <SkeletonBone width="36px" height="12px" />
          <SkeletonBone width="52px" height="12px" />
          <SkeletonBone width="12px" height="12px" circle />
        </div>
        <article class="card piece side">
          <SkeletonBone class="shot" width="132px" height="100px" radius="12px" />
          <div class="lines">
            <SkeletonBone width="42%" height="12px" />
            <SkeletonBone height="14px" />
            <SkeletonBone width="68%" height="14px" />
            <div class="byline">
              <SkeletonBone width="22px" height="22px" circle />
              <SkeletonBone width="56px" height="12px" />
            </div>
          </div>
        </article>
      </div>
    </template>
    <template v-else-if="preset === 'comment'">
      <div v-for="row in rows" :key="row" class="person">
        <SkeletonBone width="36px" height="36px" circle />
        <div class="lines">
          <SkeletonBone width="72px" height="12px" />
          <SkeletonBone height="14px" />
          <SkeletonBone width="42%" height="12px" />
        </div>
      </div>
    </template>
    <template v-else-if="preset === 'detail'">
      <article class="card piece">
        <div class="person">
          <SkeletonBone width="42px" height="42px" circle />
          <div class="lines">
            <SkeletonBone width="168px" height="18px" />
            <SkeletonBone width="148px" height="12px" />
          </div>
        </div>
        <SkeletonBone height="220px" radius="12px" />
        <SkeletonBone height="14px" />
        <SkeletonBone width="90%" height="14px" />
        <SkeletonBone width="64%" height="14px" />
      </article>
      <article class="card piece">
        <SkeletonBone width="56px" height="18px" />
        <div class="person">
          <SkeletonBone width="36px" height="36px" circle />
          <div class="lines">
            <SkeletonBone width="72px" height="12px" />
            <SkeletonBone height="14px" />
          </div>
        </div>
        <div class="person">
          <SkeletonBone width="36px" height="36px" circle />
          <div class="lines">
            <SkeletonBone width="64px" height="12px" />
            <SkeletonBone width="80%" height="14px" />
          </div>
        </div>
      </article>
    </template>
    <template v-else-if="preset === 'note' || preset === 'anniversary'">
      <div v-for="row in rows" :key="row" class="note">
        <div class="lines">
          <SkeletonBone width="120px" height="14px" />
          <SkeletonBone width="46%" height="12px" />
        </div>
        <SkeletonBone width="64px" height="32px" radius="12px" />
      </div>
    </template>
    <template v-else-if="preset === 'about'">
      <article class="card piece">
        <SkeletonBone width="72px" height="12px" />
        <SkeletonBone width="140px" height="32px" />
        <SkeletonBone width="180px" height="20px" />
        <SkeletonBone height="14px" />
        <SkeletonBone width="78%" height="14px" />
        <SkeletonBone width="108px" height="38px" radius="12px" />
      </article>
    </template>
    <template v-else-if="preset === 'fields'">
      <article class="card piece">
        <SkeletonBone width="72px" height="22px" />
        <SkeletonBone height="40px" radius="12px" />
        <SkeletonBone height="40px" radius="12px" />
        <SkeletonBone height="120px" radius="12px" />
        <SkeletonBone width="96px" height="38px" radius="12px" />
      </article>
    </template>
    <template v-else-if="preset === 'editor'">
      <SkeletonBone height="220px" radius="12px" />
    </template>
    <template v-else>
      <SkeletonBone class="map-bone" grow radius="18px" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.piece {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &.side {
    flex-direction: row;
    align-items: center;
  }
}

.shot {
  flex: none;
}

@media (max-width: 640px) {
  .shot {
    width: 92px !important;
    height: 76px !important;
  }
}

.timeline {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 14px;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 18px;
}

.person,
.byline,
.note {
  display: flex;
  gap: 10px;
}

.person {
  align-items: flex-start;
}

.byline,
.note {
  align-items: center;
}

.lines {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.note {
  justify-content: space-between;
}

.map {
  flex: 1;
  min-height: 70vh;
}

.map :deep(.map-bone) {
  flex: 1;
  width: 100%;
  min-height: inherit;
}

@media (max-width: 640px) {
  .timeline {
    grid-template-columns: 4.6rem minmax(0, 1fr);
    gap: 10px;
  }
}
</style>
