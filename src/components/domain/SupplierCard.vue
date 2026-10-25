<script setup lang="ts">
import { Building2, Star, Clock, CheckCircle } from 'lucide-vue-next';
import type { Supplier } from '@/types';
import Button from '@/components/ui/Button.vue';
import { useI18n } from '@/composables/useI18n';
import { onImageError } from '@/utils/placeholders';

const { t, locale } = useI18n();

defineProps<{
  supplier: Supplier;
}>();

const emit = defineEmits<{
  (e: 'select', supplier: Supplier): void;
}>();
</script>

<template>
  <div class="drugza-supplier-card" @click="emit('select', supplier)">
    <div class="supplier-header">
      <div class="logo-box">
        <img
          v-if="supplier.profileImage"
          :src="supplier.profileImage"
          :alt="supplier.businessName"
          class="supplier-logo"
          @error="onImageError($event, 'provider')"
        />
        <Building2 v-else :size="24" class="fallback-icon" />
      </div>

      <div class="verified-status" title="Verified Medical Distributor">
        <CheckCircle :size="14" class="check-icon" />
        <span>{{ t('common.verified') }}</span>
      </div>
    </div>

    <h4 class="supplier-name">
      {{ locale === 'ar' && supplier.arabicName ? supplier.arabicName : supplier.businessName }}
    </h4>
    <p v-if="locale === 'en' && supplier.arabicName && supplier.arabicName !== supplier.businessName" class="supplier-ar-name">
      {{ supplier.arabicName }}
    </p>

    <div class="supplier-specs">
      <div v-if="supplier.minOrder && supplier.minOrder > 0" class="spec-item">
        <span class="spec-label">{{ t('providers.minOrder') }}</span>
        <strong class="spec-val">{{ supplier.minOrder }} {{ t('common.currency') }}</strong>
      </div>

      <div v-if="supplier.deliverySpeed" class="spec-item">
        <Clock :size="12" class="spec-icon" />
        <span class="spec-val">{{ supplier.deliverySpeed }}</span>
      </div>

      <div v-if="supplier.orderNum" class="spec-item">
        <span class="spec-label">{{ t('common.ordersCountLabel') }}</span>
        <strong class="spec-val">{{ supplier.orderNum }}</strong>
      </div>
    </div>

    <Button variant="secondary" size="sm" block class="visit-store-btn">
      {{ t('providers.exploreProducts') }}
    </Button>
  </div>
</template>

<style scoped>
.drugza-supplier-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--dur-base) var(--ease-smooth),
    box-shadow var(--dur-base) var(--ease-smooth),
    transform var(--dur-base) var(--ease-smooth);
  cursor: pointer;
}

.drugza-supplier-card:hover {
  border-color: rgba(25, 118, 173, 0.4);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.supplier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.logo-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-pale-blue);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-light);
}

.supplier-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-icon {
  color: var(--color-primary-blue);
}

.verified-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  background-color: var(--color-success-bg);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

.check-icon {
  flex-shrink: 0;
}

.supplier-name {
  font-size: 0.9375rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.3;
  margin-bottom: 2px;
}

.supplier-ar-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.supplier-specs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2xs);
  padding: var(--space-2xs) 0;
  border-top: 1px dashed var(--color-border-light);
  border-bottom: 1px dashed var(--color-border-light);
  margin-bottom: var(--space-xs);
  font-size: 0.6875rem;
}

.spec-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-text-secondary);
}

.spec-val {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
}

.rating .spec-val {
  color: #B45309;
}

.visit-store-btn {
  margin-top: auto;
}
</style>
