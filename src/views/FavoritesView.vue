<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Heart, ArrowRight, Loader2 } from 'lucide-vue-next';
import type { Product } from '@/types';
import { useFavorites } from '@/composables/useFavorites';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import ProductCard from '@/components/domain/ProductCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import Button from '@/components/ui/Button.vue';
import Pagination from '@/components/ui/Pagination.vue';

const router = useRouter();
const toast = useToast();
const { t, locale } = useI18n();
const { favoriteProducts, fetchFavorites, isLoading } = useFavorites();

const selectedProduct = ref<Product | null>(null);
const isProductModalOpen = ref(false);
const currentPage = ref(1);
const pageSize = 12;

onMounted(async () => {
  await fetchFavorites(true);
});

const paginatedFavorites = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return favoriteProducts.value.slice(start, start + pageSize);
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isProductModalOpen.value = true;
}
</script>

<template>
  <div class="favorites-page">
    <div class="drugza-container">
      <!-- Header -->
      <div class="fav-header-row">
        <div>
          <span class="fav-eyebrow">{{ t('favoritesPage.eyebrow') }}</span>
          <h1 class="fav-title">{{ t('favoritesPage.heading') }}</h1>
          <p class="fav-subtitle">
            {{ t('favoritesPage.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state-card">
        <Loader2 :size="36" class="spin-icon" />
        <p>{{ t('favorites.loadingList') }}</p>
      </div>

      <!-- Favorites Grid -->
      <div v-else-if="favoriteProducts.length > 0">
        <div class="fav-grid" v-loading="isLoading">
          <ProductCard
            v-for="prod in paginatedFavorites"
            :key="prod.id"
            :product="prod"
            @view-details="handleViewProduct"
          />
        </div>

        <Pagination
          v-if="favoriteProducts.length > pageSize"
          v-model="currentPage"
          :total-items="favoriteProducts.length"
          :page-size="pageSize"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-fav-card">
        <div class="empty-heart-box">
          <Heart :size="48" class="heart-ico" />
        </div>
        <h2>{{ t('favoritesPage.emptyTitle') }}</h2>
        <p>{{ t('favoritesPage.emptyDesc') }}</p>
        <Button variant="primary" size="lg" @click="router.push('/catalog')">
          <span>{{ t('favoritesPage.exploreCatalog') }}</span>
          <ArrowRight :size="18" class="arrow-icon" />
        </Button>
      </div>
    </div>

    <!-- Product Modal -->
    <ProductDetailModal
      :product="selectedProduct"
      :is-open="isProductModalOpen"
      @close="isProductModalOpen = false"
    />
  </div>
</template>

<style scoped>
.favorites-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
}

.fav-header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.fav-eyebrow {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-primary-blue);
  letter-spacing: 0.08em;
}

.fav-title {
  font-size: 2rem;
  color: var(--color-deep-blue);
  margin: 2px 0;
}

@media (max-width: 640px) {
  .fav-title {
    font-size: 1.5rem;
  }
}

.fav-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.loading-state-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
  color: var(--color-primary-blue);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .fav-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .fav-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .fav-header-row {
    margin-bottom: var(--space-md);
  }
  .fav-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 360px) {
  .fav-grid {
    grid-template-columns: 1fr;
  }
}

.empty-fav-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-3xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  max-width: 600px;
  margin: var(--space-xl) auto;
  box-shadow: var(--shadow-sm);
}

@media (max-width: 640px) {
  .empty-fav-card {
    padding: var(--space-xl) var(--space-md);
    border-radius: var(--radius-xl);
  }
}

.empty-heart-box {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-pill);
  background: #FEF3F2;
  color: #DC5B61;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-xs);
}

.empty-fav-card h2 {
  font-size: 1.5rem;
  color: var(--color-deep-blue);
}

@media (max-width: 640px) {
  .empty-fav-card h2 {
    font-size: 1.25rem;
  }
}

.empty-fav-card p {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-md);
}
</style>
