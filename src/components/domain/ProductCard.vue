<script setup lang="ts">
import { computed } from 'vue';
import { Heart, ShoppingBag, Eye, Layers, Plus, Minus } from 'lucide-vue-next';
import type { Product } from '@/types';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import { useCart } from '@/composables/useCart';
import { useFavorites } from '@/composables/useFavorites';
import { useI18n } from '@/composables/useI18n';
import { onImageError } from '@/utils/placeholders';

const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits<{
  (e: 'view-details', product: Product): void;
  (e: 'view-alternatives', activeIngredientId: string): void;
}>();

const { t, locale } = useI18n();
const { addItem, items, updateQuantity } = useCart();
const { isFavorite, toggleFavorite } = useFavorites();

const cartItem = computed(() => items.value.find(i => i.productId === props.product.id));
const cartQuantity = computed(() => cartItem.value?.quantity || 0);

const suppliersLabel = computed(() => {
  const count = props.product.suppliersCount || 0;
  if (count === 1) {
    return locale.value === 'ar' ? 'متوفر من مستودع موثوق واحد' : 'Available from 1 verified warehouse';
  }
  return t('products.suppliersAvailable', { count });
});

function onAddToCart() {
  addItem(props.product, 1);
}

function onIncrement() {
  if (cartItem.value) {
    updateQuantity(cartItem.value.id, cartItem.value.quantity + 1);
  } else {
    addItem(props.product, 1);
  }
}

function onDecrement() {
  if (cartItem.value) {
    updateQuantity(cartItem.value.id, cartItem.value.quantity - 1);
  }
}

function onToggleFav() {
  const prodName = locale.value === 'ar' ? (props.product.arabicName || props.product.name) : props.product.name;
  toggleFavorite(props.product.id, prodName, props.product.productPriceId);
}
</script>

<template>
  <div class="drugza-product-card">
    <!-- Card Header: Badges & Wishlist -->
    <div class="card-top-bar">
      <div class="badges-group">
        <Badge v-if="product.discountRate" variant="discount">
          -{{ product.discountRate }}%
        </Badge>
        <Badge v-if="product.isFlashSale" variant="warning">
          🔥 {{ locale === 'ar' ? 'عرض فوري' : 'Flash Sale' }}
        </Badge>
      </div>

      <button
        type="button"
        class="fav-btn"
        :class="{ 'is-active': isFavorite(product.id) }"
        :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
        @click.stop="onToggleFav"
      >
        <Heart
          :size="18"
          :fill="isFavorite(product.id) ? '#DC5B61' : 'none'"
          :stroke="isFavorite(product.id) ? '#DC5B61' : '#667085'"
        />
      </button>
    </div>

    <!-- Product Image with quick view trigger -->
    <div class="image-wrapper" @click="emit('view-details', product)">
      <img
        :src="product.image"
        :alt="product.name"
        class="product-image"
        loading="lazy"
        @error="onImageError($event, 'product')"
      />
      <div class="image-overlay">
        <span class="quick-view-badge">
          <Eye :size="14" />
          {{ t('products.compareSuppliers') }}
        </span>
      </div>
    </div>

    <!-- Card Content -->
    <div class="product-info">
      <!-- Variant / Form Badge -->
      <div class="meta-row">
        <span v-if="product.form" class="form-tag">{{ product.form }}</span>
        <span v-if="product.packSize" class="pack-size">{{ product.packSize }}</span>
      </div>

      <!-- Product Title: localized precedence -->
      <h3
        class="product-title"
        :title="product.name"
        @click="emit('view-details', product)"
      >
        {{ locale === 'ar' && product.arabicName ? product.arabicName : product.name }}
      </h3>
      <p
        v-if="locale === 'ar' && product.arabicName && product.arabicName !== product.name"
        class="product-ar-name"
      >
        {{ product.name }}
      </p>
      <p
        v-else-if="locale === 'en' && product.arabicName && product.arabicName !== product.name"
        class="product-ar-name"
      >
        {{ product.arabicName }}
      </p>

      <!-- Active Ingredient (Interactive) -->
      <div
        v-if="product.activeIngredient"
        class="active-ingredient-chip"
        :title="locale === 'ar' ? 'عرض بدائل بنفس المادة الفعالة' : 'View substitute medicines with same active ingredient'"
        @click.stop="emit('view-alternatives', product.activeIngredientId || '')"
      >
        <Layers :size="12" />
        <span>{{ product.activeIngredient }}</span>
      </div>

      <!-- Multi-Vendor Stock Indicator -->
      <div v-if="product.suppliersCount && product.suppliersCount > 0" class="supplier-availability">
        <span class="pulse-dot"></span>
        <span class="supplier-text">
          {{ suppliersLabel }}
        </span>
      </div>

      <!-- Price & Actions Footer -->
      <div class="card-footer">
        <div class="price-container">
          <span class="price-label">{{ t('products.bestWholesale') }}</span>
          <PriceDisplay
            :price="product.price"
            :original-price="product.originalPrice"
            size="md"
          />
        </div>

        <!-- Piece by piece stepper if already in cart -->
        <div v-if="cartQuantity > 0" class="card-stepper" @click.stop>
          <button
            type="button"
            class="card-step-btn"
            @click.stop="onDecrement"
            :title="locale === 'ar' ? 'إنقاص قطعة واحدة' : 'Decrease 1 piece'"
          >
            <Minus :size="13" />
          </button>
          <span class="card-step-val">{{ cartQuantity }}</span>
          <button
            type="button"
            class="card-step-btn"
            @click.stop="onIncrement"
            :title="locale === 'ar' ? 'إضافة قطعة واحدة' : 'Add 1 piece'"
          >
            <Plus :size="13" />
          </button>
        </div>

        <Button
          v-else
          variant="cta"
          size="sm"
          class="add-cart-btn"
          @click.stop="onAddToCart"
        >
          <ShoppingBag :size="15" />
          <span>{{ t('products.addToCart') }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drugza-product-card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  transition:
    border-color var(--dur-base) var(--ease-smooth),
    box-shadow var(--dur-base) var(--ease-smooth),
    transform var(--dur-base) var(--ease-smooth);
  box-shadow: var(--shadow-xs);
  position: relative;
  overflow: hidden;
}

