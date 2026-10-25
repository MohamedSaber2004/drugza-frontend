<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  Heart,
  ShoppingBag,
  Layers,
  ArrowRight,
  ArrowLeft,
  Building2,
  Package,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Share2
} from 'lucide-vue-next';
import type { Product, ProductSupplierPrice } from '@/types';
import { productsService } from '@/services/products.service';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import ProductCard from '@/components/domain/ProductCard.vue';
import { useCart } from '@/composables/useCart';
import { useFavorites } from '@/composables/useFavorites';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import { onImageError } from '@/utils/placeholders';
import { formatPrice, ceilPrice } from '@/utils/price';
import { encryptId, decryptId } from '@/utils/id-crypto';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { t, locale, isRtl } = useI18n();
const { addItem } = useCart();
const { isFavorite, toggleFavorite } = useFavorites();

const productId = computed(() => decryptId((route.params.id as string) || ''));
const product = ref<Product | null>(null);
const supplierPrices = ref<ProductSupplierPrice[]>([]);
const alternatives = ref<Product[]>([]);
const selectedImage = ref<string>('');
const quantities = ref<Record<string, number>>({});
const directQuantity = ref(1);

const isLoading = ref(true);
const isLoadingAlternatives = ref(false);
const activeTab = ref<'suppliers' | 'alternatives'>('suppliers');

const bestPrice = computed(() => {
  if (supplierPrices.value.length === 0) return product.value?.price || 0;
  return Math.min(...supplierPrices.value.map(s => s.effectiveSalesPrice));
});

const bestDiscount = computed(() => {
  if (supplierPrices.value.length === 0) return product.value?.discountRate || 0;
  return Math.max(...supplierPrices.value.map(s => s.discountRate));
});

const totalStock = computed(() => {
  if (supplierPrices.value.length > 0) {
    return supplierPrices.value.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
  }
  return product.value?.stockQuantity || 0;
});

const suppliersLabel = computed(() => {
  const count = supplierPrices.value.length;
  if (count === 1) {
    return t('common.singleWarehouse');
  }
  return t('products.suppliersAvailable', { count });
});

const providerNames = computed(() =>
  supplierPrices.value
    .map(s => s.inventoryName?.trim())
    .filter((n): n is string => !!n)
    .join(' · ')
);

const fallbackProviderName = computed(() =>
  product.value?.inventoryName?.trim()
    || t('common.authorizedProvider')
);

onMounted(() => {
  loadProductDetails();
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadProductDetails();
    }
  }
);

async function loadProductDetails() {
  if (!productId.value) return;
  isLoading.value = true;
  product.value = null;
  supplierPrices.value = [];
  alternatives.value = [];

  try {
    const [prodData, pricesData] = await Promise.allSettled([
      productsService.getProductById(productId.value, locale.value === 'ar' ? 2 : 1),
      productsService.getSupplierPricesForProduct(productId.value)
    ]);

    if (prodData.status === 'fulfilled' && prodData.value) {
      product.value = prodData.value;
      selectedImage.value = prodData.value.image;
    }

    if (pricesData.status === 'fulfilled' && pricesData.value.length > 0) {
      supplierPrices.value = pricesData.value;
      quantities.value = {};
      for (const sp of pricesData.value) {
        quantities.value[sp.id] = 1;
      }
    }

    // Load alternatives based on active ingredient or category
    if (product.value) {
      loadAlternatives(product.value);
    }
  } catch (err) {
    console.error('Failed to load product detail:', err);
  } finally {
    isLoading.value = false;
  }
}

async function loadAlternatives(prod: Product) {
  isLoadingAlternatives.value = true;
  try {
    if (prod.activeIngredient) {
      const results = await productsService.getProducts({ search: prod.activeIngredient, size: 8 });
      alternatives.value = results.filter(p => p.id !== prod.id).slice(0, 4);
    }
  } catch {
    alternatives.value = [];
  } finally {
    isLoadingAlternatives.value = false;
  }
}

function updateQty(id: string, delta: number) {
  const current = quantities.value[id] || 1;
  const next = Math.max(1, current + delta);
  quantities.value[id] = next;
}

