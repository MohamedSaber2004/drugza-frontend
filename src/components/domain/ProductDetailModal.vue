<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { X, Layers, ShoppingBag, ShieldCheck, Truck, Star, Check, ArrowRight, Heart, ExternalLink } from 'lucide-vue-next';
import type { Product, ProductSupplierPrice } from '@/types';
import { productsService } from '@/services/products.service';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import { useCart } from '@/composables/useCart';
import { useFavorites } from '@/composables/useFavorites';
import { useI18n } from '@/composables/useI18n';
import { onImageError } from '@/utils/placeholders';
import { formatPrice, ceilPrice } from '@/utils/price';
import { encryptId } from '@/utils/id-crypto';

const props = defineProps<{
  product: Product | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-alternative', product: Product): void;
}>();

const { t, locale } = useI18n();
const { addItem } = useCart();
const { isFavorite, toggleFavorite } = useFavorites();

const activeTab = ref<'suppliers' | 'alternatives'>('suppliers');
const liveProduct = ref<Product | null>(null);
const currentProduct = computed(() => liveProduct.value || props.product);

const supplierPrices = ref<ProductSupplierPrice[]>([]);
const alternatives = ref<Product[]>([]);
const directQuantity = ref(1);
const quantities = ref<Record<string, number>>({});
const isLoadingPrices = ref(false);

const bestPrice = computed(() => {
  if (supplierPrices.value.length === 0) return currentProduct.value?.price || 0;
  return Math.min(...supplierPrices.value.map(s => s.effectiveSalesPrice));
});

const fallbackProviderName = computed(() =>
  currentProduct.value?.inventoryName?.trim()
    || t('common.authorizedProvider')
);

watch(
  () => props.product,
  (newProd) => {
    if (newProd) {
      loadDetails(newProd);
    }
  },
  { immediate: true }
);

async function loadDetails(prod: Product) {
  liveProduct.value = prod;
  isLoadingPrices.value = true;
  alternatives.value = [];

  // Run full product enrichment, supplier prices, and active-ingredient alternatives in parallel
  const [fullResult, pricesResult, altResult] = await Promise.allSettled([
    productsService.getProductById(prod.id),
    productsService.getSupplierPricesForProduct(prod.id),
    prod.activeIngredient
      ? productsService.getProducts({ search: prod.activeIngredient, size: 8 })
      : Promise.resolve([])
  ]);

  if (fullResult.status === 'fulfilled' && fullResult.value && liveProduct.value) {
    const full = fullResult.value;
    liveProduct.value = {
      ...liveProduct.value,
      description: liveProduct.value.description || full.description,
      arabicDescription: liveProduct.value.arabicDescription || full.arabicDescription,
      brandName: liveProduct.value.brandName || full.brandName,
      manufacturer: liveProduct.value.manufacturer || full.manufacturer,
      categoryName: liveProduct.value.categoryName || full.categoryName,
      categoryArabicName: liveProduct.value.categoryArabicName || full.categoryArabicName,
      form: liveProduct.value.form || full.form,
      strength: liveProduct.value.strength || full.strength,
      packSize: liveProduct.value.packSize || full.packSize,
      activeIngredient: liveProduct.value.activeIngredient || full.activeIngredient,
      stockQuantity: full.stockQuantity || liveProduct.value.stockQuantity,
      price: full.price || liveProduct.value.price,
      originalPrice: full.originalPrice || liveProduct.value.originalPrice,
      discountRate: full.discountRate ?? liveProduct.value.discountRate
    };
  }

  if (pricesResult.status === 'fulfilled') {
    supplierPrices.value = pricesResult.value;
    quantities.value = {};
    for (const s of pricesResult.value) {
      quantities.value[s.id] = 1;
    }
  } else {
    supplierPrices.value = [];
  }

  if (altResult.status === 'fulfilled' && Array.isArray(altResult.value)) {
    alternatives.value = altResult.value.filter(a => a.id !== prod.id).slice(0, 6);
  } else {
    alternatives.value = [];
  }

  directQuantity.value = 1;
  isLoadingPrices.value = false;
}

