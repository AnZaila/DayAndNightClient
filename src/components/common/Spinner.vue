<template>
  <span class="spin" aria-hidden="true" />
</template>

<style scoped lang="scss">
.spin {
  display: inline-block;
  flex: none;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
    border-right-color: currentColor;
    opacity: 0.7;
  }
}
</style>
