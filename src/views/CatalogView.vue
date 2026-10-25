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
import type { Product, Category, Supplier } from '@/types';
import { productsService, categoriesService, providersService } from '@/services';
import ProductCard from '@/components/domain/ProductCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import Button from '@/components/ui/Button.vue';
import Pagination from '@/components/ui/Pagination.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import { useI18n } from '@/composables/useI18n';
import { getCategoryProductCount, getProviderProductCount, formatCount } from '@/data/catalogStats';

const route = useRoute();
const router = useRouter();
const { t, locale, isRtl } = useI18n();

const sourceProducts = ref<Product[]>([]);
const providerFullProducts = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const providers = ref<Supplier[]>([]);
const isLoading = ref(true);

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const selectedProvider = ref<string>('all');
const selectedSort = ref<'popular' | 'price-asc' | 'price-desc' | 'discount'>('popular');
const onlyInStock = ref(false);
const onlyFlashSales = ref(false);
const maxPrice = ref(5000);
const currentPage = ref(1);

const pageSize = 12;
const totalItems = ref(0);
const totalCatalogProducts = 26343;

const selectedProduct = ref<Product | null>(null);
const isModalOpen = ref(false);
const isMobileFilterOpen = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

const isProviderMode = computed(() => selectedProvider.value !== 'all');
const isCategoryMode = computed(() => selectedCategory.value !== 'all');
const isSearchMode = computed(() => searchQuery.value.trim().length > 0);
const hasMore = ref(false);
const endPage = ref<number | null>(null);

const activeProviders = computed(() => {
  return providers.value
    .map(p => ({
      ...p,
      productCount: getProviderProductCount(p.id)
    }))
    .filter(p => p.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount);
});

const sortedCategories = computed(() => {
  return [...categories.value]
    .map(c => ({
      ...c,
      productCount: getCategoryProductCount(c.id)
    }))
    .sort((a, b) => b.productCount - a.productCount);
});

const activeProviderName = computed(() => {
  const p = providers.value.find(prov => prov.id === selectedProvider.value);
  if (!p) return '';
  const count = getProviderProductCount(p.id);
  const name = locale.value === 'ar' && p.arabicName ? p.arabicName : p.businessName;
  return count > 0 ? `${name} (${formatCount(count)})` : name;
});

const activeCategoryName = computed(() => {
  const c = categories.value.find(cat => cat.id === selectedCategory.value);
  if (!c) return '';
  const count = getCategoryProductCount(c.id);
  const name = locale.value === 'ar' && c.arabicName ? c.arabicName : c.name;
  return count > 0 ? `${name} (${formatCount(count)})` : name;
});

onMounted(async () => {
  syncFromRoute();
  await Promise.allSettled([
    loadCategories(),
    loadProviders(),
    loadProducts()
  ]);
});

watch(
  () => route.query,
  () => {
    syncFromRoute();
    currentPage.value = 1;
    endPage.value = null;
    hasMore.value = false;
    loadProducts();
  }
);

function syncFromRoute() {
  selectedCategory.value = (route.query.category as string) || 'all';
  selectedProvider.value = (route.query.provider as string) || 'all';
  searchQuery.value = (route.query.search as string) || '';
  onlyFlashSales.value = route.query.filter === 'flash';
}

async function loadCategories() {
  try {
    const list = await categoriesService.getCategories();
    if (list.length > 0) categories.value = list;
  } catch (e) {
    console.warn('Error loading catalog categories:', e);
  }
}

async function loadProviders() {
  try {
    const list = await providersService.getProviders();
    if (list.length > 0) providers.value = list;
  } catch (e) {
    console.warn('Error loading catalog providers:', e);
  }
}

