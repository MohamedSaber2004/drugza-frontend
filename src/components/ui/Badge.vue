<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'success' | 'discount' | 'info' | 'warning' | 'neutral' | 'danger';
    size?: 'sm' | 'md';
    pill?: boolean;
  }>(),
  {
    variant: 'info',
    size: 'sm',
    pill: true
  }
);
</script>

<template>
  <span
    class="drugza-badge"
    :class="[`variant-${variant}`, `size-${size}`, { 'is-pill': pill }]"
  >
    <slot />
  </span>
</template>

<style scoped>
.drugza-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.015em;
  line-height: 1;
  white-space: nowrap;
  gap: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.drugza-badge.is-pill {
  border-radius: var(--radius-pill);
}

.size-sm {
  font-size: 0.6875rem;
  padding: 2px 8px;
  height: 20px;
}

.size-md {
  font-size: var(--font-size-xs);
  padding: 4px 10px;
  height: 24px;
}

/* Variants */
.variant-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid rgba(22, 160, 133, 0.2);
}

.variant-discount {
  background-color: #FEF3F2;
  color: #B42318;
  border: 1px solid rgba(220, 91, 97, 0.25);
  font-weight: var(--font-weight-bold);
}

.variant-danger {
  background-color: #FEF3F2;
  color: #B42318;
  border: 1px solid rgba(220, 91, 97, 0.25);
  font-weight: var(--font-weight-bold);
}

.variant-info {
  background-color: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  border: 1px solid rgba(25, 118, 173, 0.2);
}

.variant-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
  border: 1px solid rgba(230, 126, 34, 0.25);
}

.variant-neutral {
  background-color: var(--color-off-white);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
</style>
