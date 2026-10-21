<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Building2,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  Search,
  ChevronRight,
  ShoppingBag,
  SlidersHorizontal,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-vue-next';
import type { Supplier, Product, Category } from '@/types';
import { providersService, productsService, categoriesService } from '@/services';
import ProductCard from '@/components/domain/ProductCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { useI18n } from '@/composables/useI18n';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const providerId = ref(route.params.id as string);
const provider = ref<Supplier | null>(null);
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const selectedProduct = ref<Product | null>(null);
const isProductModalOpen = ref(false);
const isLoading = ref(true);
const currentPage = ref(1);
const pageSize = 12;

onMounted(() => {
  loadData();
});

watch(
  () => route.params.id,
  (newId) => {
    providerId.value = newId as string;
    currentPage.value = 1;
    loadData();
  }
);

async function loadData() {
  isLoading.value = true;
  try {
    const [prov, prods, cats] = await Promise.allSettled([
      providersService.getProviderById(providerId.value),
      productsService.getProductsByProvider(providerId.value),
      categoriesService.getCategories()
    ]);
    if (prov.status === 'fulfilled') provider.value = prov.value;
    if (prods.status === 'fulfilled') products.value = prods.value;
    if (cats.status === 'fulfilled' && cats.value.length > 0) categories.value = cats.value;
  } catch (e) {
    console.warn('Error loading provider detail:', e);
  } finally {
    isLoading.value = false;
  }
  if (route.query.category) {
    selectedCategory.value = route.query.category as string;
  }
}

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    if (selectedCategory.value !== 'all' && p.categoryId !== selectedCategory.value) {
      return false;
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q) || (p.arabicName && p.arabicName.includes(q));
      const matchIng = p.activeIngredient?.toLowerCase().includes(q);
      if (!matchName && !matchIng) return false;
    }
    return true;
  });
});