async function loadProducts() {
  const id = ++requestId;
  isLoading.value = true;
  const query = {
    page: currentPage.value,
    size: pageSize,
    search: searchQuery.value.trim() || undefined
  };

  try {
    if (onlyFlashSales.value) {
      providerFullProducts.value = [];
      const flashDeals = await productsService.getFlashSaleProducts();
      if (id !== requestId) return;
      sourceProducts.value = flashDeals;
      totalItems.value = flashDeals.length;
      hasMore.value = false;
    } else if (isProviderMode.value) {
      const providerId = selectedProvider.value;
      const allItems = isCategoryMode.value
        ? await productsService.getProductsByProviderAndCategory(selectedCategory.value, providerId, query.search)
        : await productsService.getProductsByProvider(providerId, query.search);

      if (id !== requestId) return;

      const providerObj = providers.value.find(p => p.id === providerId);
      const providerName = providerObj?.businessName?.trim();
      providerFullProducts.value = allItems.map(p => ({
        ...p,
        inventoryId: providerId,
        inventoryName: p.inventoryName || providerName || undefined
      }));
    } else if (isCategoryMode.value) {
      providerFullProducts.value = [];
      const res = await productsService.getCategoryProductsPage(selectedCategory.value, query);
      if (id !== requestId) return;

      if (res.items.length === 0 && currentPage.value > 1) {
        endPage.value = currentPage.value - 1;
        currentPage.value -= 1;
        return;
      }
      sourceProducts.value = res.items;

      const catCount = getCategoryProductCount(selectedCategory.value);
      if (catCount > 0 && !isSearchMode.value) {
        totalItems.value = catCount;
        hasMore.value = currentPage.value * pageSize < catCount;
      } else {
        const endKnown = endPage.value !== null && currentPage.value >= endPage.value;
        hasMore.value = !endKnown && res.items.length >= pageSize;
        totalItems.value = hasMore.value
          ? currentPage.value * pageSize
          : (currentPage.value - 1) * pageSize + res.items.length;
      }
    } else {
      providerFullProducts.value = [];
      const res = await productsService.getProductsPage(query);
      if (id !== requestId) return;

      if (res.items.length === 0 && currentPage.value > 1) {
        endPage.value = currentPage.value - 1;
        currentPage.value -= 1;
        return;
      }
      sourceProducts.value = res.items;
      if (isSearchMode.value) {
        if (res.items.length < pageSize) {
          totalItems.value = (currentPage.value - 1) * pageSize + res.items.length;
          hasMore.value = false;
        } else {
          totalItems.value = res.totalItems;
          hasMore.value = true;
        }
      } else {
        totalItems.value = res.totalItems;
        hasMore.value = false;
      }
    }
  } catch (e) {
    console.warn('Error loading catalog products:', e);
    if (id === requestId) {
      sourceProducts.value = [];
      providerFullProducts.value = [];
      totalItems.value = 0;
      hasMore.value = false;
    }
  } finally {
    if (id === requestId) isLoading.value = false;
  }
}

function matchesFilters(p: Product): boolean {
  if (onlyInStock.value && !p.inStock) return false;
  if (onlyFlashSales.value && !p.isFlashSale) return false;
  if (p.price > maxPrice.value) return false;
  return true;
}

function sortProducts(list: Product[]): Product[] {
  return [...list].sort((a, b) => {
    if (selectedSort.value === 'price-asc') return a.price - b.price;
    if (selectedSort.value === 'price-desc') return b.price - a.price;
    if (selectedSort.value === 'discount') return (b.discountRate || 0) - (a.discountRate || 0);
    return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
  });
}

const filteredProviderProducts = computed(() => {
  return sortProducts(providerFullProducts.value.filter(matchesFilters));
});

const paginatedProducts = computed(() => {
  if (isProviderMode.value) {
    const start = (currentPage.value - 1) * pageSize;
    return filteredProviderProducts.value.slice(start, start + pageSize);
  }
  return sortProducts(sourceProducts.value.filter(matchesFilters));
});

const paginationTotal = computed(() => {
  if (isProviderMode.value) {
    return filteredProviderProducts.value.length;
  }
  return totalItems.value;
});

watch(currentPage, () => {
  if (!isProviderMode.value) {
    loadProducts();
  }
});

watch([selectedCategory, selectedProvider], ([newCat, newProv]) => {
  const routeCat = (route.query.category as string) || 'all';
  const routeProv = (route.query.provider as string) || 'all';
  if (newCat === routeCat && newProv === routeProv) return;

  currentPage.value = 1;
  endPage.value = null;
  hasMore.value = false;
  router.replace({
    query: {
      ...route.query,
      category: newCat !== 'all' ? newCat : undefined,
      provider: newProv !== 'all' ? newProv : undefined,
      page: undefined
    }
  });
  loadProducts();
});

