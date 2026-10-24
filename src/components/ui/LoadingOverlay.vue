<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';

interface Props {
  loading: boolean;
  text?: string;
  subtext?: string;
  blur?: boolean | string | number;
  transparent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullContainer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  blur: true,
  transparent: false,
  size: 'md',
  fullContainer: false
});

const { locale } = useI18n();

const defaultText = computed(() => {
  if (props.text) return props.text;
  return locale.value === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...';
});

const blurAmount = computed(() => {
  if (props.blur === false) return 'none';
  if (props.blur === true) return '6px';
  if (typeof props.blur === 'number') return `${props.blur}px`;
  return props.blur;
});

const spinnerSizePx = computed(() => {
  switch (props.size) {
    case 'sm': return '28px';
    case 'lg': return '52px';
    default: return '40px';
  }
});
</script>

<template>
  <div class="loading-overlay-wrapper" :class="{ 'is-loading-active': loading, 'is-full-container': fullContainer }">
    <!-- Slot content with blur filter when loading -->
    <div
      class="loading-target-slot"
      :style="loading && blurAmount !== 'none' ? { filter: `blur(${blurAmount})` } : {}"
    >
      <slot />
    </div>

    <!-- Frosted Glass Loading Overlay -->
    <Transition name="overlay-fade">
      <div
        v-if="loading"
        class="loading-glass-overlay"
        :class="{ 'is-transparent': transparent, [`size-${size}`]: true }"
        role="status"
        aria-busy="true"
        :aria-label="defaultText"
      >
        <div class="loader-content-card">
          <!-- Branded Dual Ring Animated Spinner -->
          <div class="spinner-box" :style="{ width: spinnerSizePx, height: spinnerSizePx }">
            <div class="spinner-ring outer-ring"></div>
            <div class="spinner-ring inner-ring"></div>
            <div class="spinner-core-dot"></div>
          </div>

          <!-- Loading Label -->
          <span v-if="defaultText" class="loading-label-text">
            {{ defaultText }}
          </span>

          <span v-if="subtext" class="loading-subtext">
            {{ subtext }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.loading-overlay-wrapper {
  position: relative;
  width: 100%;
}

.loading-overlay-wrapper.is-full-container {
  height: 100%;
  min-height: 180px;
}

.loading-target-slot {
  width: 100%;
  transition: filter 0.24s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.24s ease;
}

.loading-overlay-wrapper.is-loading-active .loading-target-slot {
  pointer-events: none;
  user-select: none;
  opacity: 0.72;
}

/* Frosted Glass Overlay */
.loading-glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-radius: inherit;
  z-index: 50;
  padding: 16px;
  box-sizing: border-box;
}

.loading-glass-overlay.is-transparent {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.loader-content-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(229, 234, 240, 0.85);
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 10px 25px -5px rgba(18, 73, 107, 0.12), 0 8px 10px -6px rgba(18, 73, 107, 0.08);
  max-width: 90%;
  text-align: center;
}

/* Spinner Box & Rings */
.spinner-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  border-radius: 50%;
  box-sizing: border-box;
}

.spinner-ring.outer-ring {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid rgba(25, 118, 173, 0.15);
  border-top-color: #1976AD;
  border-right-color: #14B8A6;
  animation: drugza-spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}

.spinner-ring.inner-ring {
  top: 18%;
  left: 18%;
  width: 64%;
  height: 64%;
  border: 2.5px solid rgba(243, 206, 121, 0.2);
  border-bottom-color: #F3CE79;
  border-left-color: #14B8A6;
  animation: drugza-spin-reverse 1.2s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}

.spinner-core-dot {
  width: 6px;
  height: 6px;
  background: #1976AD;
  border-radius: 50%;
  box-shadow: 0 0 8px #14B8A6;
  animation: drugza-pulse-dot 1.4s ease-in-out infinite;
}

/* Text */
.loading-label-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #12496B;
  letter-spacing: -0.01em;
}

.loading-subtext {
  font-size: 0.75rem;
  color: #64748B;
  margin-top: -6px;
}

/* Size Variants */
.size-sm .loader-content-card {
  padding: 10px 16px;
  gap: 8px;
}
.size-sm .loading-label-text {
  font-size: 0.8125rem;
}

.size-lg .loader-content-card {
  padding: 24px 32px;
  gap: 16px;
}
.size-lg .loading-label-text {
  font-size: 1rem;
}

/* Keyframes */
@keyframes drugza-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes drugza-spin-reverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

@keyframes drugza-pulse-dot {
  0%, 100% {
    transform: scale(0.85);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

/* Transition */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.22s ease-out;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
