<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Search,
  SlidersHorizontal,
  Layers,
  Tag,
  ChevronDown,
  X,
  Building2,
  Check
} from 'lucide-vue-next';
import type { Product, Category } from '@/types';
import { productsService, categoriesService } from '@/services';
import ProductCard from '@/components/domain/ProductCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import Button from '@/components/ui/Button.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { useI18n } from '@/composables/useI18n';

const route = useRoute();
const router = useRouter();
const { t, locale, isRtl } = useI18n();

const allProducts = ref<Product[]>([]);
const categories = ref<Category[]>([]);

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const selectedSort = ref<'popular' | 'price-asc' | 'price-desc' | 'discount'>('popular');
const onlyInStock = ref(false);
const onlyFlashSales = ref(false);
const maxPrice = ref(5000);
const currentPage = ref(1);

const selectedProduct = ref<Product | null>(null);
const isModalOpen = ref(false);
const isMobileFilterOpen = ref(false);

onMounted(async () => {
  syncFromRoute();
  try {
    const [prods, cats, best] = await Promise.allSettled([
      productsService.getPopularProducts(),
      categoriesService.getCategories(),
      productsService.getBestPrices(1, 40)
    ]);
    const combined: Product[] = [];
    if (prods.status === 'fulfilled' && prods.value.length > 0) {
      combined.push(...prods.value);
    }
    if (best.status === 'fulfilled' && best.value.length > 0) {
      for (const b of best.value) {
        if (!combined.some(p => p.id === b.id)) {
          combined.push(b);
        }
      }
    }
    if (combined.length > 0) {
      allProducts.value = combined;
    }
    if (cats.status === 'fulfilled' && cats.value.length > 0) {
      categories.value = cats.value;
    }
  } catch (e) {
    console.warn('Error loading catalog data:', e);
  }
});

watch(
  () => route.query,
  () => {
    syncFromRoute();
  }
);

function syncFromRoute() {
  if (route.query.category) {
    selectedCategory.value = route.query.category as string;
  }
  if (route.query.filter === 'flash') {
    onlyFlashSales.value = true;
  }
  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }
}

const filteredProducts = computed(() => {
  return allProducts.value.filter(p => {
    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q) || (p.arabicName && p.arabicName.includes(q));
      const matchIng = p.activeIngredient?.toLowerCase().includes(q);
      const matchBrand = p.brandName?.toLowerCase().includes(q);
      if (!matchName && !matchIng && !matchBrand) return false;
    }

    // Category
    if (selectedCategory.value !== 'all' && p.categoryId !== selectedCategory.value) {
      return false;
    }

    // In Stock
    if (onlyInStock.value && !p.inStock) {
      return false;
    }

    // Flash sale
    if (onlyFlashSales.value && !p.isFlashSale) {
      return false;
    }

    // Price
    if (p.price > maxPrice.value) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (selectedSort.value === 'price-asc') return a.price - b.price;
    if (selectedSort.value === 'price-desc') return b.price - a.price;
    if (selectedSort.value === 'discount') return (b.discountRate || 0) - (a.discountRate || 0);
    return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
  });
});

const pageSize = 12;
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredProducts.value.slice(start, start + pageSize);
});