function handleAddSupplierItem(priceRow: ProductSupplierPrice) {
  if (!product.value) return;
  const qty = quantities.value[priceRow.id] || 1;
  addItem(product.value, qty, priceRow);
  toast.success(t('productDetail.addedFromWarehouse', { qty, warehouse: priceRow.inventoryName }));
}

function handleAddDirect() {
  if (!product.value) return;
  addItem(product.value, directQuantity.value);
  toast.success(t('productDetail.addedDirect', { qty: directQuantity.value }));
}

function handleToggleFav() {
  if (!product.value) return;
  const name = locale.value === 'ar' ? (product.value.arabicName || product.value.name) : product.value.name;
  toggleFavorite(product.value.id, name, product.value.productPriceId);
}

function copyShareLink() {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('productDetail.linkCopied'));
  }
}
</script>

<template>
  <div class="product-page">
    <div class="drugza-container">
      <!-- Breadcrumbs Bar -->
      <nav class="product-breadcrumbs" aria-label="Breadcrumbs">
        <router-link to="/" class="bc-link">{{ t('nav.home') }}</router-link>
        <span class="bc-sep">/</span>
        <router-link to="/catalog" class="bc-link">{{ t('catalog.heading') }}</router-link>
        <template v-if="product?.categoryName">
          <span class="bc-sep">/</span>
          <router-link
            :to="product.categoryId ? `/catalog?category=${product.categoryId}` : '/catalog'"
            class="bc-link"
          >
            {{ (locale === 'ar' ? product.categoryArabicName : product.categoryName) || product.categoryName }}
          </router-link>
        </template>
        <span class="bc-sep">/</span>
        <span class="bc-current" v-if="product">
          {{ locale === 'ar' && product.arabicName ? product.arabicName : product.name }}
        </span>
      </nav>

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="product-loading-grid">
        <div class="loading-left">
          <Skeleton height="380px" radius="16px" />
        </div>
        <div class="loading-right">
          <Skeleton height="32px" width="70%" radius="8px" />
          <Skeleton height="20px" width="40%" radius="6px" style="margin-top: 12px;" />
          <Skeleton height="80px" radius="12px" style="margin-top: 24px;" />
          <Skeleton height="160px" radius="12px" style="margin-top: 24px;" />
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!product" class="product-not-found">
        <AlertCircle :size="56" class="not-found-icon" />
        <h2 class="not-found-title">
          {{ t('productDetail.notFoundTitle') }}
        </h2>
        <p class="not-found-text">
          {{ t('productDetail.notFoundDesc') }}
        </p>
        <router-link to="/catalog">
          <Button variant="cta" size="lg">
            <span>{{ t('favoritesPage.exploreCatalog') }}</span>
            <ArrowRight :size="16" />
          </Button>
        </router-link>
      </div>

      <!-- Product Showcase Layout -->
      <div v-else class="product-main-card">
        <div class="product-grid">
          <!-- Gallery Column -->
          <div class="product-gallery-col">
            <div class="main-image-wrap">
              <img
                :src="selectedImage || product.image"
                :alt="product.name"
                class="main-product-image"
                @error="onImageError($event, 'product')"
              />
              <div class="badges-overlay">
                <Badge v-if="bestDiscount > 0" variant="discount" class="discount-pill">
                  -{{ bestDiscount }}%
                </Badge>
                <Badge v-if="product.isFlashSale" variant="warning" class="flash-pill">
                  🔥 {{ t('common.flashSaleBadge') }}
                </Badge>
              </div>
            </div>

            <!-- Thumbnail Carousel if multiple images exist -->
            <div
              v-if="product.productImages && product.productImages.length > 1"
              class="thumbs-strip"
            >
              <button
                v-for="(img, idx) in product.productImages"
                :key="idx"
                type="button"
                class="thumb-btn"
                :class="{ 'is-active': selectedImage === img }"
                @click="selectedImage = img"
              >
                <img :src="img" :alt="product.name" class="thumb-img" @error="onImageError($event, 'product')" />
              </button>
            </div>

            <!-- Trust / EDA Certification Card -->
            <div class="eda-trust-box">
              <ShieldCheck :size="20" class="trust-ico" />
              <div>
                <strong class="trust-title">{{ t('hero.edaCertified') }}</strong>
                <p class="trust-desc">
                  {{ t('productDetail.edaNotice') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Product Details Column -->
          <div class="product-info-col">
            <!-- Category and SKU Bar -->
            <div class="info-top-row">
              <span class="category-tag">
                {{ (locale === 'ar' ? product.categoryArabicName : product.categoryName) || product.categoryName || t('common.pharmaceutical') }}
              </span>
              <span v-if="product.productCode" class="sku-tag">
                SKU: {{ product.productCode }}
              </span>
            </div>

            <!-- Titles -->
            <h1 class="main-title">
              {{ locale === 'ar' && product.arabicName ? product.arabicName : product.name }}
            </h1>
            <h2
              v-if="product.arabicName && product.name !== product.arabicName"
              class="sub-title"
            >
              {{ locale === 'ar' ? product.name : product.arabicName }}
            </h2>

            <!-- Active Ingredient Banner (if exists) -->
            <div v-if="product.activeIngredient" class="active-ingredient-chip">
              <Layers :size="16" class="chip-icon" />
              <div class="chip-content">
                <span class="chip-label">{{ t('productDetailModal.activeIngredient') }}</span>
                <strong class="chip-val">{{ product.activeIngredient }}</strong>
              </div>
            </div>

            <!-- Best Wholesale Price Banner -->
            <div class="wholesale-price-box">
              <div class="price-side">
                <span class="price-caption">{{ t('productDetailModal.wholesalePricesStartingAt') }}</span>
                <div class="price-val-wrap">
                  <PriceDisplay :price="bestPrice" size="lg" />
                  <span
                    v-if="product.originalPrice && ceilPrice(product.originalPrice) > ceilPrice(bestPrice)"
                    class="original-strike"
                  >
                    {{ formatPrice(product.originalPrice) }} {{ t('common.currency') }}
                  </span>
                </div>
              </div>

              <div class="stock-side">
                <div class="stock-pill" :class="totalStock > 0 ? 'in-stock' : 'out-stock'">
                  <span class="pulse-dot"></span>
                  <span>{{ totalStock > 0 ? `${totalStock} ${t('productDetailModal.units')}` : t('common.outOfStock') }}</span>
                </div>
                <span class="providers-count-hint" v-if="supplierPrices.length > 0">
                  {{ suppliersLabel }}
                </span>
                <span class="providers-names" v-if="supplierPrices.length > 0">
                  {{ t('productDetail.providersLabel') }}{{ providerNames }}
                </span>
              </div>
            </div>

            <!-- Specifications Grid -->
            <div class="spec-matrix">
              <div class="spec-cell">
                <span class="spec-k">{{ t('productDetailModal.dosageForm') }}</span>
                <strong class="spec-v">{{ product.form || (locale === 'ar' ? product.categoryArabicName : product.categoryName) || '-' }}</strong>
              </div>
              <div class="spec-cell">
                <span class="spec-k">{{ t('productDetailModal.strength') }}</span>
                <strong class="spec-v">{{ product.strength || '-' }}</strong>
              </div>
              <div class="spec-cell">
                <span class="spec-k">{{ t('productDetail.routeLabel') }}</span>
                <strong class="spec-v">{{ product.route || '-' }}</strong>
              </div>
              <div class="spec-cell">
                <span class="spec-k">{{ t('productDetailModal.packSpecification') }}</span>
                <strong class="spec-v">{{ product.packSize || '-' }}</strong>
              </div>
              <div class="spec-cell">
                <span class="spec-k">{{ t('productDetailModal.brand') }}</span>
                <strong class="spec-v">{{ product.brandName || '-' }}</strong>
              </div>
              <div class="spec-cell">
                <span class="spec-k">{{ t('productDetailModal.manufacturer') }}</span>
                <strong class="spec-v">{{ product.manufacturer || '-' }}</strong>
              </div>
            </div>

            <!-- Quick Action Bar -->
            <div class="quick-action-bar">
              <div class="direct-qty-wrap">
                <button
                  type="button"
                  class="stepper-btn"
                  @click="directQuantity = Math.max(1, directQuantity - 1)"
                >
                  -
                </button>
                <span class="stepper-val">{{ directQuantity }}</span>
                <button
                  type="button"
                  class="stepper-btn"
                  @click="directQuantity++"
                >
                  +
                </button>
              </div>

              <Button
                variant="cta"
                size="lg"
                class="direct-add-btn"
                @click="handleAddDirect"
              >
                <ShoppingBag :size="18" />
                <span>{{ t('products.addToCart') }}</span>
              </Button>

              <button
                type="button"
                class="fav-circle-btn"
                :class="{ 'is-fav': isFavorite(product.id) }"
                :title="isFavorite(product.id) ? t('favorites.removeTooltip') : t('favorites.addTooltip')"
                @click="handleToggleFav"
              >
                <Heart
                  :size="20"
                  :fill="isFavorite(product.id) ? '#DC5B61' : 'none'"
                  :stroke="isFavorite(product.id) ? '#DC5B61' : '#667085'"
                />
              </button>

              <button
                type="button"
                class="share-circle-btn"
                :title="t('common.shareLink')"
                @click="copyShareLink"
              >
                <Share2 :size="18" />
              </button>
            </div>
          </div>
        </div>

        <!-- Details Tabs Navigation -->
        <div class="product-tabs-header">
          <button
            type="button"
            class="p-tab-btn"
            :class="{ 'is-active': activeTab === 'suppliers' }"
            @click="activeTab = 'suppliers'"
          >
            <Building2 :size="16" />
            <span>{{ t('productDetailModal.suppliersTab') }}</span>
            <span class="tab-badge-counter">{{ supplierPrices.length > 0 ? supplierPrices.length : 1 }}</span>
          </button>

          <button
            v-if="alternatives.length > 0"
            type="button"
            class="p-tab-btn"
            :class="{ 'is-active': activeTab === 'alternatives' }"
            @click="activeTab = 'alternatives'"
          >
            <Layers :size="16" />
            <span>{{ t('productDetail.genericSubstitutesTitle') }}</span>
            <span class="tab-badge-counter">{{ alternatives.length }}</span>
          </button>
        </div>

        <!-- Tab 1: Multi-Supplier Pricing Table -->
        <div v-if="activeTab === 'suppliers'" class="p-tab-panel">
          <div class="suppliers-section-header">
            <div>
              <h3 class="panel-heading">{{ t('productDetail.providersStockingTitle') }}</h3>
              <p class="panel-sub">
                {{ t('productDetail.providersStockingDesc') }}
              </p>
            </div>
          </div>

          <!-- Suppliers Desktop Table -->
          <div class="table-responsive desktop-only">
            <table class="wholesale-suppliers-table">
              <thead>
                <tr>
                  <th>{{ t('productDetailModal.supplierCol') }}</th>
                  <th>{{ t('products.discount') }}</th>
                  <th>{{ t('productDetailModal.priceCol') }}</th>
                  <th>{{ t('productDetailModal.stockCol') }}</th>
                  <th>{{ t('providers.minOrder') }}</th>
                  <th>{{ t('productDetailModal.qtyCol') }}</th>
                  <th>{{ t('productDetailModal.actionCol') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="priceRow in supplierPrices" :key="priceRow.id">
                  <td>
                    <div class="sup-meta">
                      <strong class="sup-title">{{ priceRow.inventoryName }}</strong>
                      <span class="delivery-pill">
                        <Truck :size="12" />
                        {{ priceRow.deliveryTime || t('common.expressDelivery') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="discount-tag-pill">
                      {{ priceRow.discountRate }}%
                    </span>
                  </td>
                  <td>
                    <div class="price-cell-wrap">
                      <strong class="net-p">{{ formatPrice(priceRow.effectiveSalesPrice) }} {{ t('common.currency') }}</strong>
                      <span class="base-p">{{ formatPrice(priceRow.salesPrice) }} {{ t('common.currency') }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="stock-pill in-stock">
                      <span>{{ priceRow.stockQuantity }} {{ t('productDetailModal.units') }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="min-order-pill">{{ priceRow.minOrder }} {{ t('common.currency') }}</span>
                  </td>
                  <td>
                    <div class="mini-stepper">
                      <button type="button" class="mini-step-btn" @click="updateQty(priceRow.id, -1)">-</button>
                      <span class="mini-step-val">{{ quantities[priceRow.id] || 1 }}</span>
                      <button type="button" class="mini-step-btn" @click="updateQty(priceRow.id, 1)">+</button>
                    </div>
                  </td>
                  <td>
                    <Button
                      variant="cta"
                      size="sm"
                      @click="handleAddSupplierItem(priceRow)"
                    >
                      <ShoppingBag :size="14" />
                      <span>{{ t('products.addToCart') }}</span>
                    </Button>
                  </td>
                </tr>

                <!-- If 0 supplier rows from available-by-product, render primary product row -->
                <tr v-if="supplierPrices.length === 0">
                  <td>
                    <div class="sup-meta">
                      <strong class="sup-title">{{ fallbackProviderName }}</strong>
                      <span class="delivery-pill">
                        <Truck :size="12" />
                        {{ t('common.expressDelivery') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="discount-tag-pill">
                      {{ product.discountRate || 0 }}%
                    </span>
                  </td>
                  <td>
                    <div class="price-cell-wrap">
                      <strong class="net-p">{{ formatPrice(product.price) }} {{ t('common.currency') }}</strong>
                      <span v-if="product.originalPrice && ceilPrice(product.originalPrice) > ceilPrice(product.price)" class="base-p">
                        {{ formatPrice(product.originalPrice) }} {{ t('common.currency') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="stock-pill" :class="totalStock > 0 ? 'in-stock' : 'out-stock'">
                      <span>{{ totalStock }} {{ t('productDetailModal.units') }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="min-order-pill">1 {{ t('common.currency') }}</span>
                  </td>
                  <td>
                    <div class="mini-stepper">
                      <button type="button" class="mini-step-btn" @click="directQuantity = Math.max(1, directQuantity - 1)">-</button>
                      <span class="mini-step-val">{{ directQuantity }}</span>
                      <button type="button" class="mini-step-btn" @click="directQuantity++">+</button>
                    </div>
                  </td>
                  <td>
                    <Button
                      variant="cta"
                      size="sm"
                      @click="handleAddDirect"
                    >
                      <ShoppingBag :size="14" />
                      <span>{{ t('products.addToCart') }}</span>
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Suppliers Cards List -->
          <div class="mobile-only suppliers-mobile-list">
            <div
              v-for="priceRow in supplierPrices"
              :key="'m-' + priceRow.id"
              class="mobile-supplier-card"
            >
              <div class="m-card-top">
                <div>
                  <strong class="m-sup-name">{{ priceRow.inventoryName }}</strong>
                  <span class="delivery-pill">
                    <Truck :size="12" />
                    {{ priceRow.deliveryTime || t('common.expressDelivery') }}
                  </span>
                </div>
                <span class="discount-tag-pill">{{ priceRow.discountRate }}%</span>
              </div>

              <div class="m-card-pricing">
                <strong class="net-p">{{ formatPrice(priceRow.effectiveSalesPrice) }} {{ t('common.currency') }}</strong>
                <span class="base-p">{{ formatPrice(priceRow.salesPrice) }} {{ t('common.currency') }}</span>
              </div>

              <div class="m-card-actions">
                <div class="mini-stepper">
                  <button type="button" class="mini-step-btn" @click="updateQty(priceRow.id, -1)">-</button>
                  <span class="mini-step-val">{{ quantities[priceRow.id] || 1 }}</span>
                  <button type="button" class="mini-step-btn" @click="updateQty(priceRow.id, 1)">+</button>
                </div>
                <Button variant="cta" size="sm" @click="handleAddSupplierItem(priceRow)">
                  <ShoppingBag :size="14" />
                  <span>{{ t('products.addToCart') }}</span>
                </Button>
              </div>
            </div>

            <!-- Fallback card when no live supplier prices exist -->
            <div v-if="supplierPrices.length === 0" class="mobile-supplier-card">
              <div class="m-card-top">
                <div>
                  <strong class="m-sup-name">{{ fallbackProviderName }}</strong>
                  <span class="delivery-pill">
                    <Truck :size="12" />
                    {{ t('common.expressDelivery') }}
                  </span>
                </div>
                <span v-if="product.discountRate" class="discount-tag-pill">{{ product.discountRate }}%</span>
              </div>
              <div class="m-card-pricing">
                <strong class="net-p">{{ formatPrice(product.price) }} {{ t('common.currency') }}</strong>
                <span v-if="product.originalPrice && ceilPrice(product.originalPrice) > ceilPrice(product.price)" class="base-p">
                  {{ formatPrice(product.originalPrice) }} {{ t('common.currency') }}
                </span>
              </div>
              <div class="m-card-actions">
                <div class="mini-stepper">
                  <button type="button" class="mini-step-btn" @click="directQuantity = Math.max(1, directQuantity - 1)">-</button>
                  <span class="mini-step-val">{{ directQuantity }}</span>
                  <button type="button" class="mini-step-btn" @click="directQuantity++">+</button>
                </div>
                <Button variant="cta" size="sm" @click="handleAddDirect">
                  <ShoppingBag :size="14" />
                  <span>{{ t('products.addToCart') }}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Alternatives Grid -->
        <div v-else-if="activeTab === 'alternatives'" class="p-tab-panel">
          <div class="alternatives-header">
            <h3 class="panel-heading">{{ t('productDetail.genericSubstitutesTitle') }}</h3>
            <p class="panel-sub">{{ t('productDetail.genericSubstitutesDesc') }}</p>
          </div>

          <div v-if="alternatives.length > 0" class="alternatives-catalog-grid">
            <ProductCard
              v-for="alt in alternatives"
              :key="alt.id"
              :product="alt"
              @view-details="router.push(`/products/${encryptId(alt.id)}`)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-page {
  min-height: 80vh;
  padding: var(--space-lg) 0 var(--space-3xl);
  background: #F8FAFC;
}

.product-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.8125rem;
  margin-bottom: var(--space-md);
  color: var(--color-text-secondary);
}

.bc-link {
  color: var(--color-primary-blue);
  text-decoration: none;
  transition: color 0.2s;
}

.bc-link:hover {
  text-decoration: underline;
}

.bc-sep {
  color: #CBD5E1;
}

.bc-current {
  color: var(--color-text-primary);
  font-weight: 600;
}

.product-loading-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: var(--space-xl);
  background: #FFFFFF;
  padding: var(--space-xl);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
}

@media (max-width: 900px) {
  .product-loading-grid {
    grid-template-columns: 1fr;
  }
}

.product-not-found {
  text-align: center;
  padding: var(--space-3xl) var(--space-md);
  background: #FFFFFF;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  max-width: 600px;
  margin: var(--space-2xl) auto;
}

.not-found-icon {
  color: #DC5B61;
  margin-bottom: var(--space-md);
}

.not-found-title {
  font-size: 1.5rem;
  color: var(--color-deep-blue);
  margin-bottom: var(--space-xs);
}

.not-found-text {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
}

.product-main-card {
  background: #FFFFFF;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.product-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: var(--space-xl);
  padding: var(--space-xl);
}

@media (max-width: 960px) {
  .product-grid {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }
}

/* Gallery Column */
.product-gallery-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.main-image-wrap {
  position: relative;
  width: 100%;
  height: 380px;
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--space-md);
}

.main-product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.main-image-wrap:hover .main-product-image {
  transform: scale(1.04);
}

.badges-overlay {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2;
}

:global([dir="rtl"]) .badges-overlay {
  right: auto;
  left: 14px;
}

.thumbs-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.thumb-btn {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  background: #FFFFFF;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.thumb-btn.is-active,
.thumb-btn:hover {
  border-color: var(--color-primary-blue);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.eda-trust-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.trust-ico {
  color: #16A34A;
  flex-shrink: 0;
  margin-top: 2px;
}

.trust-title {
  display: block;
  font-size: 0.875rem;
  color: #166534;
  margin-bottom: 2px;
}

.trust-desc {
  font-size: 0.75rem;
  color: #15803D;
  margin: 0;
  line-height: 1.4;
}

/* Info Column */
.product-info-col {
  display: flex;
  flex-direction: column;
}

.info-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.category-tag {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary-blue);
  letter-spacing: 0.05em;
}

.sku-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: #F1F5F9;
  padding: 3px 8px;
  border-radius: 4px;
}

.main-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--color-deep-blue);
  margin: 0 0 4px;
  line-height: 1.25;
}

.sub-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
}

.active-ingredient-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #EEF6FA;
  border: 1px solid #D5E8F3;
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  margin-bottom: var(--space-md);
}

.chip-icon {
  color: var(--color-primary-blue);
}

.chip-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  display: block;
}

.chip-val {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
}

.wholesale-price-box {
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.price-caption {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 2px;
}

.price-val-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.original-strike {
  font-size: 0.9375rem;
  color: #94A3B8;
  text-decoration: line-through;
}

.stock-side {
  text-align: right;
}

:global([dir="rtl"]) .stock-side {
  text-align: left;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.stock-pill.in-stock {
  background: #DCFCE7;
  color: #166534;
}

.stock-pill.out-stock {
  background: #FEE2E2;
  color: #991B1B;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16A34A;
  animation: pulseDot 1.5s infinite;
}

@keyframes pulseDot {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.providers-count-hint {
  display: block;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.providers-names {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 2px;
}

/* Specifications Matrix */
.spec-matrix {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: var(--space-lg);
}

.spec-cell {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
}

.spec-k {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 2px;
}

.spec-v {
  font-size: 0.875rem;
  color: var(--color-deep-blue);
  word-break: break-word;
}

/* Quick Action Bar */
.quick-action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: var(--space-sm);
}

.direct-qty-wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #FFFFFF;
  overflow: hidden;
  height: 48px;
}

.stepper-btn {
  width: 40px;
  height: 100%;
  background: #F8FAFC;
  border: none;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  cursor: pointer;
  transition: background 0.2s;
}

.stepper-btn:hover {
  background: #E2E8F0;
}

.stepper-val {
  min-width: 40px;
  text-align: center;
  font-weight: 700;
  color: var(--color-deep-blue);
}

.direct-add-btn {
  flex: 1;
  height: 48px;
}

.fav-circle-btn,
.share-circle-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748B;
  transition: all 0.2s;
}

.fav-circle-btn:hover,
.share-circle-btn:hover {
  background: #F8FAFC;
  border-color: var(--color-primary-blue);
  color: var(--color-primary-blue);
}

.fav-circle-btn.is-fav {
  border-color: #FECDD3;
  background: #FFF1F2;
}

/* Tabs Header */
.product-tabs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  background: #F8FAFC;
  padding: 0 var(--space-xl);
}

@media (max-width: 640px) {
  .product-tabs-header {
    padding: 0 var(--space-md);
    overflow-x: auto;
  }
}

.p-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.p-tab-btn:hover {
  color: var(--color-primary-blue);
}

.p-tab-btn.is-active {
  color: var(--color-primary-blue);
  border-bottom-color: var(--color-primary-blue);
  background: #FFFFFF;
}

.tab-badge-counter {
  background: #E2E8F0;
  color: var(--color-text-primary);
  border-radius: 9999px;
  font-size: 0.6875rem;
  padding: 2px 7px;
}

.p-tab-btn.is-active .tab-badge-counter {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

/* Tab Panels */
.p-tab-panel {
  padding: var(--space-xl);
}

@media (max-width: 640px) {
  .p-tab-panel {
    padding: var(--space-md);
  }
}

.panel-heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin: 0 0 4px;
}

.panel-sub {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-lg);
}

/* Wholesale Suppliers Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.wholesale-suppliers-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.wholesale-suppliers-table th {
  background: #F8FAFC;
  padding: 12px 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  border-bottom: 1px solid var(--color-border);
  text-align: inherit;
}

.wholesale-suppliers-table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.wholesale-suppliers-table tr:hover td {
  background: #F8FAFC;
}

.sup-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sup-title {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
}

.delivery-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6875rem;
  color: #0369A1;
  background: #E0F2FE;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.discount-tag-pill {
  display: inline-block;
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  border-radius: 9999px;
  padding: 3px 10px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.price-cell-wrap {
  display: flex;
  flex-direction: column;
}

.net-p {
  font-size: 1rem;
  color: var(--color-primary-blue);
}

.base-p {
  font-size: 0.75rem;
  color: #94A3B8;
  text-decoration: line-through;
}

.min-order-pill {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.mini-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #FFFFFF;
}

.mini-step-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #F8FAFC;
  font-weight: 700;
  cursor: pointer;
}

.mini-step-val {
  min-width: 28px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* Mobile Supplier Card */
.mobile-supplier-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  margin-bottom: 12px;
}

.m-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.m-sup-name {
  display: block;
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
  margin-bottom: 2px;
}

.m-card-pricing {
  margin-bottom: 12px;
}

.m-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Alternatives Grid */
.alternatives-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-md);
}

@media (min-width: 769px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
}
</style>
