<script setup lang="ts">
import { computed } from 'vue';
import { useLoading } from '@/composables/useLoading';

const { loadingProgress, isGlobalLoading } = useLoading();

const isVisible = computed(() => {
  return loadingProgress.value > 0 || isGlobalLoading.value;
});
</script>

<template>
  <Transition name="bar-fade">
    <div
      v-if="isVisible"
      class="global-progress-bar-container"
      role="progressbar"
      :aria-valuenow="Math.round(loadingProgress)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="global-progress-bar-fill"
        :style="{ width: `${loadingProgress}%` }"
      >
        <span class="progress-sheen"></span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.global-progress-bar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(25, 118, 173, 0.08);
  z-index: 999999;
  pointer-events: none;
  overflow: hidden;
}

.global-progress-bar-fill {
  position: relative;
  height: 100%;
  background: var(--gradient-brand);
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
  transition: width 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
  box-shadow: 0 0 10px rgba(20, 184, 166, 0.55);
  overflow: hidden;
}

.progress-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: bar-sheen 1.2s ease-in-out infinite;
}

[dir="rtl"] .global-progress-bar-fill {
  border-radius: var(--radius-pill) 0 0 var(--radius-pill);
}

@keyframes bar-sheen {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.bar-fade-enter-active,
.bar-fade-leave-active {
  transition: opacity 0.25s ease;
}

.bar-fade-enter-from,
.bar-fade-leave-to {
  opacity: 0;
}
</style>
