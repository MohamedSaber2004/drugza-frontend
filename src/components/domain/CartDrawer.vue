<script setup lang="ts">
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Building2,
  Plus,
  Minus
} from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCart } from '@/composables/useCart';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from '@/composables/useI18n';
import { productsService } from '@/services/products.service';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Button from '@/components/ui/Button.vue';
import { formatPrice } from '@/utils/price';
import { onImageError } from '@/utils/placeholders';

const router = useRouter();
const { t, locale } = useI18n();
const { isAuthenticated } = useAuth();
const {
  items,
  isLoading,
  suppliersGroups,
  totalItemsCount,
  totalPiecesCount,
  totalCartAmount,
  totalSavings,
  isCartDrawerOpen,
  updateQuantity,
  removeItem,
  applyPriceUpdates,
  closeCartDrawer
} = useCart();

// Savings are derived from the stored list price, which goes stale as suppliers
// change discounts; re-read live rows whenever the drawer opens.
async function refreshCartPrices() {
  const targets = items.value.filter(i => i.productId && i.inventoryId);
  if (targets.length === 0) return;

  const productIds = [...new Set(targets.map(i => i.productId))];
  const results = await Promise.all(
    productIds.map(async productId => {
      try {
        return { productId, prices: await productsService.getSupplierPricesForProduct(productId, true) };
      } catch {
        return { productId, prices: [] };
      }
    })
  );

  const updates: Array<{
    productId: string;
    inventoryId: string;
    priceId?: string;
    effectivePrice?: number;
    originalPrice?: number;
  }> = [];
  for (const item of targets) {
    const live = results.find(r => r.productId === item.productId)?.prices ?? [];
    const match =
      live.find(p => p.id === item.priceId) ||
      live.find(p => p.inventoryUserId === item.inventoryId);
    if (!match) continue;
    updates.push({
      productId: item.productId,
      inventoryId: item.inventoryId,
      priceId: match.id,
      effectivePrice: match.effectiveSalesPrice,
      originalPrice: match.salesPrice
    });
  }
  applyPriceUpdates(updates);
}

watch(isCartDrawerOpen, open => {
  if (open) void refreshCartPrices();
});

function onQuantityInput(itemId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const val = parseInt(target.value, 10);
  if (!isNaN(val) && val > 0) {
    updateQuantity(itemId, val);
  }
}

function goToCheckout() {
  closeCartDrawer();
  if (!isAuthenticated.value) {
    router.push({ path: '/auth/login', query: { redirect: '/checkout' } });
  } else {
    router.push('/checkout');
  }
}
</script>

