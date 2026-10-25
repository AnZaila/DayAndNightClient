<script setup lang="ts">
import { computed } from 'vue'
import { parseDate, type DateValue } from '@internationalized/date'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'

const model = defineModel<string>({ required: true })

const date = computed<DateValue | undefined>({
  get() {
    if (!model.value) return undefined
    try {
      return parseDate(model.value)
    } catch {
      return undefined
    }
  },
  set(value) {
    model.value = value ? value.toString() : ''
  },
})

const label = computed(() => {
  const value = date.value
  if (!value) return '选择日期'
  return `${value.year}年${value.month}月${value.day}日`
})
</script>

<template>
  <div class="picker">
    <DatePickerRoot
      v-model="date"
      locale="zh-CN"
      :week-starts-on="1"
      prevent-deselect
      close-on-select
    >
      <DatePickerTrigger as-child>
        <button type="button" class="soft-trigger" :data-empty="model ? undefined : ''">
          <span class="soft-value">{{ label }}</span>
          <svg class="soft-chevron" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2.5" y="3.5" width="11" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </DatePickerTrigger>
      <DatePickerContent class="soft-calendar" :side-offset="8">
        <DatePickerCalendar v-slot="{ weekDays, grid }">
          <DatePickerHeader class="soft-cal-header">
            <DatePickerPrev as-child>
              <button type="button" class="soft-cal-nav" aria-label="上个月">‹</button>
            </DatePickerPrev>
            <DatePickerHeading class="soft-cal-heading" />
            <DatePickerNext as-child>
              <button type="button" class="soft-cal-nav" aria-label="下个月">›</button>
            </DatePickerNext>
          </DatePickerHeader>
          <DatePickerGrid v-for="month in grid" :key="month.value.toString()">
            <DatePickerGridHead>
              <DatePickerGridRow>
                <DatePickerHeadCell v-for="day in weekDays" :key="day">{{ day }}</DatePickerHeadCell>
              </DatePickerGridRow>
            </DatePickerGridHead>
            <DatePickerGridBody>
              <DatePickerGridRow v-for="(week, index) in month.rows" :key="`${month.value.toString()}-${index}`">
                <DatePickerCell v-for="day in week" :key="day.toString()" :date="day">
                  <DatePickerCellTrigger as-child :day="day" :month="month.value">
                    <button type="button" class="soft-cal-day">{{ day.day }}</button>
                  </DatePickerCellTrigger>
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>
  </div>
</template>

<style scoped lang="scss">
.picker {
  position: relative;
  width: 100%;
  min-width: 0;
}
</style>
