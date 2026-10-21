<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  ShoppingBag
} from 'lucide-vue-next';
import type { Category, Supplier, Product } from '@/types';
import { categoriesService } from '@/services/categories.service';
import { providersService } from '@/services/providers.service';
import { productsService } from '@/services/products.service';
import SupplierCard from '@/components/domain/SupplierCard.vue';
import ProductCard from '@/components/domain/ProductCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import Button from '@/components/ui/Button.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { useI18n } from '@/composables/useI18n';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const categoryId = ref(route.params.id as string);
const category = ref<Category | null>(null);
const suppliers = ref<Supplier[]>([]);
const categoryProducts = ref<Product[]>([]);
const selectedProduct = ref<Product | null>(null);
const isProductModalOpen = ref(false);
const isLoading = ref(true);

const suppliersPage = ref(1);
const productsPage = ref(1);
const pageSize = 12;

const paginatedSuppliers = computed(() => {
  const start = (suppliersPage.value - 1) * pageSize;
  return suppliers.value.slice(start, start + pageSize);
});

const paginatedCategoryProducts = computed(() => {
  const start = (productsPage.value - 1) * pageSize;
  return categoryProducts.value.slice(start, start + pageSize);
});

onMounted(() => {
  loadData();
});

watch(
  () => route.params.id,
  (newId) => {
    categoryId.value = newId as string;
    suppliersPage.value = 1;
    productsPage.value = 1;
    loadData();
  }
);

async function loadData() {
  isLoading.value = true;
  try {
    const [cat, sups, prods] = await Promise.allSettled([
      categoriesService.getCategoryById(categoryId.value),
      providersService.getProviders(),
      productsService.getProductsByCategory(categoryId.value)
    ]);

    if (cat.status === 'fulfilled') {
      category.value = cat.value;
    }
    if (sups.status === 'fulfilled') {
      suppliers.value = sups.value;
    }
    if (prods.status === 'fulfilled') {
      categoryProducts.value = prods.value;
    }
  } catch {
    //
  } finally {
    isLoading.value = false;
  }
}

function handleSelectSupplier(supplier: Supplier) {
  router.push(`/providers/${supplier.id}?category=${categoryId.value}`);
}

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isProductModalOpen.value = true;
}
</script>

<template>
  <div class="category-providers-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <router-link to="/categories">{{ t('nav.categories') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <span class="current">{{ locale === 'ar' && category?.arabicName ? category.arabicName : (category?.name || t('nav.categories')) }}</span>
      </nav>

      <!-- Category Hero Header Banner -->
      <div v-if="category" class="cat-hero-card">
        <div class="cat-hero-content">
          <span class="cat-badge">{{ t('categories.badge') }}</span>
          <h1 class="cat-title">{{ locale === 'ar' && category.arabicName ? category.arabicName : category.name }}</h1>
          <p v-if="locale === 'ar' && category.arabicName && category.arabicName !== category.name" class="cat-ar-title">{{ category.name }}</p>
          <p v-else-if="locale === 'en' && category.arabicName && category.arabicName !== category.name" class="cat-ar-title">{{ category.arabicName }}</p>
          <p class="cat-desc">{{ category.description }}</p>
          <div class="cat-stats-row">
            <span class="stat-tag">
              <Building2 :size="15" />
              <strong>{{ t('categoryProvidersPage.providersCount', { count: suppliers.length }) }}</strong>
            </span>
            <span class="stat-tag">
              <Layers :size="15" />
              <strong>{{ t('categories.itemsCount', { count: categoryProducts.length }) }}</strong>
            </span>
          </div>
        </div>

        <div class="cat-hero-visual">
          <img :src="category.imageName" :alt="category.name" class="cat-hero-img" />
        </div>
      </div>

      <!-- Section: Verified Providers for this Category -->
      <section class="providers-section">
        <div class="section-title-wrap">
          <div>
            <span class="sub-label">{{ t('providers.badge') }}</span>
            <h2 class="section-title">
              {{ t('categoryProvidersPage.heading') }} {{ locale === 'ar' && category?.arabicName ? category.arabicName : category?.name }}
            </h2>
            <p class="section-subtitle">
              {{ t('categoryProvidersPage.subtitle') }}
            </p>
          </div>
        </div>

        <div class="providers-grid">
          <div
            v-for="sup in paginatedSuppliers"
            :key="sup.id"
            class="provider-supplier-box"
            @click="handleSelectSupplier(sup)"
          >
            <div class="box-top">
              <div class="sup-avatar">
                <img v-if="sup.profileImage" :src="sup.profileImage" :alt="sup.businessName" />
                <Building2 v-else :size="24" />
              </div>
              <div class="sup-meta-col">
                <div class="sup-title-row">
                  <h3 class="sup-company-name">{{ sup.businessName }}</h3>
                  <span class="verified-tag">
                    <ShieldCheck :size="13" />
                    {{ t('providers.certifiedBadge') }}
                  </span>
                </div>
                <div class="loc-row">
                  <MapPin :size="13" />
                  <span>{{ sup.location || 'Cairo & Giza' }}</span>
                </div>
              </div>
            </div>

            <div class="box-specs">
              <div class="spec-cell">
                <span class="spec-k">{{ t('providers.minOrder') }}</span>
                <strong class="spec-v">{{ sup.minOrder || 800 }} {{ t('common.currency') }}</strong>
              </div>
              <div class="spec-cell">
                <span class="spec-k">{{ t('providers.deliveryTime') }}</span>
                <strong class="spec-v">{{ sup.deliverySpeed || 'Same Day' }}</strong>
              </div>
              <div class="spec-cell rating">
                <span class="spec-k">{{ locale === 'ar' ? 'التقييم' : 'Rating' }}</span>
                <div class="stars-val">
                  <Star :size="13" fill="#F3CE79" stroke="#F3CE79" />
                  <strong>{{ sup.rating || '4.9' }}</strong>
                </div>
              </div>
            </div>

            <Button
              variant="cta"
              size="sm"
              block
              class="browse-sup-btn"
            >
              <span>{{ t('categoryProvidersPage.exploreProducts') }}</span>
              <ArrowRight :size="15" class="arrow-icon" />
            </Button>
          </div>
        </div>

        <!-- Suppliers Pagination -->
        <Pagination
          v-if="suppliers.length > 0"
          v-model="suppliersPage"
          :total-items="suppliers.length"
          :page-size="pageSize"
          :item-label="t('nav.distributors')"
        />
      </section>

      <!-- Section: Available Products in this Category -->
      <section v-if="categoryProducts.length > 0" class="category-products-section">
        <div class="section-title-wrap">
          <div>
            <span class="sub-label">{{ t('products.badge') }}</span>
            <h2 class="section-title">{{ category?.name || 'Category Products' }}</h2>
          </div>
          <router-link :to="`/catalog?category=${categoryId}`" class="view-catalog-link">
            <span>{{ t('products.viewAllProducts') }}</span>
            <ArrowRight :size="16" class="arrow-icon" />
          </router-link>
        </div>

        <div class="products-grid">
          <ProductCard
            v-for="prod in paginatedCategoryProducts"
            :key="prod.id"
            :product="prod"
            @view-details="handleViewProduct"
          />
        </div>

        <!-- Products Pagination -->
        <Pagination
          v-if="categoryProducts.length > 0"
          v-model="productsPage"
          :total-items="categoryProducts.length"
          :page-size="pageSize"
          :item-label="locale === 'ar' ? 'منتج' : 'products'"
        />
      </section>
    </div>

    <!-- Modal -->
    <ProductDetailModal
      :product="selectedProduct"
      :is-open="isProductModalOpen"
      @close="isProductModalOpen = false"
    />
  </div>
