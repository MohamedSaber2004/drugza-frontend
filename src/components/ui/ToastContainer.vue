<script setup lang="ts">
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="toast-wrapper" aria-live="polite">
    <TransitionGroup name="toast-anim" tag="div" class="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="`toast-${toast.type}`"
      >
        <div class="toast-icon">
          <CheckCircle2 v-if="toast.type === 'success'" :size="18" />
          <AlertCircle v-else-if="toast.type === 'error'" :size="18" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="18" />
          <Info v-else :size="18" />
        </div>

        <div class="toast-body">
          <h5 v-if="toast.title" class="toast-title">{{ toast.title }}</h5>
          <p class="toast-message">{{ toast.message }}</p>
        </div>

        <button
          type="button"
          class="toast-close"
          @click="dismiss(toast.id)"
          aria-label="Dismiss notification"
        >
          <X :size="15" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  left: auto;
  z-index: 9999;
  pointer-events: none;
}

[dir="rtl"] .toast-wrapper {
  right: auto;
  left: 24px;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  align-items: flex-end;
}

[dir="rtl"] .toast-list {
  align-items: flex-start;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  border-inline-start-width: 3px;
  min-width: 300px;
  max-width: 420px;
}

.toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-off-white);
  margin-top: 1px;
}

.toast-body {
  flex-grow: 1;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.25;
  margin-bottom: 2px;
}

.toast-message {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.toast-close {
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px;
}

.toast-close:hover {
  color: var(--color-deep-blue);
}

/* Types */
.toast-success {
  border-inline-start-color: var(--color-success);
}
.toast-success .toast-icon {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.toast-error {
  border-inline-start-color: var(--color-error);
}
.toast-error .toast-icon {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.toast-warning {
  border-inline-start-color: var(--color-warning);
}
.toast-warning .toast-icon {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.toast-info {
  border-inline-start-color: var(--color-primary-blue);
}
.toast-info .toast-icon {
  color: var(--color-primary-blue);
  background: var(--color-primary-blue-light);
}

/* Transition animations */
.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-anim-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.toast-anim-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

[dir="rtl"] .toast-anim-leave-to {
  transform: translateX(-30px);
}

@media (max-width: 480px) {
  .toast-wrapper {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }

  [dir="rtl"] .toast-wrapper {
    left: 12px;
    right: 12px;
  }

  .toast-list {
    align-items: stretch;
  }

  .toast-card {
    min-width: 0;
    width: 100%;
    max-width: none;
  }
}
</style>
