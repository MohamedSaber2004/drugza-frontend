<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
  Search,
  X,
  SlidersHorizontal,
  Building2,
  ArrowRight,
  Layers
} from 'lucide-vue-next';
import type { Product } from '@/types';
import { DrugzaService } from '@/services/api';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import { useI18n } from '@/composables/useI18n';
import { onImageError } from '@/utils/placeholders';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-product', product: Product): void;
}>();

const { t, locale, isRtl } = useI18n();
const router = useRouter();

const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const results = ref<Product[]>([]);
const isSearching = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

const popularSearchesAr = [
  'بانادول',
  'أوجمنتين',
  'باراسيتامول',
  'فيتامين د',
  'أوميجا 3',
  'كونجستال',
  'أنتينال',
  'أوميبرازول'
];

const popularSearchesEn = [
  'Panadol',
  'Augmentin',
  'Paracetamol',
  'Vitamin D3',
  'Omega 3',
  'Congestal',
  'Antinal',
  'Omeprazole'
];

const quickSearches = computed(() =>
  locale.value === 'ar' ? popularSearchesAr : popularSearchesEn
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      searchQuery.value = '';
      results.value = [];
      nextTick(() => {
        searchInput.value?.focus();
      });
    }
  }
);

function onInput() {
  if (searchTimer) clearTimeout(searchTimer);
  const q = searchQuery.value.trim();
  if (q.length < 2) {
    results.value = [];
    isSearching.value = false;
    return;
  }
  isSearching.value = true;
  searchTimer = setTimeout(runSearch, 300);
}

async function runSearch() {
  const id = ++requestId;
  try {
    const list = await DrugzaService.searchProducts(searchQuery.value.trim());
    if (id === requestId) results.value = list.slice(0, 8);
  } catch {
    if (id === requestId) results.value = [];
  } finally {
    if (id === requestId) isSearching.value = false;
  }
}

/**
 * Navigates directly to /catalog?search=... so the user can filter by provider, category, price, stock, etc.
 */
function goToCatalog(queryText?: string) {
  const q = (queryText !== undefined ? queryText : searchQuery.value).trim();
  if (!q) {
    emit('close');
    router.push('/catalog');
    return;
  }
  emit('close');
  router.push({ path: '/catalog', query: { search: q } });
}

function selectQuick(term: string) {
  searchQuery.value = term;
  goToCatalog(term);
}

function handleSelect(prod: Product) {
  const searchTerm = prod.name || prod.arabicName || '';
  goToCatalog(searchTerm);
}
</script>

