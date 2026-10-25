<script setup lang="ts">
import { Clock, Globe } from 'lucide-vue-next';
import { useI18n } from '@/composables/useI18n';

const { t, locale, toggleLocale } = useI18n();
</script>

<template>
  <div class="announcement-bar">
    <div class="drugza-container bar-inner">
      <div class="notice-side">
        <span class="pulse-indicator"></span>
        <span class="notice-text">
          {{ t('topBar.medicalNotice') }}
        </span>
      </div>

      <div class="info-side">
        <div class="hours-info">
          <Clock :size="13" />
          <span>{{ t('topBar.deliveryDays') }}</span>
        </div>
        <span class="sep">&bull;</span>
        <button type="button" class="lang-switch-top-btn" @click="toggleLocale">
          <Globe :size="13" />
          <span class="lang-label">{{ t('topBar.switchLanguage') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.announcement-bar {
  background-color: var(--color-deep-blue);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 0;
}

.bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.notice-side {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-accent-yellow);
  box-shadow: 0 0 6px var(--color-accent-yellow);
  flex-shrink: 0;
}

.notice-text {
  font-weight: var(--font-weight-regular);
}

.notice-text strong {
  color: var(--color-accent-yellow);
  font-weight: var(--font-weight-semibold);
}

.info-side {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.hours-info {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.75);
}

.sep {
  color: rgba(255, 255, 255, 0.3);
}

.lang-switch-top-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  border-radius: var(--radius-pill);
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.lang-switch-top-btn:hover {
  background: var(--color-accent-yellow);
  color: var(--color-deep-blue);
  border-color: var(--color-accent-yellow);
}

@media (max-width: 768px) {
  .bar-inner {
    justify-content: center;
  }
  .info-side {
    display: none;
  }
  .notice-side {
    justify-content: center;
    width: 100%;
    text-align: center;
  }
  .notice-text {
    font-size: 0.6875rem;
  }
}
</style>