watch([searchQuery, selectedCategory, selectedSort, onlyInStock, onlyFlashSales, maxPrice], () => {
  currentPage.value = 1;
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isModalOpen.value = true;
}

function handleViewAlternatives(ingredientId: string) {
  searchQuery.value = '';
  const item = allProducts.value.find(p => p.activeIngredientId === ingredientId);
  if (item?.activeIngredient) {
    searchQuery.value = item.activeIngredient;
  }
}

function resetFilters() {
  selectedCategory.value = 'all';
  searchQuery.value = '';
  onlyInStock.value = false;
  onlyFlashSales.value = false;
  maxPrice.value = 5000;
  currentPage.value = 1;
  router.push('/catalog');
}
</script>

<template>
  <div class="catalog-page">
    <div class="drugza-container catalog-container">
      <!-- Breadcrumb & Title Bar -->
      <div class="catalog-top-bar">
        <div>
          <span class="catalog-eyebrow">{{ t('catalog.eyebrow') }}</span>
          <h1 class="catalog-heading">{{ t('catalog.heading') }}</h1>
          <p class="catalog-sub">
            {{ t('catalog.showingCount', { count: filteredProducts.length }) }}
          </p>
        </div>

        <!-- Sort & Mobile Filter Toggle -->
        <div class="top-controls">
          <button
            type="button"
            class="mobile-filter-trigger"
            @click="isMobileFilterOpen = !isMobileFilterOpen"
          >
            <SlidersHorizontal :size="16" />
            <span>{{ t('catalog.filtersBtn') }}</span>
          </button>

          <div class="sort-wrapper">
            <span class="sort-label">{{ t('catalog.sortBy') }}</span>
            <select v-model="selectedSort" class="sort-select">
              <option value="popular">{{ t('catalog.sortPopular') }}</option>
              <option value="discount">{{ t('catalog.sortDiscount') }}</option>
              <option value="price-asc">{{ t('catalog.sortPriceAsc') }}</option>
              <option value="price-desc">{{ t('catalog.sortPriceDesc') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Layout: Sidebar Filters + Products Grid -->
      <div class="catalog-layout">
        <!-- Sidebar Filters -->
        <aside class="catalog-sidebar" :class="{ 'is-mobile-open': isMobileFilterOpen }">
          <div class="sidebar-header-mobile">
            <h3>{{ t('catalog.filterTitle') }}</h3>
            <button class="close-filter-btn" @click="isMobileFilterOpen = false">
              <X :size="20" />
            </button>
          </div>

          <!-- Quick Search in catalog -->
          <div class="filter-section">
            <h4 class="filter-title">{{ t('nav.searchBtn') }}</h4>
            <div class="search-input-box">
              <Search :size="16" class="search-ico" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('catalog.searchPlaceholder')"
                class="filter-search-input"
              />
              <button
                v-if="searchQuery"
                class="clear-mini"
                @click="searchQuery = ''"
              >
                &times;
              </button>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="filter-section">
            <h4 class="filter-title">{{ t('catalog.categoriesTitle') }}</h4>
            <div class="category-radio-list">
              <label class="radio-label" :class="{ active: selectedCategory === 'all' }">
                <input
                  v-model="selectedCategory"
                  type="radio"
                  value="all"
                  class="hidden-radio"
                />
                <span>{{ t('catalog.allCategories') }}</span>
                <span class="count-tag">{{ allProducts.length }}</span>
              </label>

              <label
                v-for="cat in categories"
                :key="cat.id"
                class="radio-label"
                :class="{ active: selectedCategory === cat.id }"
              >
                <input
                  v-model="selectedCategory"
                  type="radio"
                  :value="cat.id"
                  class="hidden-radio"
                />
                <span>{{ locale === 'ar' && cat.arabicName ? cat.arabicName : cat.name }}</span>
                <span class="count-tag">
                  {{ allProducts.filter(p => p.categoryId === cat.id).length }}
                </span>
              </label>
            </div>
          </div>

          <!-- Criteria -->
          <div class="filter-section">
            <h4 class="filter-title">{{ t('catalog.availabilityTitle') }}</h4>
            <div class="checkboxes-list">
              <label class="check-label">
                <input v-model="onlyFlashSales" type="checkbox" class="check-box" />
                <span>🔥 {{ t('catalog.flashSalesOnly') }}</span>
              </label>
              <label class="check-label">
                <input v-model="onlyInStock" type="checkbox" class="check-box" />
                <span>{{ t('catalog.inStockOnly') }}</span>
              </label>
            </div>
          </div>

          <!-- Price Range Filter -->
          <div class="filter-section">
            <div class="price-title-row">
              <h4 class="filter-title">{{ t('catalog.maxPriceTitle') }}</h4>
              <strong class="max-price-val">{{ maxPrice }} {{ t('common.currency') }}</strong>
            </div>
            <input
              v-model.number="maxPrice"
              type="range"
              min="10"
              max="200"
              step="5"
              class="range-slider"
            />
            <div class="range-labels">
              <span>10 {{ t('common.currency') }}</span>
              <span>200 {{ t('common.currency') }}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            block
            class="reset-btn"
            @click="resetFilters"
          >
            {{ t('catalog.resetFilters') }}
          </Button>
        </aside>

        <!-- Catalog Products Display -->
        <main class="catalog-main">
          <!-- Active Filter Tags -->
          <div v-if="selectedCategory !== 'all' || searchQuery || onlyFlashSales" class="active-chips-bar">
            <span class="chips-label">{{ locale === 'ar' ? 'الفلاتر النشطة:' : 'Active Filters:' }}</span>
            <span v-if="selectedCategory !== 'all'" class="filter-chip">
              {{ categories.find(c => c.id === selectedCategory)?.name }}
              <X :size="12" @click="selectedCategory = 'all'" />
            </span>
            <span v-if="searchQuery" class="filter-chip">
              "{{ searchQuery }}"
              <X :size="12" @click="searchQuery = ''" />
            </span>
            <span v-if="onlyFlashSales" class="filter-chip">
              {{ t('nav.flashSales') }}
              <X :size="12" @click="onlyFlashSales = false" />
            </span>
            <button class="clear-all-link" @click="resetFilters">{{ t('catalog.clearFiltersBtn') }}</button>
          </div>

          <!-- Products Grid (Paginated, 12 per page) -->
          <div v-if="filteredProducts.length > 0" class="catalog-grid">
            <ProductCard
              v-for="prod in paginatedProducts"
              :key="prod.id"
              :product="prod"
              @view-details="handleViewProduct"
              @view-alternatives="handleViewAlternatives"
            />
          </div>

          <!-- Pagination Controls -->
          <Pagination
            v-if="filteredProducts.length > 0"
            v-model="currentPage"
            :total-items="filteredProducts.length"
            :page-size="pageSize"
            :item-label="locale === 'ar' ? 'منتج' : 'products'"
          />

          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon-circle">
              <Search :size="36" />
            </div>
            <h3>{{ t('catalog.noProductsTitle') }}</h3>
            <p>{{ t('catalog.noProductsDesc') }}</p>
            <Button variant="primary" size="md" @click="resetFilters">
              {{ t('catalog.clearFiltersBtn') }}
            </Button>
          </div>
        </main>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <ProductDetailModal
      :product="selectedProduct"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @select-alternative="(alt) => selectedProduct = alt"
    />
  </div>
</template>

<style scoped>
.catalog-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
}

.catalog-top-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.catalog-eyebrow {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary-blue);
}

.catalog-heading {
  font-size: 2rem;
  color: var(--color-deep-blue);
  margin: 2px 0;
}

@media (max-width: 640px) {
  .catalog-heading {
    font-size: 1.5rem;
  }
}

.catalog-sub {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.top-controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.mobile-filter-trigger {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
  cursor: pointer;
}

.sort-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
}

.sort-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.sort-select {
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
  outline: none;
  cursor: pointer;
}

/* Layout */
.catalog-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--space-xl);
  align-items: flex-start;
}