<template>
  <div v-if="isOpen" class="search-backdrop" @click="emit('close')">
    <div class="search-container" @click.stop>
      <!-- Search Input Header with Form -->
      <form class="search-bar" @submit.prevent="goToCatalog()">
        <Search :size="20" class="search-icon" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-field"
          :placeholder="t('search.inputPlaceholder')"
          @input="onInput"
          @keydown.esc="emit('close')"
        />

        <button
          v-if="searchQuery"
          type="button"
          class="clear-btn"
          :title="t('search.clearTooltip')"
          @click="searchQuery = ''; results = []"
        >
          <X :size="18" />
        </button>

        <button type="submit" class="search-submit-btn">
          <span>{{ t('common.search') }}</span>
        </button>

        <button type="button" class="close-modal-btn" @click="emit('close')">
          {{ t('search.close') }}
        </button>
      </form>

      <!-- Quick suggestions pill row -->
      <div class="quick-pills-row">
        <span class="pills-label">{{ t('search.popularTitle') }}</span>
        <div class="pills-scroll">
          <button
            v-for="pill in quickSearches"
            :key="pill"
            type="button"
            class="quick-pill"
            @click="selectQuick(pill)"
          >
            {{ pill }}
          </button>
        </div>
      </div>

      <!-- Results list or Initial State -->
      <div class="results-area">
        <!-- Loading State -->
        <div v-if="isSearching" class="searching-state">
          <div class="search-spinner"></div>
          <span>{{ t('common.loading') }}</span>
        </div>

        <!-- No Results State -->
        <div v-else-if="searchQuery.trim().length >= 2 && results.length === 0" class="empty-results">
          <p>{{ t('search.noResults', { query: searchQuery }) }}</p>
          <span>{{ t('search.tryAnother') }}</span>
          <button type="button" class="empty-action-btn" @click="goToCatalog()">
            {{ t('search.browseCatalogLink') }}
          </button>
        </div>

        <!-- Matching Suggestions List -->
        <div v-else-if="results.length > 0" class="results-list">
          <!-- Primary CTA Banner to go to Catalog with Filters -->
          <div class="catalog-direct-banner" @click="goToCatalog()">
            <div class="banner-content">
              <SlidersHorizontal :size="18" class="banner-icon" />
              <div>
                <strong class="banner-title">
                  {{ t('search.viewResultsFor', { query: searchQuery }) }}
                </strong>
                <p class="banner-sub">
                  {{ t('search.filterDesc') }}
                </p>
              </div>
            </div>
            <ArrowRight :size="16" class="banner-arrow" :class="{ 'rtl-flip': isRtl }" />
          </div>

          <div class="suggestions-header">
            <span>{{ t('search.matchingSuggestions') }}</span>
          </div>

          <!-- Individual Product Suggestions -->
          <div
            v-for="item in results"
            :key="item.id"
            class="result-item"
            @click="handleSelect(item)"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="result-img"
              loading="lazy"
              @error="onImageError($event, 'product')"
            />

            <div class="result-details">
              <div class="title-row">
                <h4 class="result-title">{{ locale === 'ar' && item.arabicName ? item.arabicName : item.name }}</h4>
                <span v-if="locale === 'ar' && item.arabicName && item.arabicName !== item.name" class="result-ar">{{ item.name }}</span>
                <span v-else-if="locale === 'en' && item.arabicName && item.arabicName !== item.name" class="result-ar">{{ item.arabicName }}</span>
              </div>

              <div class="meta-row">
                <span v-if="item.form || item.strength" class="form-tag">{{ [item.form, item.strength].filter(Boolean).join(' • ') }}</span>
                <span v-if="item.brandName || item.manufacturer" class="brand-tag">
                  <Building2 :size="11" />
                  {{ item.brandName || item.manufacturer }}
                </span>
                <span v-if="item.activeIngredient" class="ingredient-tag">
                  {{ item.activeIngredient }}
                </span>
              </div>
            </div>

            <div class="result-price-col">
              <PriceDisplay :price="item.price" size="sm" />
              <span v-if="item.suppliersCount" class="suppliers-avail">
                {{ item.suppliersCount }} {{ item.suppliersCount === 1 ? t('search.warehouseCountSingle') : t('search.warehouseCountMulti') }}
              </span>
            </div>

            <ArrowRight :size="15" class="select-arrow" :class="{ 'rtl-flip': isRtl }" />
          </div>
        </div>

        <!-- Initial State: Clean Shortcuts to All Products, Providers, Categories -->
        <div v-else class="initial-shortcuts">
          <div class="shortcut-cards-grid">
            <div class="shortcut-card" @click="goToCatalog('')">
              <div class="shortcut-icon-box blue">
                <SlidersHorizontal :size="20" />
              </div>
              <div class="shortcut-info">
                <strong>{{ t('search.catalogFiltersTitle') }}</strong>
                <p>{{ t('search.catalogFiltersDesc') }}</p>
              </div>
              <ArrowRight :size="16" class="shortcut-arrow" :class="{ 'rtl-flip': isRtl }" />
            </div>

            <div class="shortcut-card" @click="emit('close'); router.push('/providers')">
              <div class="shortcut-icon-box green">
                <Building2 :size="20" />
              </div>
              <div class="shortcut-info">
                <strong>{{ t('search.warehousesTitle') }}</strong>
                <p>{{ t('search.warehousesDesc') }}</p>
              </div>
              <ArrowRight :size="16" class="shortcut-arrow" :class="{ 'rtl-flip': isRtl }" />
            </div>

            <div class="shortcut-card" @click="emit('close'); router.push('/categories')">
              <div class="shortcut-icon-box yellow">
                <Layers :size="20" />
              </div>
              <div class="shortcut-info">
                <strong>{{ t('search.categoriesTitle') }}</strong>
                <p>{{ t('search.categoriesDesc') }}</p>
              </div>
              <ArrowRight :size="16" class="shortcut-arrow" :class="{ 'rtl-flip': isRtl }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(18, 73, 107, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px var(--space-md) var(--space-md);
  animation: fadeIn 0.15s ease-out;
}

@media (max-width: 640px) {
  .search-backdrop {
    padding: 0;
    align-items: stretch;
  }
}

.search-container {
  background: #FFFFFF;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 680px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .search-container {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background: #FFFFFF;
}

