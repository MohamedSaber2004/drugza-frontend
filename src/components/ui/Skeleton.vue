<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'text' | 'rect' | 'rectangular' | 'circle' | 'circular' | 'rounded' | 'card';
  width?: string | number;
  height?: string | number;
  radius?: string;
  circle?: boolean;
  rounded?: boolean;
  count?: number;
  animation?: 'shimmer' | 'pulse' | 'none';
  tag?: string;
  aspectRatio?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  count: 1,
  animation: 'shimmer',
  tag: 'div',
});

function formatDimension(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

const isCircular = computed(() => {
  return props.circle || props.variant === 'circle' || props.variant === 'circular';
});

const isRounded = computed(() => {
  return props.rounded || props.variant === 'rounded';
});

const skeletonStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.width) {
    style.width = formatDimension(props.width)!;
  }

  if (props.height) {
    style.height = formatDimension(props.height)!;
  } else if (isCircular.value && props.width) {
    style.height = formatDimension(props.width)!;
  }

  if (props.radius) {
    style.borderRadius = props.radius;
  } else if (isCircular.value) {
    style.borderRadius = '50%';
  } else if (isRounded.value) {
    style.borderRadius = '9999px';
  }

  if (props.aspectRatio) {
    style.aspectRatio = props.aspectRatio;
  }

  return style;
});

const skeletonClasses = computed(() => [
  'drugza-skeleton',
  `drugza-skeleton--${props.variant}`,
  `drugza-skeleton--anim-${props.animation}`,
  {
    'drugza-skeleton--circle': isCircular.value,
    'drugza-skeleton--pill': isRounded.value,
  }
]);
</script>

<template>
  <div v-if="count > 1" class="drugza-skeleton-group" role="status" aria-busy="true" aria-label="Loading...">
    <component
      :is="tag"
      v-for="i in count"
      :key="i"
      :class="skeletonClasses"
      :style="skeletonStyle"
      aria-hidden="true"
    />
  </div>
  <component
    :is="tag"
    v-else
    :class="skeletonClasses"
    :style="skeletonStyle"
    role="status"
    aria-busy="true"
    aria-label="Loading..."
  />
</template>

<style scoped>
.drugza-skeleton-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.drugza-skeleton {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #E9F0F7 0%, #F3F7FB 50%, #E9F0F7 100%);
  border-radius: var(--radius-md, 12px);
  display: block;
  user-select: none;
  pointer-events: none;
}

/* Variant defaults */
.drugza-skeleton--text {
  height: 14px;
  width: 100%;
  border-radius: 6px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.drugza-skeleton--rect,
.drugza-skeleton--rectangular {
  width: 100%;
  height: 120px;
  border-radius: var(--radius-md, 12px);
}

.drugza-skeleton--card {
  width: 100%;
  height: 220px;
  border-radius: var(--radius-lg, 16px);
  border: 1px solid rgba(229, 234, 240, 0.6);
}

.drugza-skeleton--circle {
  width: 44px;
  height: 44px;
  border-radius: 50% !important;
  flex-shrink: 0;
}

.drugza-skeleton--pill {
  border-radius: 9999px !important;
}

/* Animation: Shimmer */
.drugza-skeleton--anim-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.72) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-100%);
  animation: drugza-shimmer 1.45s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  will-change: transform;
}

/* Animation: Pulse */
.drugza-skeleton--anim-pulse {
  animation: drugza-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes drugza-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes drugza-shimmer-rtl {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes drugza-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* RTL Support */
:global([dir="rtl"] .drugza-skeleton--anim-shimmer::after) {
  animation-name: drugza-shimmer-rtl;
}

/* Accessibility: Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .drugza-skeleton--anim-shimmer::after {
    animation: none;
    display: none;
  }
  .drugza-skeleton--anim-pulse {
    animation: none;
  }
}
</style>