function updateQty(priceId: string, delta: number) {
  const current = quantities.value[priceId] || 1;
  const next = Math.max(1, current + delta);
  quantities.value[priceId] = next;
}

function addFromSupplier(priceRow: ProductSupplierPrice) {
  if (!props.product) return;
  const qty = quantities.value[priceRow.id] || 1;
  addItem(props.product, qty, priceRow);
  emit('close');
}

function addDirectProduct() {
  if (!props.product) return;
  addItem(props.product, directQuantity.value);
  emit('close');
}
</script>

<template>
  <div v-if="isOpen && currentProduct" class="modal-backdrop" @click="emit('close')">
    <div class="modal-dialog" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="title-wrap">
          <span class="category-pill">{{ (locale === 'ar' ? currentProduct.categoryArabicName : currentProduct.categoryName) || currentProduct.categoryName || t('common.pharmaceutical') }}</span>
          <h2 class="modal-title">{{ locale === 'ar' && currentProduct.arabicName ? currentProduct.arabicName : currentProduct.name }}</h2>
          <span v-if="locale === 'ar' && currentProduct.arabicName && currentProduct.arabicName !== currentProduct.name" class="modal-ar-title">{{ currentProduct.name }}</span>
          <span v-else-if="locale === 'en' && currentProduct.arabicName && currentProduct.arabicName !== currentProduct.name" class="modal-ar-title">{{ currentProduct.arabicName }}</span>
        </div>
        <div class="modal-header-actions">
          <router-link
            :to="'/products/' + encryptId(currentProduct.id)"
            class="full-page-btn"
            :title="t('productDetail.openFullPage')"
            @click="emit('close')"
          >
            <ExternalLink :size="18" />
          </router-link>
          <button
            type="button"
            class="fav-btn-modal"
            :class="{ 'is-active': isFavorite(currentProduct.id) }"
            :title="isFavorite(currentProduct.id) ? t('favorites.removeTooltip') : t('favorites.addTooltip')"
            @click.stop="toggleFavorite(currentProduct.id, locale === 'ar' ? (currentProduct.arabicName || currentProduct.name) : currentProduct.name, currentProduct.productPriceId)"
          >
            <Heart
              :size="18"
              :fill="isFavorite(currentProduct.id) ? '#DC5B61' : 'none'"
              :stroke="isFavorite(currentProduct.id) ? '#DC5B61' : '#667085'"
            />
          </button>
          <button class="close-btn" @click="emit('close')" aria-label="Close modal">
            <X :size="20" />
          </button>
        </div>
      </div>

      <!-- Top Summary Box -->
      <div class="product-top-summary">
        <div class="modal-img-col">
          <img
            :src="currentProduct.image"
            :alt="currentProduct.name"
            class="modal-product-img"
            @error="onImageError($event, 'product')"
          />
          <Badge v-if="currentProduct.discountRate" variant="discount" class="discount-float">
            -{{ currentProduct.discountRate }}%
          </Badge>
        </div>

        <div class="modal-specs-col">
          <div class="spec-grid">
            <div class="spec-cell">
              <span class="label">{{ t('productDetailModal.dosageForm') }}</span>
              <strong class="val">{{ currentProduct.form || (locale === 'ar' ? currentProduct.categoryArabicName : currentProduct.categoryName) || '-' }}</strong>
            </div>
            <div class="spec-cell">
              <span class="label">{{ t('productDetailModal.strength') }}</span>
              <strong class="val">{{ currentProduct.strength || '-' }}</strong>
            </div>
            <div class="spec-cell">
              <span class="label">{{ t('productDetailModal.packSpecification') }}</span>
              <strong class="val">{{ currentProduct.packSize || (currentProduct.productCode ? ('SKU: ' + currentProduct.productCode) : '-') }}</strong>
            </div>
            <div class="spec-cell">
              <span class="label">{{ t('productDetailModal.route') }}</span>
              <strong class="val">{{ currentProduct.route || '-' }}</strong>
            </div>
            <div class="spec-cell">
              <span class="label">{{ t('productDetailModal.brand') }}</span>
              <strong class="val">{{ currentProduct.brandName || '-' }}</strong>
            </div>
            <div class="spec-cell">
              <span class="label">{{ t('productDetailModal.manufacturer') }}</span>
              <strong class="val">{{ currentProduct.manufacturer || '-' }}</strong>
            </div>
          </div>

          <!-- Active Ingredient Banner -->
          <div class="active-ingredient-bar" v-if="currentProduct.activeIngredient">
            <Layers :size="16" class="ingredient-icon" />
            <div class="ingredient-text">
              <span class="ingredient-label">{{ t('productDetailModal.activeIngredient') }}</span>
              <strong class="ingredient-val">{{ currentProduct.activeIngredient }}</strong>
            </div>
          </div>

          <div class="price-highlight">
            <span class="lead-text">{{ t('productDetailModal.wholesalePricesStartingAt') }}</span>
            <PriceDisplay :price="bestPrice" size="lg" />
            <span class="stock-check">
              <ShieldCheck :size="15" />
              {{ t('productDetailModal.verifiedAuthenticBatch') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="modal-tabs">
        <button
          class="tab-btn"
          :class="{ 'is-active': activeTab === 'suppliers' }"
          @click="activeTab = 'suppliers'"
        >
          {{ t('productDetailModal.suppliersTab') }} ({{ supplierPrices.length > 0 ? supplierPrices.length : 1 }})
        </button>
        <button
          v-if="alternatives.length > 0"
          class="tab-btn"
          :class="{ 'is-active': activeTab === 'alternatives' }"
          @click="activeTab = 'alternatives'"
        >
          {{ t('productDetail.substitutesCount', { count: alternatives.length }) }}
        </button>
      </div>

      <!-- Tab 1: Multi-Vendor Pricing Table -->
      <div v-if="activeTab === 'suppliers'" class="tab-content">
        <!-- Desktop/Tablet Table -->
        <div class="table-container desktop-suppliers-table">
          <table class="suppliers-table">
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
              <!-- When supplier multi-prices are available -->
              <tr v-for="priceRow in supplierPrices" :key="priceRow.id">
                <!-- Supplier Name -->
                <td>
                  <div class="supplier-cell">
                    <span class="sup-name">{{ priceRow.inventoryName }}</span>
                    <span class="delivery-badge">
                      <Truck :size="12" />
                      {{ priceRow.deliveryTime || 'Same Day' }}
                    </span>
                  </div>
                </td>

                <!-- Discount -->
                <td>
                  <span class="discount-badge-pill">
                    {{ priceRow.discountRate }}%
                  </span>
                </td>

                <!-- Net Price -->
                <td>
                  <div class="net-price-cell">
                    <strong class="net-price">{{ formatPrice(priceRow.effectiveSalesPrice) }} {{ t('common.currency') }}</strong>
                    <span class="base-price">{{ formatPrice(priceRow.salesPrice) }} {{ t('common.currency') }}</span>
                  </div>
                </td>

                <!-- Available Stock -->
                <td>
                  <div class="stock-cell">
                    <span class="stock-qty">{{ priceRow.stockQuantity }} {{ t('productDetailModal.units') }}</span>
                    <span class="stock-indicator green"></span>
                  </div>
                </td>

                <!-- Min Order -->
                <td>
                  <span class="min-order-tag">{{ priceRow.minOrder }} {{ t('common.currency') }}</span>
                </td>

                <!-- Quantity Stepper -->
                <td>
                  <div class="qty-stepper">
                    <button
                      type="button"
                      class="step-btn"
                      @click="updateQty(priceRow.id, -1)"
                    >
                      -
                    </button>
                    <span class="qty-val">{{ quantities[priceRow.id] || 1 }}</span>
                    <button
                      type="button"
                      class="step-btn"
                      @click="updateQty(priceRow.id, 1)"
                    >
                      +
                    </button>
                  </div>
                </td>

                <!-- Add Button -->
                <td>
                  <Button
                    variant="cta"
                    size="sm"
                    @click="addFromSupplier(priceRow)"
                  >
                    <ShoppingBag :size="14" />
                    <span>{{ t('products.addToCart') }}</span>
                  </Button>
                </td>
              </tr>

              <!-- Loading state while supplier prices are fetched -->
              <tr v-if="isLoadingPrices">
                <td colspan="7" class="suppliers-loading">
                  {{ t('common.loadingSuppliers') }}
                </td>
              </tr>

              <!-- Fallback row when 0 multi-supplier rows exist -->
              <tr v-if="!isLoadingPrices && supplierPrices.length === 0">
                <td>
                  <div class="supplier-cell">
                    <span class="sup-name">{{ fallbackProviderName }}</span>
                    <span class="delivery-badge">
                      <Truck :size="12" />
                      {{ t('common.expressDelivery') }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="discount-badge-pill">
                    {{ currentProduct.discountRate || 0 }}%
                  </span>
                </td>
                <td>
                  <div class="net-price-cell">
                    <strong class="net-price">{{ formatPrice(currentProduct.price) }} {{ t('common.currency') }}</strong>
                    <span v-if="currentProduct.originalPrice && ceilPrice(currentProduct.originalPrice) > ceilPrice(currentProduct.price)" class="base-price">
                      {{ formatPrice(currentProduct.originalPrice) }} {{ t('common.currency') }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="stock-cell">
                    <span class="stock-qty">{{ currentProduct.stockQuantity ?? 0 }} {{ t('productDetailModal.units') }}</span>
                    <span class="stock-indicator" :class="(currentProduct.stockQuantity ?? 0) > 0 ? 'green' : 'red'"></span>
                  </div>
                </td>
                <td>
                  <span class="min-order-tag">1 {{ t('common.currency') }}</span>
                </td>
                <td>
                  <div class="qty-stepper">
                    <button
                      type="button"
                      class="step-btn"
                      @click="directQuantity = Math.max(1, directQuantity - 1)"
                    >
                      -
                    </button>
                    <span class="qty-val">{{ directQuantity }}</span>
                    <button
                      type="button"
                      class="step-btn"
                      @click="directQuantity++"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  <Button
                    variant="cta"
                    size="sm"
                    @click="addDirectProduct"
                  >
                    <ShoppingBag :size="14" />
                    <span>{{ t('products.addToCart') }}</span>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Supplier Cards (< 640px) -->
        <div class="mobile-suppliers-list">
          <div
            v-for="priceRow in supplierPrices"
            :key="'mob-sup-' + priceRow.id"
            class="mobile-supplier-card"
          >
            <div class="mob-sup-head">
              <div class="mob-sup-title-col">
                <strong class="mob-sup-name">{{ priceRow.inventoryName }}</strong>
                <span class="delivery-badge">
                  <Truck :size="12" />
                  {{ priceRow.deliveryTime || 'Same Day' }}
                </span>
              </div>
              <span class="discount-badge-pill">
                {{ priceRow.discountRate }}%
              </span>
            </div>

            <div class="mob-sup-meta">
              <div class="mob-sup-price">
                <strong class="net-price">{{ formatPrice(priceRow.effectiveSalesPrice) }} {{ t('common.currency') }}</strong>
                <span class="base-price">{{ formatPrice(priceRow.salesPrice) }} {{ t('common.currency') }}</span>
              </div>
              <div class="mob-sup-info">
                <span>{{ priceRow.stockQuantity }} {{ t('productDetailModal.units') }}</span>
                <span class="sep-dot">&bull;</span>
                <span>{{ t('providers.minOrder') }}: {{ priceRow.minOrder }} {{ t('common.currency') }}</span>
              </div>
            </div>

            <div class="mob-sup-actions">
              <div class="qty-stepper">
                <button
                  type="button"
                  class="step-btn"
                  @click="updateQty(priceRow.id, -1)"
                >
                  -
                </button>
                <span class="qty-val">{{ quantities[priceRow.id] || 1 }}</span>
                <button
                  type="button"
                  class="step-btn"
                  @click="updateQty(priceRow.id, 1)"
                >
                  +
                </button>
              </div>

              <Button
                variant="cta"
                size="sm"
                @click="addFromSupplier(priceRow)"
              >
                <ShoppingBag :size="14" />
                <span>{{ t('products.addToCart') }}</span>
              </Button>
            </div>
          </div>

          <!-- Loading state while supplier prices are fetched -->
          <div v-if="isLoadingPrices" class="mobile-supplier-card suppliers-loading-card">
            {{ t('common.loadingSuppliers') }}
          </div>

          <!-- Fallback mobile card if supplierPrices is empty -->
          <div v-if="!isLoadingPrices && supplierPrices.length === 0" class="mobile-supplier-card">
            <div class="mob-sup-head">
              <div class="mob-sup-title-col">
                <strong class="mob-sup-name">{{ fallbackProviderName }}</strong>
                <span class="delivery-badge">
                  <Truck :size="12" />
                  {{ t('common.expressDelivery') }}
                </span>
              </div>
              <span v-if="currentProduct.discountRate" class="discount-badge-pill">
                {{ currentProduct.discountRate }}%
              </span>
            </div>

            <div class="mob-sup-meta">
              <div class="mob-sup-price">
                <strong class="net-price">{{ formatPrice(currentProduct.price) }} {{ t('common.currency') }}</strong>
                <span v-if="currentProduct.originalPrice && ceilPrice(currentProduct.originalPrice) > ceilPrice(currentProduct.price)" class="base-price">
                  {{ formatPrice(currentProduct.originalPrice) }} {{ t('common.currency') }}
                </span>
              </div>
              <div class="mob-sup-info">
                <span>{{ currentProduct.stockQuantity ?? 0 }} {{ t('productDetailModal.units') }}</span>
              </div>
            </div>

            <div class="mob-sup-actions">
              <div class="qty-stepper">
                <button
                  type="button"
                  class="step-btn"
                  @click="directQuantity = Math.max(1, directQuantity - 1)"
                >
                  -
                </button>
                <span class="qty-val">{{ directQuantity }}</span>
                <button
                  type="button"
                  class="step-btn"
                  @click="directQuantity++"
                >
                  +
                </button>
              </div>

              <Button
                variant="cta"
                size="sm"
                @click="addDirectProduct"
              >
                <ShoppingBag :size="14" />
                <span>{{ t('products.addToCart') }}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Alternatives -->
      <div v-else-if="activeTab === 'alternatives'" class="tab-content">
        <div v-if="alternatives.length > 0" class="alternatives-grid">
          <div
            v-for="alt in alternatives"
            :key="alt.id"
            class="alt-card"
            @click="emit('select-alternative', alt)"
          >
            <img
              :src="alt.image"
              :alt="alt.name"
              class="alt-img"
              loading="lazy"
              @error="onImageError($event, 'product')"
            />
            <div class="alt-info">
              <h5 class="alt-title">{{ locale === 'ar' && alt.arabicName ? alt.arabicName : alt.name }}</h5>
              <span class="alt-brand">{{ alt.brandName }}</span>
              <div class="alt-footer">
                <PriceDisplay :price="alt.price" size="sm" />
                <Button variant="secondary" size="sm" class="alt-btn">
                  {{ t('common.viewDetails') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-alternatives">
          <Layers :size="32" class="empty-icon" />
          <p>{{ t('productDetail.noSubstitutes') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(18, 73, 107, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  animation: fadeIn 0.2s ease-out;
}

@media (max-width: 640px) {
  .modal-backdrop {
    padding: 8px;
  }
}

.modal-dialog {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  position: sticky;
  top: 0;
  background: #FFFFFF;
  z-index: 2;
}

.category-pill {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-title {
  font-size: 1.5rem;
  color: var(--color-deep-blue);
  margin-top: 2px;
}

.modal-ar-title {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.full-page-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-blue);
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.full-page-btn:hover {
  background: var(--color-primary-blue-bg);
  border-color: var(--color-primary-blue);
  transform: translateY(-1px);
}

.fav-btn-modal {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.fav-btn-modal:hover {
  background: #FEF3F2;
  border-color: #FECDCA;
}

.fav-btn-modal.is-active {
  background: #FEF3F2;
  border-color: #FECDCA;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.close-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-deep-blue);
}

/* Product Top Summary */
.product-top-summary {
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-lg);
  background: var(--color-pale-blue);
  border-bottom: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .product-top-summary {
    grid-template-columns: 1fr;
  }
}

.modal-img-col {
  position: relative;
  background: #FFFFFF;
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.modal-product-img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.discount-float {
  position: absolute;
  top: 10px;
  left: 10px;
}

[dir="rtl"] .discount-float {
  left: auto;
  right: 10px;
}

.modal-specs-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xs);
}

.spec-cell {
  background: #FFFFFF;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
}

.spec-cell .label {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.spec-cell .val {
  font-size: 0.875rem;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
}

.active-ingredient-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: #E8F8F5;
  border: 1px solid rgba(22, 160, 133, 0.3);
  border-radius: var(--radius-sm);
}

.ingredient-icon {
  color: var(--color-success);
}

.ingredient-text {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  font-size: 0.8125rem;
}

.ingredient-label {
  font-size: 0.6875rem;
  color: #155724;
}

.find-alternatives-btn {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-success);
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;
}

.price-highlight {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding-top: var(--space-xs);
  border-top: 1px solid rgba(25, 118, 173, 0.15);
}

.lead-text {
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
}

.stock-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

/* Modal Tabs */
.modal-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  background: #FFFFFF;
}

.tab-btn {
  padding: var(--space-md) 0;
  font-size: 0.9375rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.tab-btn:hover {
  color: var(--color-deep-blue);
}

.tab-btn.is-active {
  color: var(--color-primary-blue);
  border-bottom-color: var(--color-primary-blue);
}

/* Tab Content */
.tab-content {
  padding: var(--space-lg);
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.suppliers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 650px;
}

.suppliers-table th {
  text-align: inherit;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-sm) var(--space-xs);
  border-bottom: 1px solid var(--color-border);
}

.suppliers-table td {
  padding: var(--space-sm) var(--space-xs);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.suppliers-loading {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  padding: var(--space-md) 0;
}

.suppliers-loading-card {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.supplier-cell {
  display: flex;
  flex-direction: column;
}

.sup-name {
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
}

.delivery-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.discount-badge-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-error-bg);
  color: var(--color-error);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
}

.net-price-cell {
  display: flex;
  flex-direction: column;
}

.net-price {
  color: var(--color-deep-blue);
  font-size: 0.9375rem;
}

.base-price {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

.stock-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stock-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-success);
}

.min-order-tag {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #FFFFFF;
}

.step-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--color-deep-blue);
}

.step-btn:hover {
  background: var(--color-off-white);
}

.qty-val {
  padding: 0 8px;
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  min-width: 28px;
  text-align: center;
}

/* Alternatives Grid */
.alternatives-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .alternatives-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .alternatives-grid {
    grid-template-columns: 1fr;
  }
}

.alt-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.alt-card:hover {
  border-color: var(--color-primary-blue);
  box-shadow: var(--shadow-sm);
}

.alt-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-xs);
  background: var(--color-pale-blue);
}

.alt-title {
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
}

.alt-brand {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-xs);
}

.alt-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: var(--space-2xs);
  border-top: 1px dashed var(--color-border-light);
}

.empty-alternatives {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--color-text-tertiary);
}

.empty-icon {
  margin: 0 auto var(--space-xs);
  color: var(--color-primary-blue);
}

/* Mobile Suppliers Cards */
.mobile-suppliers-list {
  display: none;
}

@media (max-width: 640px) {
  .desktop-suppliers-table {
    display: none;
  }

  .mobile-suppliers-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .modal-header {
    padding: var(--space-md);
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .product-top-summary {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .tab-content {
    padding: var(--space-md);
  }

  .modal-tabs {
    padding: 0 var(--space-md);
  }
}

.mobile-supplier-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.mob-sup-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.mob-sup-title-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mob-sup-name {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
}

.mob-sup-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.mob-sup-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.mob-sup-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.sep-dot {
  color: var(--color-border);
}

.mob-sup-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xs);
  border-top: 1px dashed var(--color-border-light);
  gap: 8px;
}
</style>
