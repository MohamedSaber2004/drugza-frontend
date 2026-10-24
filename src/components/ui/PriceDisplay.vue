<script setup lang="ts">
import { ceilPrice, formatPrice } from '@/utils/price';

withDefaults(
  defineProps<{
    price: number;
    originalPrice?: number;
    currency?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    currency: 'EGP',
    size: 'md'
  }
);
</script>

<template>
  <div class="drugza-price-display" :class="size">
    <div class="current-price-wrap">
      <span class="currency">{{ currency }}</span>
      <span class="amount">{{ formatPrice(price) }}</span>
    </div>
    <span v-if="originalPrice && ceilPrice(originalPrice) > ceilPrice(price)" class="original-price">
      {{ currency }} {{ formatPrice(originalPrice) }}
    </span>
  </div>
</template>

<style scoped>
.drugza-price-display {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
  font-family: var(--font-display);
}

.current-price-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-extrabold);
  line-height: 1;
}

.original-price {
  font-family: var(--font-body);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-decoration: line-through;
  font-weight: var(--font-weight-regular);
}

/* Sizes */
.size-sm .currency {
  font-size: 0.6875rem;
}
.size-sm .amount {
  font-size: 0.9375rem;
}

.size-md .currency {
  font-size: var(--font-size-xs);
}
.size-md .amount {
  font-size: 1.1875rem;
}

.size-lg .currency {
  font-size: var(--font-size-sm);
  color: var(--color-primary-blue);
}
.size-lg .amount {
  font-size: 1.625rem;
}
</style>
