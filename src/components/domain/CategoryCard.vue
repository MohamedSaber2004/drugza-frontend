<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { Category } from '@/types';
import { useI18n } from '@/composables/useI18n';
import { onImageError } from '@/utils/placeholders';

const { t, locale, isRtl } = useI18n();

defineProps<{
  category: Category;
}>();

const emit = defineEmits<{
  (e: 'select', category: Category): void;
}>();
</script>

<template>
  <div class="drugza-category-card" @click="emit('select', category)">
    <div class="category-image-wrap">
      <img
        :src="category.imageName"
        :alt="category.name"
        class="category-img"
        loading="lazy"
        @error="onImageError($event, 'category')"
      />
    </div>

    <div class="category-details">
      <h4 class="category-title">
        {{ locale === 'ar' && category.arabicName ? category.arabicName : category.name }}
      </h4>
      <p v-if="locale === 'en' && category.arabicName && category.arabicName !== category.name" class="category-ar-title">
        {{ category.arabicName }}
      </p>
      <div class="category-meta">
        <span class="count-tag">{{ t('categories.browseCategory') }}</span>
        <ChevronRight :size="14" class="arrow-icon" :class="{ 'rtl-flip': isRtl }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.drugza-category-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--dur-base) var(--ease-smooth),
    box-shadow var(--dur-base) var(--ease-smooth),
    transform var(--dur-base) var(--ease-smooth);
}

.drugza-category-card:hover {
  border-color: rgba(25, 118, 173, 0.4);
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.category-image-wrap {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-pill);
  background: linear-gradient(160deg, #F5F9FD 0%, #EAF1F8 100%);
  border: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: var(--space-xs);
  transition: transform var(--dur-base) var(--ease-smooth);
  padding: 4px;
}

.drugza-category-card:hover .category-image-wrap {
  transform: scale(1.08);
}

.category-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-pill);
}

.category-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.category-title {
  font-size: 0.9375rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.25;
  margin-bottom: 2px;
}

.category-ar-title {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.category-meta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.6875rem;
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-semibold);
  transition: gap var(--dur-fast) var(--ease-smooth);
}

.drugza-category-card:hover .category-meta {
  gap: 6px;
}

.arrow-icon {
  transition: transform var(--dur-fast) var(--ease-smooth);
}

.arrow-icon.rtl-flip {
  transform: rotate(180deg);
}

.drugza-category-card:hover .arrow-icon:not(.rtl-flip) {
  transform: translateX(2px);
}

.drugza-category-card:hover .arrow-icon.rtl-flip {
  transform: rotate(180deg) translateX(2px);
}
</style>