<template>
  <div v-if="isCartDrawerOpen" class="cart-backdrop" @click="closeCartDrawer">
    <div class="cart-drawer" @click.stop>
      <!-- Drawer Header -->
      <div class="cart-header">
        <div class="title-group">
          <div class="icon-circle">
            <ShoppingBag :size="20" />
          </div>
          <div>
            <h3 class="cart-title">{{ t('cart.title') }}</h3>
            <span class="items-count">
              {{ totalItemsCount }} {{ t('common.distinctItems') }} ({{ totalPiecesCount }} {{ t('common.pieces') }})
            </span>
          </div>
        </div>

        <button class="close-btn" @click="closeCartDrawer" aria-label="Close cart">
          <X :size="20" />
        </button>
      </div>

      <!-- Drawer Body -->
      <div class="cart-body" v-loading="isLoading">
        <div v-if="items.length === 0" class="empty-cart">
          <div class="empty-icon-box">
            <ShoppingBag :size="48" />
          </div>
          <h4>{{ t('cart.emptyTitle') }}</h4>
          <p>{{ t('cart.emptyDesc') }}</p>
          <Button variant="primary" size="md" @click="closeCartDrawer">
            {{ t('cart.startShopping') }}
          </Button>
        </div>

        <!-- Supplier Groups List (Grouped by Provider) -->
        <div v-else class="groups-container">
          <div
            v-for="group in suppliersGroups"
            :key="group.inventoryId"
            class="supplier-group-card"
          >
            <!-- Supplier Header -->
            <div class="group-header">
              <div class="sup-info">
                <div class="sup-icon-box">
                  <Building2 :size="16" />
                </div>
                <div>
                  <span class="group-label">{{ t('cart.supplierLabel') }}</span>
                  <h4 class="sup-name">{{ group.inventoryName }}</h4>
                </div>
              </div>
            </div>

            <!-- Items List categorized under this provider -->
            <div class="group-items">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="cart-item-row"
              >
                <img
                  :src="item.product.image"
                  :alt="item.product.name"
                  class="item-img"
                  loading="lazy"
                  @error="onImageError($event, 'product')"
                />

                <div class="item-info">
                  <h5 class="item-title">
                    {{ locale === 'ar' && item.product.arabicName ? item.product.arabicName : item.product.name }}
                  </h5>
                  <span class="item-form">
                    {{ item.product.form || t('common.pharmaceutical') }} &bull; {{ item.product.packSize || t('common.unitPiece') }}
                  </span>
                  <div class="item-pricing">
                    <PriceDisplay :price="item.effectivePrice" size="sm" />
                    <span class="unit-text">/ {{ t('common.unitPiece') }}</span>
                  </div>
                </div>

                <!-- Piece-by-piece Stepper (1 by 1) -->
                <div class="item-stepper-wrap">
                  <div class="stepper">
                    <button
                      type="button"
                      class="step-btn"
                      @click="updateQuantity(item.id, item.quantity - 1)"
                      :title="t('cart.decreasePiece')"
                    >
                      <Minus :size="12" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      :value="item.quantity"
                      class="step-input"
                      @change="onQuantityInput(item.id, $event)"
                      :title="t('cart.quantityInPieces')"
                    />
                    <button
                      type="button"
                      class="step-btn"
                      @click="updateQuantity(item.id, item.quantity + 1)"
                      :title="t('cart.increasePiece')"
                    >
                      <Plus :size="12" />
                    </button>
                  </div>
                  <span class="line-total">
                    {{ formatPrice(item.effectivePrice * item.quantity) }} {{ t('common.currency') }}
                  </span>
                </div>

                <button
                  type="button"
                  class="del-btn"
                  @click="removeItem(item.id)"
                  :aria-label="t('cart.removeItemAria')"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>

            <!-- Supplier Group Subtotal Bar -->
            <div class="group-subtotal">
              <span class="sub-label">
                {{ t('cart.totalFromWarehouse', { name: group.inventoryName }) }}
                ({{ group.items.length }} {{ t('common.distinctItems') }} &bull; {{ group.totalPiecesCount }} {{ t('common.pieces') }})
              </span>
              <strong class="sub-amount">{{ formatPrice(group.subtotal) }} {{ t('common.currency') }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Drawer Footer -->
      <div v-if="items.length > 0" class="cart-footer">
        <div class="summary-breakdown">
          <div class="sum-row">
            <span>{{ t('common.distinctItemsCount') }}</span>
            <strong>{{ totalItemsCount }} {{ t('common.items') }}</strong>
          </div>
          <div class="sum-row">
            <span>{{ t('common.totalPieces') }}</span>
            <strong>{{ totalPiecesCount }} {{ t('common.pieces') }}</strong>
          </div>
          <div class="sum-row">
            <span>{{ t('cart.subtotal') }}</span>
            <strong>{{ formatPrice(totalCartAmount) }} {{ t('common.currency') }}</strong>
          </div>
          <div class="sum-row savings" v-if="totalSavings > 0">
            <span>
              {{ t('cart.commercialDiscounts') }}
              <span class="included-hint">{{ t('cart.discountsIncluded') }}</span>
            </span>
            <strong class="green-text">{{ formatPrice(totalSavings) }} {{ t('common.currency') }}</strong>
          </div>
          <div class="sum-row">
            <span>{{ t('cart.coldChainFee') }}</span>
            <span class="shipping-tag">{{ t('cart.calculatedAtCheckout') }}</span>
          </div>
          <div class="sum-row total-row">
            <span>{{ t('cart.total') }}</span>
            <PriceDisplay :price="totalCartAmount" size="lg" />
          </div>
        </div>

        <Button
          variant="cta"
          size="lg"
          block
          @click="goToCheckout"
        >
          <span>{{ t('cart.checkout') }}</span>
          <ArrowRight :size="18" class="arrow-icon" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(18, 73, 107, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-out;
}

[dir="rtl"] .cart-backdrop {
  justify-content: flex-start;
}

.cart-drawer {
  width: 100%;
  max-width: 500px;
  height: 100%;
  background: #FFFFFF;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  animation: slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

[dir="rtl"] .cart-drawer {
  animation: slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideLeft {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideRight {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 640px) {
  .cart-drawer {
    max-width: 100%;
  }
  .cart-header {
    padding: var(--space-sm) var(--space-md);
  }
  .cart-body {
    padding: var(--space-sm);
  }
  .cart-footer {
    padding: var(--space-sm);
  }
}

.cart-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-off-white);
}

.title-group {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.icon-circle {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-title {
  font-size: 1.125rem;
  color: var(--color-deep-blue);
  line-height: 1.2;
}

.items-count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: transparent;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.close-btn:hover {
  background: #E5EAF0;
  color: var(--color-deep-blue);
}

/* Body */
.cart-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: var(--space-md);
  background: #FAFBFC;
}

.empty-cart {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-pill);
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-xs);
}

.empty-cart h4 {
  font-size: 1.125rem;
  color: var(--color-deep-blue);
}

.empty-cart p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  max-width: 320px;
  margin-bottom: var(--space-sm);
}