</template>

<style scoped>
.category-providers-page {
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

/* Category Hero Card */
.cat-hero-card {
  background: linear-gradient(135deg, #12496B 0%, #1976AD 100%);
  border-radius: var(--radius-2xl);
  padding: var(--space-2xl);
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  align-items: center;
  gap: var(--space-xl);
  color: #FFFFFF;
  margin-bottom: var(--space-2xl);
  box-shadow: var(--shadow-md);
}

@media (max-width: 960px) {
  .cat-hero-card {
    grid-template-columns: 1fr;
    padding: var(--space-lg);
  }
}

.cat-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-accent-yellow);
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.cat-title {
  font-size: 2.25rem;
  color: #FFFFFF;
  line-height: 1.2;
}

@media (max-width: 640px) {
  .cat-title {
    font-size: 1.625rem;
  }
}

.cat-ar-title {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
}

.cat-desc {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: var(--space-sm) 0;
}

.cat-stats-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.8125rem;
}

.cat-hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-hero-img {
  width: 100%;
  max-width: 320px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-xl);
  border: 3px solid rgba(255, 255, 255, 0.2);
}

/* Sections */
.providers-section,
.category-products-section {
  margin-bottom: var(--space-3xl);
}

.section-title-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.sub-label {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-primary-blue);
  letter-spacing: 0.08em;
  display: block;
  margin-bottom: 4px;
}

.section-title {
  font-size: 1.75rem;
  color: var(--color-deep-blue);
}

@media (max-width: 640px) {
  .section-title {
    font-size: 1.375rem;
  }
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin-top: 4px;
}

/* Providers Grid */
.providers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1024px) {
  .providers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .providers-grid {
    grid-template-columns: 1fr;
  }
}

.provider-supplier-box {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-smooth);
}

.provider-supplier-box:hover {
  border-color: var(--color-primary-blue);
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.box-top {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.sup-avatar {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-pale-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-blue);
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.sup-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sup-meta-col {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.sup-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sup-company-name {
  font-size: 1rem;
  color: var(--color-deep-blue);
}

.verified-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  background: var(--color-success-bg);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.sup-ar-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.loc-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.box-specs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xs);
  padding: var(--space-xs) 0;
  border-top: 1px dashed var(--color-border-light);
  border-bottom: 1px dashed var(--color-border-light);
  text-align: center;
}

.spec-cell {
  display: flex;
  flex-direction: column;
}

.spec-k {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.spec-v {
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
}

.stars-val {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.browse-sup-btn {
  margin-top: auto;
}

/* Products in Category */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.view-catalog-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-semibold);
}
</style>
