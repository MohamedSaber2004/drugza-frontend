<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'cta' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    block?: boolean;
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'primary',
    size: 'md',
    block: false,
    loading: false,
    disabled: false,
    type: 'button'
  }
);
</script>

<template>
  <button
    :type="type"
    class="drugza-btn"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      { 'is-block': block, 'is-loading': loading }
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <span class="btn-content" :class="{ 'is-hidden-vis': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.drugza-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: var(--font-body);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.01em;
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition:
    background-color var(--dur-fast) var(--ease-smooth),
    border-color var(--dur-fast) var(--ease-smooth),
    color var(--dur-fast) var(--ease-smooth),
    box-shadow var(--dur-fast) var(--ease-smooth),
    transform var(--dur-fast) var(--ease-smooth);
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
}

.drugza-btn.is-block {
  width: 100%;
}

/* Sizes */
.size-sm {
  height: 34px;
  padding: 0 var(--space-xs);
  font-size: var(--font-size-xs);
  gap: var(--space-2xs);
}

.size-md {
  height: 42px;
  padding: 0 var(--space-md);
  font-size: var(--font-size-sm);
  gap: var(--space-2xs);
}

.size-lg {
  height: 50px;
  padding: 0 var(--space-lg);
  font-size: var(--font-size-base);
  gap: var(--space-xs);
  border-radius: var(--radius-md);
}

/* Variant: Primary (Drugza Blue) */
.variant-primary {
  background-color: var(--color-primary-blue);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 55%);
  color: #FFFFFF;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 1px 2px rgba(18, 73, 107, 0.12);
}
.variant-primary:hover:not(:disabled) {
  background-color: var(--color-primary-blue-hover);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), var(--shadow-brand);
  transform: translateY(-1px);
}
.variant-primary:active:not(:disabled) {
  background-color: var(--color-primary-blue-active);
  transform: translateY(0) scale(0.985);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* Variant: CTA (Warm Yellow Accent for Buy/Shop/Checkout) */
.variant-cta {
  background-color: var(--color-accent-yellow);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 55%);
  color: #4A3410;
  font-weight: var(--font-weight-bold);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 8px rgba(243, 206, 121, 0.32);
}
.variant-cta:hover:not(:disabled) {
  background-color: var(--color-accent-yellow-hover);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 6px 18px rgba(243, 206, 121, 0.45);
  transform: translateY(-1px);
}
.variant-cta:active:not(:disabled) {
  background-color: var(--color-accent-yellow-active);
  transform: translateY(0) scale(0.985);
}

/* Variant: Secondary (Pale Blue Surface) */
.variant-secondary {
  background-color: var(--color-pale-blue);
  color: var(--color-primary-blue);
  border-color: var(--color-border);
}
.variant-secondary:hover:not(:disabled) {
  background-color: var(--color-primary-blue-light);
  border-color: var(--color-primary-blue);
}

/* Variant: Outline */
.variant-outline {
  background-color: #FFFFFF;
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
.variant-outline:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  border-color: var(--color-primary-blue);
  color: var(--color-primary-blue);
}

/* Variant: Ghost */
.variant-ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}
.variant-ghost:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  color: var(--color-primary-blue);
}

/* Variant: Danger */
.variant-danger {
  background-color: var(--color-error-bg);
  color: var(--color-error);
  border-color: rgba(220, 91, 97, 0.3);
}
.variant-danger:hover:not(:disabled) {
  background-color: var(--color-error);
  color: #FFFFFF;
}

/* States */
.drugza-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.drugza-btn:disabled,
.drugza-btn[disabled],
.drugza-btn.is-disabled {
  opacity: 1;
  cursor: not-allowed !important;
  pointer-events: none !important;
  transform: none !important;
  background: #E8EDF3 !important;
  background-image: none !important;
  color: #94A3B8 !important;
  border-color: #E2E8F0 !important;
  box-shadow: none !important;
}

/* Spinner */
.spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.85;
  animation: spin 0.65s linear infinite;
}

.btn-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: inherit;
}

.is-hidden-vis {
  visibility: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
