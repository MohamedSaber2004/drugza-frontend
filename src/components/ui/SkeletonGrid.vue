<script setup lang="ts">
import Skeleton from './Skeleton.vue';

type SkeletonGridVariant = 'product' | 'category' | 'supplier' | 'brand';

withDefaults(
  defineProps<{
    variant?: SkeletonGridVariant;
    count?: number;
  }>(),
  {
    variant: 'product',
    count: 4
  }
);
</script>

<template>
  <div class="skeleton-grid" :class="`variant-${variant}`" aria-hidden="true">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <template v-if="variant === 'product'">
        <Skeleton class="sk-image" height="150px" radius="12px" />
        <div class="sk-body">
          <div class="sk-row">
            <Skeleton width="56px" height="18px" rounded />
            <Skeleton width="40px" height="18px" rounded />
          </div>
          <Skeleton width="88%" height="15px" radius="5px" />
          <Skeleton width="58%" height="13px" radius="5px" />
          <div class="sk-footer">
            <Skeleton width="74px" height="22px" radius="6px" />
            <Skeleton width="42px" height="34px" rounded />
          </div>
        </div>
      </template>

      <template v-else-if="variant === 'category'">
        <Skeleton class="sk-circle" circle width="64px" height="64px" />
        <Skeleton width="70%" height="14px" radius="5px" />
        <Skeleton width="46%" height="11px" radius="5px" />
      </template>

      <template v-else-if="variant === 'supplier'">
        <div class="sk-row sk-between">
          <Skeleton width="46px" height="46px" radius="10px" />
          <Skeleton width="58px" height="18px" rounded />
        </div>
        <Skeleton width="80%" height="15px" radius="5px" />
        <Skeleton width="50%" height="12px" radius="5px" />
        <div class="sk-divider"></div>
        <div class="sk-row sk-between">
          <Skeleton width="52px" height="12px" radius="4px" />
          <Skeleton width="44px" height="12px" radius="4px" />
          <Skeleton width="38px" height="12px" radius="4px" />
        </div>
        <Skeleton height="32px" radius="10px" />
      </template>

      <template v-else>
        <Skeleton width="56px" height="56px" radius="14px" />
        <div class="sk-body">
          <Skeleton width="72%" height="14px" radius="5px" />
          <Skeleton width="46%" height="11px" radius="5px" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  gap: var(--space-md);
  width: 100%;
}

.skeleton-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-image {
  width: 100%;
}

.sk-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}

.sk-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sk-between {
  justify-content: space-between;
}

.sk-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 2px 0;
}

.sk-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border);
}

/* Category cards are centered */
.variant-category .skeleton-card {
  align-items: center;
  text-align: center;
  padding: 16px 12px;
}

.variant-category .sk-circle {
  margin-bottom: 2px;
}

/* Brand cards are horizontal */
.variant-brand .skeleton-card {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.variant-brand .sk-body {
  gap: 7px;
}

/* Grid definitions */
.variant-product {
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.variant-supplier {
  grid-template-columns: repeat(5, 1fr);
}

.variant-category {
  grid-template-columns: repeat(6, 1fr);
}

.variant-brand {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

@media (max-width: 1200px) {
  .variant-product {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 1100px) {
  .variant-supplier {
    grid-template-columns: repeat(3, 1fr);
  }

  .variant-product {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 1024px) {
  .variant-category {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .variant-supplier {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .variant-category {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .variant-supplier,
  .variant-brand {
    grid-template-columns: 1fr;
  }
}
</style>