/* Groups */
.groups-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.supplier-group-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-xs);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border-light);
  gap: 8px;
}

.sup-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sup-icon-box {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.group-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  letter-spacing: 0.05em;
  display: block;
}

.sup-name {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
}

/* Item rows */
.group-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.cart-item-row {
  display: grid;
  grid-template-columns: 48px 1fr auto auto;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  border-bottom: 1px dashed var(--color-border-light);
}

.item-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.item-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-title {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-form {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.item-pricing {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
}

.unit-text {
  font-size: 0.625rem;
  color: var(--color-text-tertiary);
}

.item-stepper-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

[dir="rtl"] .item-stepper-wrap {
  align-items: flex-start;
}

.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: #FFFFFF;
  overflow: hidden;
}

.step-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-deep-blue);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--dur-fast);
}

.step-btn:hover {
  background: var(--color-off-white);
  color: var(--color-primary-blue);
}

.step-input {
  width: 38px;
  height: 26px;
  border: none;
  border-left: 1px solid var(--color-border-light);
  border-right: 1px solid var(--color-border-light);
  background: transparent;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  padding: 0;
  -moz-appearance: textfield;
}

.step-input::-webkit-outer-spin-button,
.step-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.line-total {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
}

.del-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.del-btn:hover {
  color: var(--color-danger);
  background: #FEE4E2;
}

/* Group Subtotal */
.group-subtotal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--color-pale-blue);
  border-radius: var(--radius-sm);
  margin-top: var(--space-xs);
  font-size: 0.75rem;
  gap: 8px;
}

.sub-label {
  color: var(--color-text-secondary);
}

.sub-amount {
  color: var(--color-deep-blue);
  font-size: 0.8125rem;
}

/* Footer */
.cart-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--color-border);
  background: #FFFFFF;
}

.summary-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: var(--space-md);
}

.sum-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.sum-row strong {
  color: var(--color-deep-blue);
}

.sum-row.savings {
  color: var(--color-success);
}

.green-text {
  color: var(--color-success) !important;
}

.included-hint {
  display: inline-block;
  margin-inline-start: 4px;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-muted);
}

.shipping-tag {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
}

.total-row {
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
  margin-top: 2px;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  align-items: center;
}
</style>
