<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { useI18n } from '@/composables/useI18n';

const props = withDefaults(
  defineProps<{
    totalItems: number;
    pageSize?: number;
    modelValue: number;
    scrollToTop?: boolean;
    itemLabel?: string;
    hasMore?: boolean;
  }>(),
  {
    pageSize: 10,
    scrollToTop: true,
    itemLabel: '',
    hasMore: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', page: number): void;
  (e: 'change', page: number): void;
}>();

const { t, locale, isRtl } = useI18n();

const totalPages = computed(
  () => Math.max(1, Math.ceil(props.totalItems / props.pageSize)) + (props.hasMore ? 1 : 0)
);

const startItemIndex = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.modelValue - 1) * props.pageSize + 1;
});

const endItemIndex = computed(() => {
  return Math.min(props.modelValue * props.pageSize, props.totalItems);
});

// Calculate visible page numbers with smart ellipsis
const visiblePages = computed(() => {
  const current = props.modelValue;
  const total = totalPages.value;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total);
  }

  return pages;
});

function changePage(page: number | string) {
  if (typeof page !== 'number') return;
  if (page < 1 || page > totalPages.value || page === props.modelValue) return;

  emit('update:modelValue', page);
  emit('change', page);

  if (props.scrollToTop) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

<template>
  <div v-if="totalPages > 1 || totalItems > 0" class="drugza-pagination-wrapper">
    <!-- Items Counter Summary -->
    <div class="pagination-summary">
      <span>
        {{ t('common.showingItems') }} <strong>{{ startItemIndex }}-{{ endItemIndex }}</strong> {{ t('common.ofTotal') }} <strong>{{ totalItems }}{{ hasMore ? '+' : '' }}</strong> {{ itemLabel || t('common.itemLabelDefault') }}
      </span>
    </div>

    <!-- Pagination Controls (Only shown if more than 1 page) -->
    <nav v-if="totalPages > 1" class="pagination-controls" aria-label="Pagination Navigation">
      <!-- First Page Button (Optional on desktop) -->
      <button
        type="button"
        class="page-nav-btn edge-btn"
        :disabled="modelValue === 1"
        :title="t('common.firstPage')"
        @click="changePage(1)"
      >
        <component :is="isRtl ? ChevronsRight : ChevronsLeft" :size="16" />
      </button>

      <!-- Previous Page Button -->
      <button
        type="button"
        class="page-nav-btn prev-btn"
        :disabled="modelValue === 1"
        :title="t('common.prevPage')"
        @click="changePage(modelValue - 1)"
      >
        <component :is="isRtl ? ChevronRight : ChevronLeft" :size="16" />
        <span class="btn-text">{{ t('common.prev') }}</span>
      </button>

      <!-- Page Numbers -->
      <div class="page-numbers-group">
        <template v-for="(p, idx) in visiblePages" :key="idx">
          <span v-if="p === '...'" class="page-ellipsis">…</span>
          <button
            v-else
            type="button"
            class="page-number-btn"
            :class="{ active: modelValue === p }"
            :aria-current="modelValue === p ? 'page' : undefined"
            @click="changePage(p)"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <!-- Mobile Page Indicator -->
      <div class="mobile-page-indicator">
        <span>{{ modelValue }} / {{ totalPages }}</span>
      </div>

      <!-- Next Page Button -->
      <button
        type="button"
        class="page-nav-btn next-btn"
        :disabled="modelValue === totalPages"
        :title="t('common.nextPage')"
        @click="changePage(modelValue + 1)"
      >
        <span class="btn-text">{{ t('common.next') }}</span>
        <component :is="isRtl ? ChevronLeft : ChevronRight" :size="16" />
      </button>

      <!-- Last Page Button (Optional on desktop) -->
      <button
        type="button"
        class="page-nav-btn edge-btn"
        :disabled="modelValue === totalPages"
        :title="t('common.lastPage')"
        @click="changePage(totalPages)"
      >
        <component :is="isRtl ? ChevronsLeft : ChevronsRight" :size="16" />
      </button>
    </nav>
  </div>
</template>

<style scoped>
.drugza-pagination-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  margin-bottom: var(--space-md);
  padding: var(--space-sm) 0;
  width: 100%;
}

.pagination-summary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

.pagination-summary strong {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-bold);
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.page-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-deep-blue);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(18, 73, 107, 0.04);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.page-nav-btn:hover:not(:disabled) {
  border-color: var(--color-primary-blue);
  background: var(--color-primary-blue-subtle);
  color: var(--color-primary-blue);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(25, 118, 173, 0.12);
}

.page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--color-border-light);
  background: var(--color-off-white);
  color: var(--color-text-tertiary);
  transform: none;
}

.page-nav-btn.edge-btn {
  padding: 0 10px;
}

.page-numbers-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-number-btn {
  min-width: 38px;
  height: 38px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.page-number-btn:hover:not(.active) {
  border-color: var(--color-primary-blue);
  color: var(--color-primary-blue);
  background: var(--color-primary-blue-light);
}

.page-number-btn.active {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: 0 2px 8px rgba(25, 118, 173, 0.3);
  cursor: default;
}

.page-ellipsis {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  padding: 0 4px;
}

.mobile-page-indicator {
  display: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  padding: 0 8px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .page-numbers-group {
    display: none;
  }

  .mobile-page-indicator {
    display: inline-block;
  }

  .page-nav-btn.edge-btn {
    display: none;
  }

  .page-nav-btn .btn-text {
    font-size: var(--font-size-xs);
  }
}
</style>