.drugza-product-card:hover {
  border-color: rgba(25, 118, 173, 0.35);
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
  min-height: 24px;
}

.badges-group {
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
}

.fav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  background: var(--color-off-white);
  transition: all var(--dur-fast) var(--ease-smooth);
  flex-shrink: 0;
}

.fav-btn:hover {
  background: #FEE4E2;
}

.fav-btn.is-active {
  background: #FEE4E2;
}

/* Image container */
.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: linear-gradient(160deg, #F7FAFD 0%, #EDF3F9 100%);
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--dur-base) var(--ease-smooth);
}

.drugza-product-card:hover .product-image {
  transform: scale(1.04);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(18, 73, 107, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-smooth);
}

.drugza-product-card:hover .image-overlay {
  opacity: 1;
}

.quick-view-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #FFFFFF;
  color: var(--color-deep-blue);
  font-family: var(--font-body);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding-top: var(--space-xs);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-bottom: 6px;
}

.form-tag {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
  background: var(--color-primary-blue-light);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
}

.pack-size {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.product-title {
  font-size: 0.9375rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.3;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}

.product-title:hover {
  color: var(--color-primary-blue);
}

.product-ar-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-ingredient-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6875rem;
  color: #155724;
  background-color: #E8F8F5;
  border: 1px solid rgba(22, 160, 133, 0.25);
  border-radius: var(--radius-pill);
  padding: 2px 8px;
  margin-bottom: 8px;
  cursor: pointer;
  align-self: flex-start;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.active-ingredient-chip:hover {
  background-color: #D1F2EB;
  border-color: var(--color-success);
}

.supplier-availability {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-success);
  box-shadow: 0 0 0 2px rgba(22, 160, 133, 0.2);
  flex-shrink: 0;
}

/* Footer row */
.card-footer {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2xs);
  padding-top: var(--space-2xs);
  border-top: 1px dashed var(--color-border);
}

.price-container {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 0.625rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1px;
}

.add-cart-btn {
  flex-shrink: 0;
  padding: 0 var(--space-sm);
  border-radius: var(--radius-pill);
}

.card-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary-blue-light, #EBF5FB);
  border: 1px solid var(--color-primary-blue, #1A6B9B);
  border-radius: var(--radius-pill);
  padding: 2px 6px;
  height: 32px;
}

.card-step-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary-blue, #1A6B9B);
  color: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform var(--dur-fast), background var(--dur-fast);
}

.card-step-btn:hover {
  transform: scale(1.1);
  background: var(--color-deep-blue, #0F354D);
}

.card-step-val {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue, #0F354D);
  min-width: 20px;
  text-align: center;
}

@media (max-width: 480px) {
  .drugza-product-card {
    padding: 10px;
  }
  .product-title {
    font-size: 0.875rem;
  }
  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .add-cart-btn {
    width: 100%;
    justify-content: center;
    padding: 6px 10px;
  }
  .card-stepper {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