@media (max-width: 960px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }
  .mobile-filter-trigger {
    display: inline-flex;
  }
}

/* Sidebar */
.catalog-sidebar {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  position: sticky;
  top: 96px;
}

@media (max-width: 960px) {
  .catalog-sidebar {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 300px;
    height: 100vh;
    z-index: 1000;
    overflow-y: auto;
    border-radius: 0;
  }
  [dir="rtl"] .catalog-sidebar {
    left: auto;
    right: 0;
  }
  .catalog-sidebar.is-mobile-open {
    display: flex;
  }
}

.sidebar-header-mobile {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border);
}

@media (max-width: 960px) {
  .sidebar-header-mobile {
    display: flex;
  }
}

.close-filter-btn {
  background: transparent;
  color: var(--color-text-secondary);
}

.filter-title {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  margin-bottom: var(--space-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-ico {
  position: absolute;
  left: 10px;
  color: var(--color-text-tertiary);
}

[dir="rtl"] .search-ico {
  left: auto;
  right: 10px;
}

.filter-search-input {
  width: 100%;
  height: 38px;
  padding: 0 24px 0 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-off-white);
  outline: none;
}

[dir="rtl"] .filter-search-input {
  padding: 0 32px 0 24px;
}

.clear-mini {
  position: absolute;
  right: 8px;
  font-size: 16px;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

[dir="rtl"] .clear-mini {
  right: auto;
  left: 8px;
}

.category-radio-list,
.checkboxes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.radio-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: var(--radius-xs);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.radio-label:hover {
  background: var(--color-surface-hover);
  color: var(--color-deep-blue);
}

.radio-label.active {
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-bold);
}

.hidden-radio {
  display: none;
}

.count-tag {
  font-size: 0.6875rem;
  background: var(--color-off-white);
  padding: 2px 6px;
  border-radius: var(--radius-pill);
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.check-box {
  accent-color: var(--color-primary-blue);
}

.price-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.max-price-val {
  font-size: 0.8125rem;
  color: var(--color-primary-blue);
}

.range-slider {
  width: 100%;
  accent-color: var(--color-primary-blue);
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

/* Active Chips */
.active-chips-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.chips-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}

.filter-chip svg {
  cursor: pointer;
}

.clear-all-link {
  font-size: 0.75rem;
  color: var(--color-error);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  margin-left: auto;
}

[dir="rtl"] .clear-all-link {
  margin-left: 0;
  margin-right: auto;
}

/* Catalog Grid */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .catalog-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 640px) {
  .catalog-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 360px) {
  .catalog-grid {
    grid-template-columns: 1fr;
  }
}

/* Empty State */
.empty-state {
  background: #FFFFFF;
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  border: 1px solid var(--color-border);
}

.empty-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-pill);
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--color-deep-blue);
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  max-width: 380px;
  margin-bottom: var(--space-sm);
}
</style>
