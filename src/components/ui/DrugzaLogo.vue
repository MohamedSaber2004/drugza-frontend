<script setup lang="ts">
import logoUrl from '@/assets/brand/drugza-logo.jpg';

withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showTagline?: boolean;
    inverse?: boolean;
  }>(),
  {
    size: 'md',
    showTagline: false,
    inverse: false
  }
);
</script>

<template>
  <div class="drugza-logo-container" :class="[size, { 'is-inverse': inverse }]">
    <span class="drugza-brand-badge">
      <img
        :src="logoUrl"
        alt="Drugza"
        class="drugza-brand-img"
      />
    </span>

    <div v-if="showTagline" class="drugza-text-group">
      <span class="drugza-brand-tagline">
        Your Trusted Pharmacy Marketplace
      </span>
    </div>
  </div>
</template>

<style scoped>
.drugza-logo-container {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  user-select: none;
  text-decoration: none;
  font-family: var(--font-display);
}

.drugza-brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border: 1px solid rgba(18, 73, 107, 0.08);
  box-shadow:
    0 2px 6px rgba(18, 73, 107, 0.10),
    0 6px 16px rgba(18, 73, 107, 0.12);
  overflow: hidden;
  flex-shrink: 0;
  transition:
    transform var(--dur-base) var(--ease-smooth),
    box-shadow var(--dur-base) var(--ease-smooth);
}

.drugza-brand-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.drugza-logo-container:hover .drugza-brand-badge {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 4px 10px rgba(18, 73, 107, 0.16),
    0 12px 28px rgba(25, 118, 173, 0.28);
}

.drugza-text-group {
  display: flex;
  flex-direction: column;
}

.drugza-brand-tagline {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  letter-spacing: 0.01em;
  margin-top: 2px;
}

/* Sizes */
.drugza-logo-container.sm .drugza-brand-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.drugza-logo-container.md .drugza-brand-badge {
  width: 46px;
  height: 46px;
  border-radius: 13px;
}

.drugza-logo-container.lg .drugza-brand-badge {
  width: 60px;
  height: 60px;
  border-radius: 16px;
}

.drugza-logo-container.xl .drugza-brand-badge {
  width: 88px;
  height: 88px;
  border-radius: 22px;
}

/* Inverted style (e.g. on dark headers, footers or showcase panels) */
.drugza-logo-container.is-inverse .drugza-brand-badge {
  border: 2px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.25),
    0 10px 24px rgba(0, 0, 0, 0.30);
}

.drugza-logo-container.is-inverse .drugza-brand-tagline {
  color: rgba(255, 255, 255, 0.78);
}
</style>