watch(searchQuery, (newVal) => {
  const currentRouteSearch = (route.query.search as string) || '';
  if (newVal === currentRouteSearch) return;

  currentPage.value = 1;
  endPage.value = null;
  hasMore.value = false;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    router.replace({
      query: {
        ...route.query,
        search: newVal.trim() || undefined,
        page: undefined
      }
    });
    loadProducts();
  }, 400);
});

watch([onlyInStock, onlyFlashSales, maxPrice, selectedSort], () => {
  currentPage.value = 1;
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isModalOpen.value = true;
}

function handleViewAlternatives(ingredientId: string) {
  const item = (isProviderMode.value ? providerFullProducts.value : sourceProducts.value).find(
    p => p.activeIngredientId === ingredientId
  );
  searchQuery.value = item?.activeIngredient || ingredientId || '';
}

function resetFilters() {
  selectedCategory.value = 'all';
  selectedProvider.value = 'all';
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
            {{ t('catalog.showingCount', { count: paginationTotal }) }}
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
        <!-- Mobile Filter Backdrop -->
        <div
          v-if="isMobileFilterOpen"
          class="mobile-filter-backdrop"
          @click="isMobileFilterOpen = false"
        ></div>

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

          <!-- Provider Filter -->
          <div class="filter-section">
            <div class="filter-title-row">
              <h4 class="filter-title">
                <Building2 :size="15" class="title-icon" />
                <span>{{ t('catalog.providersTitle') }}</span>
              </h4>
              <button
                v-if="selectedProvider !== 'all'"
                type="button"
                class="filter-reset-hint"
                @click="selectedProvider = 'all'"
              >
                {{ t('common.clear') }}
              </button>
            </div>
            <div class="category-radio-list scrollable-filter-list">
              <label class="radio-label" :class="{ active: selectedProvider === 'all' }">
                <input
                  v-model="selectedProvider"
                  type="radio"
                  value="all"
                  class="hidden-radio"
                />
                <span class="radio-text">{{ t('catalog.allProviders') }}</span>
                <span class="count-tag">{{ formatCount(totalCatalogProducts) }}</span>
              </label>

              <label
                v-for="prov in activeProviders"
                :key="prov.id"
                class="radio-label"
                :class="{ active: selectedProvider === prov.id }"
              >
                <input
                  v-model="selectedProvider"
                  type="radio"
                  :value="prov.id"
                  class="hidden-radio"
                />
                <span class="radio-text">{{ locale === 'ar' && prov.arabicName ? prov.arabicName : prov.businessName }}</span>
                <span class="count-tag">{{ formatCount(prov.productCount) }}</span>
              </label>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="filter-section">
            <div class="filter-title-row">
              <h4 class="filter-title">
                <Layers :size="15" class="title-icon" />
                <span>{{ t('catalog.categoriesTitle') }}</span>
              </h4>
              <button
                v-if="selectedCategory !== 'all'"
                type="button"
                class="filter-reset-hint"
                @click="selectedCategory = 'all'"
              >
                {{ t('common.clear') }}
              </button>
            </div>
            <div class="category-radio-list scrollable-filter-list">
              <label class="radio-label" :class="{ active: selectedCategory === 'all' }">
                <input
                  v-model="selectedCategory"
                  type="radio"
                  value="all"
                  class="hidden-radio"
                />
                <span class="radio-text">{{ t('catalog.allCategories') }}</span>
                <span class="count-tag">{{ formatCount(totalCatalogProducts) }}</span>
              </label>

              <label
                v-for="cat in sortedCategories"
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
                <span class="radio-text">{{ locale === 'ar' && cat.arabicName ? cat.arabicName : cat.name }}</span>
                <span class="count-tag" :class="{ 'zero-count': !cat.productCount }">
                  {{ formatCount(cat.productCount) }}
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
              max="5000"
              step="50"
              class="range-slider"
            />
            <div class="range-labels">
              <span>10 {{ t('common.currency') }}</span>
              <span>5000 {{ t('common.currency') }}</span>
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
        <main class="catalog-main" v-loading="isLoading">
          <!-- Active Filter Tags -->
          <div v-if="selectedProvider !== 'all' || selectedCategory !== 'all' || searchQuery || onlyFlashSales" class="active-chips-bar">
            <span class="chips-label">{{ t('common.activeFilters') }}</span>
            <span v-if="selectedProvider !== 'all'" class="filter-chip">
              <Building2 :size="12" style="margin-inline-end: 4px;" />
              {{ activeProviderName }}
              <X :size="12" class="chip-x" @click="selectedProvider = 'all'" />
            </span>
            <span v-if="selectedCategory !== 'all'" class="filter-chip">
              <Layers :size="12" style="margin-inline-end: 4px;" />
              {{ activeCategoryName }}
              <X :size="12" class="chip-x" @click="selectedCategory = 'all'" />
            </span>
            <span v-if="searchQuery" class="filter-chip">
              "{{ searchQuery }}"
              <X :size="12" class="chip-x" @click="searchQuery = ''" />
            </span>
            <span v-if="onlyFlashSales" class="filter-chip">
              {{ t('nav.flashSales') }}
              <X :size="12" class="chip-x" @click="onlyFlashSales = false" />
            </span>
            <button class="clear-all-link" @click="resetFilters">{{ t('catalog.clearFiltersBtn') }}</button>
          </div>

          <!-- Products Grid (Paginated, 12 per page) -->
          <div v-if="isLoading" class="catalog-grid">
            <div
              v-for="i in 8"
              :key="'cat-skel-' + i"
              style="background: #ffffff; border: 1px solid rgba(229, 234, 240, 0.8); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(18, 73, 107, 0.03);"
            >
              <Skeleton height="170px" radius="12px" />
              <div style="display: flex; gap: 6px;">
                <Skeleton width="60px" height="18px" rounded />
              </div>
              <Skeleton width="85%" height="16px" radius="4px" />
              <Skeleton width="55%" height="14px" radius="4px" />
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
                <Skeleton width="70px" height="20px" radius="6px" />
                <Skeleton width="38px" height="38px" radius="10px" />
              </div>
            </div>
          </div>

          <!-- Products Grid -->
          <template v-else-if="paginatedProducts.length > 0">
            <div class="catalog-grid" v-reveal.children>
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
              v-if="paginationTotal > pageSize"
              v-model="currentPage"
              :total-items="paginationTotal"
              :page-size="pageSize"
              :item-label="t('common.items')"
              :has-more="hasMore"
            />
          </template>

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

@media (max-width: 640px) {
  .catalog-top-bar {
    margin-bottom: var(--space-md);
  }
  .top-controls {
    width: 100%;
    justify-content: space-between;
  }
}

/* Sidebar */
.mobile-filter-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 73, 107, 0.45);
  backdrop-filter: blur(2px);
  z-index: 999;
}

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
    max-width: 85vw;
    height: 100vh;
    z-index: 1000;
    overflow-y: auto;
    border-radius: 0;
    box-shadow: var(--shadow-xl);
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

.scrollable-filter-list {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

[dir="rtl"] .scrollable-filter-list {
  padding-right: 0;
  padding-left: 4px;
}

.scrollable-filter-list::-webkit-scrollbar {
  width: 5px;
}

.scrollable-filter-list::-webkit-scrollbar-track {
  background: #F1F5F9;
  border-radius: 4px;
}

.scrollable-filter-list::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 4px;
}

.scrollable-filter-list::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}

.filter-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  margin-bottom: 0;
}

.title-icon {
  color: var(--color-primary-blue);
}

.filter-reset-hint {
  font-size: 0.75rem;
  color: var(--color-primary-blue);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
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

.radio-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 6px;
}

[dir="rtl"] .radio-text {
  padding-right: 0;
  padding-left: 6px;
}

.hidden-radio {
  display: none;
}

.count-tag {
  font-size: 0.6875rem;
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-bold);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
}

.radio-label.active .count-tag {
  background: #FFFFFF;
  color: var(--color-primary-blue);
}

.count-tag.zero-count {
  opacity: 0.5;
  background: #F1F5F9;
  color: var(--color-text-tertiary);
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