watch([searchQuery, selectedCategory], () => {
  currentPage.value = 1;
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredProducts.value.slice(start, start + pageSize);
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isProductModalOpen.value = true;
}
</script>

<template>
  <div class="provider-detail-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <router-link to="/providers">{{ t('nav.distributors') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <span class="current">{{ locale === 'ar' && provider?.arabicName ? provider.arabicName : (provider?.businessName || t('nav.distributors')) }}</span>
      </nav>

      <!-- Provider Profile Header Card -->
      <div v-if="provider" class="provider-hero-card">
        <div class="profile-top-row">
          <div class="provider-logo-box">
            <img v-if="provider.profileImage" :src="provider.profileImage" :alt="provider.businessName" />
            <Building2 v-else :size="36" />
          </div>

          <div class="provider-main-info">
            <div class="title-badge-row">
              <h1 class="provider-title">{{ locale === 'ar' && provider.arabicName ? provider.arabicName : provider.businessName }}</h1>
              <span class="verified-badge">
                <ShieldCheck :size="15" />
                {{ t('providerDetail.verifiedDistributor') }}
              </span>
            </div>
            <p v-if="locale === 'ar' && provider.arabicName && provider.arabicName !== provider.businessName" class="provider-ar">{{ provider.businessName }}</p>
            <p v-else-if="locale === 'en' && provider.arabicName && provider.arabicName !== provider.businessName" class="provider-ar">{{ provider.arabicName }}</p>

            <div class="meta-strip">
              <span class="meta-item">
                <MapPin :size="14" />
                {{ provider.location || 'Cairo & Giza Hub' }}
              </span>
              <span class="meta-item">
                <Clock :size="14" />
                {{ t('providerDetail.deliveryEstimate') }} <strong>{{ provider.deliverySpeed || 'Same Day' }}</strong>
              </span>
              <span v-if="provider.phoneNumber" class="meta-item">
                <Phone :size="14" />
                {{ provider.phoneNumber }}
              </span>
              <span v-if="provider.email" class="meta-item">
                <Mail :size="14" />
                {{ provider.email }}
              </span>
            </div>
          </div>

          <!-- Highlight Spec Box -->
          <div class="provider-order-spec-card">
            <span class="min-label">{{ t('providerDetail.minOrder') }}</span>
            <strong class="min-amount">{{ provider.minOrder || 800 }} {{ t('common.currency') }}</strong>
            <span class="min-subtext">{{ t('providerDetail.hours') }}</span>
          </div>
        </div>

        <!-- Filter bar within provider store -->
        <div class="provider-filter-bar">
          <div class="search-box">
            <Search :size="16" class="search-ico" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="locale === 'ar' ? `البحث في أدوية ${provider.arabicName || provider.businessName}...` : `Search medicines in ${provider.businessName}...`"
              class="search-field"
            />
          </div>

          <div class="category-pills">
            <button
              class="pill-btn"
              :class="{ 'is-active': selectedCategory === 'all' }"
              @click="selectedCategory = 'all'"
            >
              {{ t('common.all') }} ({{ products.length }})
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="pill-btn"
              :class="{ 'is-active': selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              {{ locale === 'ar' && cat.arabicName ? cat.arabicName : cat.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <section class="provider-products-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">{{ t('providerDetail.productsHeading') }} ({{ filteredProducts.length }})</h2>
            <p class="section-desc">{{ t('providerDetail.productsDesc') }}</p>
          </div>
        </div>

        <div v-if="filteredProducts.length > 0" class="products-grid">
          <ProductCard
            v-for="prod in paginatedProducts"
            :key="prod.id"
            :product="prod"
            @view-details="handleViewProduct"
          />
        </div>

        <!-- Provider Products Pagination -->
        <Pagination
          v-if="filteredProducts.length > 0"
          v-model="currentPage"
          :total-items="filteredProducts.length"
          :page-size="pageSize"
          :item-label="locale === 'ar' ? 'منتج' : 'products'"
        />

        <div v-else class="empty-state">
          <h3>{{ t('providerDetail.noProductsFound') }}</h3>
          <p>{{ t('catalog.noProductsDesc') }}</p>
          <Button variant="outline" size="sm" @click="searchQuery = ''; selectedCategory = 'all'">
            {{ t('catalog.resetFilters') }}
          </Button>
        </div>
      </section>
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
.provider-detail-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-lg);
}

.breadcrumb-row a {
  color: var(--color-text-secondary);
}
.breadcrumb-row a:hover {
  color: var(--color-primary-blue);
}
.breadcrumb-row .current {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
}

/* Provider Hero Card */
.provider-hero-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.profile-top-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.provider-logo-box {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-lg);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.provider-logo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.provider-main-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-badge-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.provider-title {
  font-size: 1.75rem;
  color: var(--color-deep-blue);
}

@media (max-width: 640px) {
  .provider-title {
    font-size: 1.375rem;
  }
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-success-bg);
  color: var(--color-success);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
}

.provider-ar {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.meta-strip {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-top: 6px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.provider-order-spec-card {
  background: var(--color-pale-blue);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 220px;
}

.min-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.min-amount {
  font-size: 1.5rem;
  color: var(--color-primary-blue);
  font-family: var(--font-display);
}

.min-subtext {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

/* Filter bar */
.provider-filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
  flex-grow: 1;
}

.search-ico {
  position: absolute;
  left: 12px;
  color: var(--color-text-tertiary);
}

[dir="rtl"] .search-ico {
  left: auto;
  right: 12px;
}

.search-field {
  width: 100%;
  height: 40px;
  padding: 0 16px 0 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  background: var(--color-off-white);
  outline: none;
}

[dir="rtl"] .search-field {
  padding: 0 36px 0 16px;
}

.category-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
}

.pill-btn {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.pill-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-deep-blue);
}

.pill-btn.is-active {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border-color: var(--color-primary-blue);
}

/* Products Section */
.section-header {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: 1.625rem;
  color: var(--color-deep-blue);
}

.section-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl);
  background: #FFFFFF;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.empty-state h3 {
  font-size: 1.125rem;
  color: var(--color-deep-blue);
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}
</style>