.search-icon {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.search-field {
  flex-grow: 1;
  border: none;
  font-size: 1rem;
  font-family: var(--font-body);
  outline: none;
  color: var(--color-deep-blue);
  background: transparent;
  min-width: 0;
}

.search-field::placeholder {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.clear-btn {
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.search-submit-btn {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  white-space: nowrap;
}

.search-submit-btn:hover {
  background: var(--color-deep-blue);
}

.close-modal-btn {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  white-space: nowrap;
  cursor: pointer;
}

.close-modal-btn:hover {
  background: var(--color-border-light);
}

/* Quick pills row */
.quick-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #F8FAFC;
  border-bottom: 1px solid var(--color-border-light);
}

.pills-label {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.pills-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.pills-scroll::-webkit-scrollbar {
  display: none;
}

.quick-pill {
  font-size: 0.75rem;
  color: var(--color-deep-blue);
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 3px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.quick-pill:hover {
  background: var(--color-primary-blue-light);
  border-color: var(--color-primary-blue);
  color: var(--color-primary-blue);
}

/* Results area */
.results-area {
  max-height: 480px;
  overflow-y: auto;
  padding: var(--space-sm) var(--space-md);
}

@media (max-width: 640px) {
  .results-area {
    max-height: calc(100vh - 120px);
  }
}

.searching-state,
.empty-results {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--color-text-secondary);
}

.search-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-primary-blue-light);
  border-top-color: var(--color-primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-xs);
}

.empty-results p {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 4px;
}

.empty-results span {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  display: block;
  margin-bottom: var(--space-md);
}

.empty-action-btn {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

/* Catalog Direct Banner */
.catalog-direct-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  background: linear-gradient(135deg, #12496B 0%, #1976AD 100%);
  color: #FFFFFF;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.catalog-direct-banner:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-icon {
  color: var(--color-accent-yellow);
  flex-shrink: 0;
}

.banner-title {
  display: block;
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
}

.banner-sub {
  font-size: 0.75rem;
  opacity: 0.88;
  margin-top: 2px;
}

.banner-arrow {
  color: #FFFFFF;
  flex-shrink: 0;
  transition: transform var(--dur-fast) var(--ease-smooth);
}

.banner-arrow.rtl-flip {
  transform: rotate(180deg);
}

.catalog-direct-banner:hover .banner-arrow:not(.rtl-flip) {
  transform: translateX(3px);
}

.catalog-direct-banner:hover .banner-arrow.rtl-flip {
  transform: rotate(180deg) translateX(3px);
}

.suggestions-header {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  padding: 6px 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Results list */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.result-item:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border);
}

.result-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  background: #F8FAFC;
}

.result-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.result-title {
  font-size: 0.875rem;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-bold);
}

.result-ar {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  flex-wrap: wrap;
}

.form-tag,
.brand-tag,
.ingredient-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.ingredient-tag {
  color: var(--color-accent-teal);
  background: #E8F8F5;
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  font-weight: var(--font-weight-semibold);
}

.result-price-col {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

[dir="rtl"] .result-price-col {
  text-align: left;
  align-items: flex-start;
}

.suppliers-avail {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.select-arrow {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: transform var(--dur-fast) var(--ease-smooth);
}

.select-arrow.rtl-flip {
  transform: rotate(180deg);
}

.result-item:hover .select-arrow:not(.rtl-flip) {
  transform: translateX(3px);
  color: var(--color-primary-blue);
}

.result-item:hover .select-arrow.rtl-flip {
  transform: rotate(180deg) translateX(3px);
  color: var(--color-primary-blue);
}

/* Initial Shortcuts */
.initial-shortcuts {
  padding: var(--space-xs) 0;
}

.shortcut-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 12px 14px;
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.shortcut-card:hover {
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: var(--shadow-xs);
  transform: translateY(-1px);
}

.shortcut-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shortcut-icon-box.blue {
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
}

.shortcut-icon-box.green {
  background: #E8F8F5;
  color: var(--color-accent-teal);
}

.shortcut-icon-box.yellow {
  background: #FEF9E7;
  color: #D4AC0D;
}

.shortcut-info {
  flex: 1;
}

.shortcut-info strong {
  display: block;
  font-size: 0.875rem;
  color: var(--color-deep-blue);
}

.shortcut-info p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.shortcut-arrow {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.shortcut-card:hover .shortcut-arrow {
  color: var(--color-primary-blue);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
