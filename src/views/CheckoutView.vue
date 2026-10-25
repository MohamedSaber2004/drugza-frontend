<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  AlertTriangle,
  PlusCircle,
  RefreshCw
} from 'lucide-vue-next';
import { useCart } from '@/composables/useCart';
import { useToast } from '@/composables/useToast';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Button from '@/components/ui/Button.vue';
import { useI18n } from '@/composables/useI18n';
import { formatPrice, ceilPrice } from '@/utils/price';
import { addressService, ordersService, couponsService } from '@/services';
import { fetchLiveSupplierPrices } from '@/services/products.service';
import type { Address, DeliveryTimeSlotDto } from '@/types';

const router = useRouter();
const toast = useToast();
const { t, locale } = useI18n();

const { totalCartAmount, totalSavings, items, suppliersGroups, clearCart, applyPriceUpdates } = useCart();

const selectedAddressId = ref('');
const selectedSlotId = ref('');
const couponInput = ref('');
const appliedCouponCode = ref('');
const appliedDiscount = ref(0);
const isPlacingOrder = ref(false);

const addresses = ref<Address[]>([]);
const isAddressesLoading = ref(true);
const addressError = ref(false);
const addressStepEl = ref<HTMLElement | null>(null);
const timeSlots = ref<DeliveryTimeSlotDto[]>([]);

const shippingFee = ref<number | null>(null);
const isShippingLoading = ref(false);
const shippingError = ref(false);

type PriceCheckState = 'idle' | 'checking' | 'verified' | 'issues' | 'error';

interface PriceIssue {
  key: string;
  kind: 'price' | 'stock' | 'unavailable';
  name: string;
  oldPrice?: number;
  newPrice?: number;
  available?: number;
  requested?: number;
}

interface PriceUpdate {
  productId: string;
  inventoryId: string;
  priceId?: string;
  effectivePrice?: number;
  originalPrice?: number;
}

const priceState = ref<PriceCheckState>('idle');
const priceIssues = ref<PriceIssue[]>([]);
const pendingPriceUpdates = ref<PriceUpdate[]>([]);

const hasQuantityIssues = computed(
  () => priceIssues.value.some(i => i.kind === 'stock' || i.kind === 'unavailable')
);

const selectedAddress = computed(
  () => addresses.value.find(a => a.id === selectedAddressId.value) || null
);
const selectedCityName = computed(() => selectedAddress.value?.cityName || '');

const finalPayable = computed(() => {
  return Math.max(0, totalCartAmount.value + (shippingFee.value ?? 0) - appliedDiscount.value);
});

onMounted(async () => {
  try {
    const [addrList, slotList] = await Promise.allSettled([
      addressService.getUserAddresses(),
      ordersService.getDeliveryTimeSlots(1)
    ]);

    if (addrList.status === 'fulfilled') {
      addresses.value = addrList.value;
    }
    if (slotList.status === 'fulfilled' && slotList.value.length > 0) {
      timeSlots.value = slotList.value;
      selectedSlotId.value = slotList.value[0].id;
    }
  } finally {
    isAddressesLoading.value = false;
  }

  if (items.value.length > 0) {
    void verifyPrices();
  }
});

watch(selectedAddressId, (id) => {
  addressError.value = false;
  void loadShippingFee(id);
});

async function loadShippingFee(addressId: string) {
  shippingFee.value = null;
  shippingError.value = false;
  if (!addressId) return;

  isShippingLoading.value = true;
  try {
    const fee = await addressService.getShippingFees(addressId);
    if (selectedAddressId.value !== addressId) return;
    if (fee === null) {
      shippingError.value = true;
    } else {
      shippingFee.value = fee;
    }
  } finally {
    if (selectedAddressId.value === addressId) {
      isShippingLoading.value = false;
    }
  }
}

async function verifyPrices(): Promise<boolean> {
  if (items.value.length === 0) {
    priceIssues.value = [];
    pendingPriceUpdates.value = [];
    priceState.value = 'verified';
    return true;
  }

  priceState.value = 'checking';
  priceIssues.value = [];
  pendingPriceUpdates.value = [];

  const productIds = [...new Set(items.value.map(i => i.productId).filter(Boolean))];
  const pricesByProduct = new Map<string, Awaited<ReturnType<typeof fetchLiveSupplierPrices>>>();

  try {
    const settled = await Promise.all(
      productIds.map(async id => [id, await fetchLiveSupplierPrices(id)] as const)
    );
    for (const [id, list] of settled) pricesByProduct.set(id, list);
  } catch {
    priceState.value = 'error';
    return false;
  }

  const issues: PriceIssue[] = [];
  const updates: PriceUpdate[] = [];
  const silentUpdates: PriceUpdate[] = [];

  for (const item of items.value) {
    const name =
      (locale.value === 'ar' ? item.product.arabicName || item.product.name : item.product.name) ||
      item.productId;
    const list = pricesByProduct.get(item.productId) || [];
    const match =
      (item.priceId && list.find(p => p.id === item.priceId)) ||
      list.find(p => p.inventoryUserId && p.inventoryUserId === item.inventoryId);

    if (!match) {
      issues.push({ key: `${item.id}-unavailable`, kind: 'unavailable', name });
      continue;
    }

    const liveOriginal = Math.max(match.salesPrice, match.effectiveSalesPrice);
    if (Math.abs(match.effectiveSalesPrice - item.effectivePrice) > 0.009) {
      issues.push({
        key: `${item.id}-price`,
        kind: 'price',
        name,
        oldPrice: item.effectivePrice,
        newPrice: match.effectiveSalesPrice
      });
      updates.push({
        productId: item.productId,
        inventoryId: item.inventoryId,
        priceId: match.id,
        effectivePrice: match.effectiveSalesPrice,
        originalPrice: liveOriginal
      });
    } else if (Math.abs(liveOriginal - (item.originalPrice || 0)) > 0.009) {
      // Payable price is unchanged; only the stored list price drifted, which
      // would misreport savings. Correct it without bothering the buyer.
      silentUpdates.push({
        productId: item.productId,
        inventoryId: item.inventoryId,
        priceId: match.id,
        originalPrice: liveOriginal
      });
    }

    if (match.stockQuantity > 0 && match.stockQuantity < item.quantity) {
      issues.push({
        key: `${item.id}-stock`,
        kind: 'stock',
        name,
        available: match.stockQuantity,
        requested: item.quantity
      });
    }
  }

  if (silentUpdates.length > 0) applyPriceUpdates(silentUpdates);
  pendingPriceUpdates.value = updates;
  priceIssues.value = issues;
  priceState.value = issues.length === 0 ? 'verified' : 'issues';
  return priceState.value === 'verified';
}

function applyVerifiedPrices() {
  if (pendingPriceUpdates.value.length === 0) return;
  applyPriceUpdates(pendingPriceUpdates.value);
  pendingPriceUpdates.value = [];
  toast.success(t('checkout.priceUpdatedToast'));
  void verifyPrices();
  void revalidateCoupon();
}

async function revalidateCoupon() {
  if (!appliedCouponCode.value) return;
  try {
    const res = await couponsService.applyCoupon(appliedCouponCode.value, totalCartAmount.value);
    const disc = res?.discountAmount || (res?.discountPercentage ? ceilPrice(totalCartAmount.value * (res.discountPercentage / 100)) : 0);
    appliedDiscount.value = disc;
  } catch {
    appliedDiscount.value = 0;
    appliedCouponCode.value = '';
  }
}

function goToAddresses() {
  router.push('/addresses');
}

async function applyCoupon() {
  const code = couponInput.value.trim();
  if (!code) return;
  try {
    const res = await couponsService.applyCoupon(code, totalCartAmount.value);
    const disc = res?.discountAmount || (res?.discountPercentage ? ceilPrice(totalCartAmount.value * (res.discountPercentage / 100)) : 0);
    if (disc > 0) {
      appliedDiscount.value = disc;
      appliedCouponCode.value = code;
      toast.success(t('checkout.couponApplied', { amount: disc }));
    } else {
      appliedDiscount.value = 0;
      appliedCouponCode.value = '';
      toast.error(t('checkout.couponInvalid'));
    }
  } catch {
    appliedDiscount.value = 0;
    appliedCouponCode.value = '';
    toast.error(t('checkout.couponInvalid'));
  }
}

async function handlePlaceOrder() {
  if (items.value.length === 0) {
    toast.error(t('checkout.cartEmptyPrompt'));
    return;
  }

  if (!selectedAddressId.value) {
    addressError.value = true;
    toast.error(t('checkout.addressRequiredError'));
    addressStepEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (isShippingLoading.value || shippingFee.value === null) {
    toast.error(shippingError.value ? t('checkout.shippingFailed') : t('checkout.shippingPending'));
    return;
  }

  isPlacingOrder.value = true;
  try {
    const verified = await verifyPrices();
    if (!verified) {
      toast.error(
        priceState.value === 'issues'
          ? t('checkout.priceVerifyBlocked')
          : t('checkout.priceVerifyFailed')
      );
      return;
    }

    const res = await ordersService.createOrder({
      addresssId: selectedAddressId.value,
      deliveryTimeSlotId: selectedSlotId.value || undefined,
      couponCode: appliedCouponCode.value || undefined
    });

    const orderNum = res?.orderNumber || res?.id || `DRG-${Date.now().toString().slice(-6)}`;
    toast.success(t('checkout.orderPlacedToast', { num: orderNum }));
    clearCart();
    router.push(`/orders?placedOrder=${orderNum}`);
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || t('checkout.orderFailed');
    toast.error(msg, t('checkout.orderFailedTitle'));
  } finally {
    isPlacingOrder.value = false;
  }
}
</script>

<template>
  <div class="checkout-page">
    <div class="drugza-container checkout-container">
      <div class="checkout-header">
        <h1 class="checkout-title">{{ t('checkout.title') }}</h1>
        <p class="checkout-subtitle">{{ t('checkout.subtitle') }}</p>
      </div>

      <div
        class="checkout-grid"
        v-loading="{ loading: isPlacingOrder, text: t('checkout.placingOrderText') }"
      >
        <!-- Left: Form Steps -->
        <div class="checkout-steps-col">
          <!-- Step 1: Delivery Address -->
          <div
            ref="addressStepEl"
            class="step-card"
            :class="{ 'has-error': addressError }"
            v-loading="{ loading: isAddressesLoading, text: t('checkout.addressesLoading') }"
          >
            <div class="step-title-row">
              <span class="step-num">1</span>
              <div>
                <h3 class="step-name">{{ t('checkout.step1Title') }}</h3>
                <span class="step-hint">{{ t('checkout.step1Hint') }}</span>
              </div>
            </div>

            <div v-if="!isAddressesLoading && addresses.length === 0" class="address-empty-state">
              <span class="empty-ico-wrap"><MapPin :size="20" /></span>
              <div class="empty-copy">
                <strong>{{ t('checkout.noAddressTitle') }}</strong>
                <p>{{ t('checkout.noAddressHint') }}</p>
              </div>
              <Button variant="cta" size="sm" @click="goToAddresses">
                <PlusCircle :size="15" />
                <span>{{ t('checkout.addAddress') }}</span>
              </Button>
            </div>

            <div v-else class="options-list">
              <label
                v-for="addr in addresses"
                :key="addr.id"
                class="address-option"
                :class="{ 'is-selected': selectedAddressId === addr.id }"
              >
                <input
                  v-model="selectedAddressId"
                  type="radio"
                  :value="addr.id"
                  class="radio-dot"
                />
                <div class="addr-text">
                  <div class="addr-name-row">
                    <strong>{{ addr.title || addr.recipientName }}</strong>
                    <span v-if="addr.isDefault" class="default-chip">{{ t('checkout.defaultChip') }}</span>
                  </div>
                  <p class="addr-line">{{ addr.streetAddress }}{{ addr.areaName ? ', ' + addr.areaName : '' }}{{ addr.cityName ? ', ' + addr.cityName : '' }}</p>
                </div>
              </label>

              <p
                v-if="addresses.length > 0 && !selectedAddressId && !addressError"
                class="step-hint-inline"
              >
                {{ t('checkout.selectAddressPrompt') }}
              </p>

              <button
                v-if="addresses.length > 0"
                type="button"
                class="manage-addresses-link"
                @click="goToAddresses"
              >
                <PlusCircle :size="14" />
                <span>{{ t('checkout.manageAddresses') }}</span>
              </button>
            </div>

            <p v-if="addressError" class="step-error">
              <AlertTriangle :size="14" />
              <span>{{ t('checkout.addressRequiredError') }}</span>
            </p>
          </div>

          <!-- Step 2: Delivery Time Slot -->
          <div class="step-card">
            <div class="step-title-row">
              <span class="step-num">2</span>
              <div>
                <h3 class="step-name">{{ t('checkout.step2Title') }}</h3>
                <span class="step-hint">{{ t('checkout.step2Hint') }}</span>
              </div>
            </div>

            <div class="slots-grid">
              <label
                v-for="slot in timeSlots"
                :key="slot.id"
                class="slot-card"
                :class="{ 'is-selected': selectedSlotId === slot.id }"
              >
                <input
                  v-model="selectedSlotId"
                  type="radio"
                  :value="slot.id"
                  class="radio-dot"
                />
                <div class="slot-details">
                  <span v-if="slot.isNow" class="slot-badge">{{ t('checkout.expressBadge') }}</span>
                  <strong class="slot-label">{{ slot.name }}</strong>
                  <span v-if="slot.from || slot.to" class="slot-time">{{ slot.from }} - {{ slot.to }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 3: Payment Method (Cash on Delivery only) -->
          <div class="step-card">
            <div class="step-title-row">
              <span class="step-num">3</span>
              <div>
                <h3 class="step-name">{{ t('checkout.step3Title') }}</h3>
                <span class="step-hint">{{ t('checkout.step3Hint') }}</span>
              </div>
            </div>

            <div class="options-list">
              <label class="address-option is-selected">
                <input
                  type="radio"
                  checked
                  class="radio-dot"
                />
                <div class="addr-text">
                  <div class="addr-name-row">
                    <div class="pay-title">
                      <Truck :size="18" class="pay-ico" />
                      <strong>{{ t('checkout.codTitle') }}</strong>
                    </div>
                    <span class="default-chip">{{ t('checkout.recommended') }}</span>
                  </div>
                  <p class="addr-line">
                    {{ t('checkout.codDesc') }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 4: Special Instructions & Coupon -->
          <div class="step-card">
            <div class="step-title-row">
              <span class="step-num">4</span>
              <div>
                <h3 class="step-name">{{ t('checkout.step4Title') }}</h3>
                <span class="step-hint">{{ t('checkout.step4Hint') }}</span>
              </div>
            </div>

            <div class="coupon-box">
              <div class="coupon-input-wrap">
                <Tag :size="16" class="tag-ico" />
                <input
                  v-model="couponInput"
                  type="text"
                  :placeholder="t('checkout.couponPlaceholder')"
                  class="coupon-input"
                />
              </div>
              <Button variant="secondary" size="md" @click="applyCoupon">
                {{ t('checkout.applyCode') }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Right: Order Summary -->
        <div class="checkout-summary-col">
          <div class="summary-card">
            <h3 class="summary-title">{{ t('checkout.orderSummary') }}</h3>

            <!-- Multi-Warehouse Breakdown -->
            <div class="warehouses-summary">
              <span class="wh-label">{{ t('checkout.supplyingWarehouses') }}</span>
              <div
                v-for="g in suppliersGroups"
                :key="g.inventoryId"
                class="wh-row"
              >
                <span>{{ g.inventoryName }} ({{ t('checkout.itemsCount', { count: g.items.length }) }})</span>
                <strong>EGP {{ formatPrice(g.subtotal) }}</strong>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="calc-rows">
              <div class="calc-row">
                <span>{{ t('checkout.itemsSubtotal') }}</span>
                <strong>EGP {{ formatPrice(totalCartAmount) }}</strong>
              </div>
              <div class="calc-row green" v-if="totalSavings > 0">
                <span>
                  {{ t('checkout.volumeRebates') }}
                  <span class="included-hint">({{ t('checkout.includedInPrices') }})</span>
                </span>
                <strong>EGP {{ formatPrice(totalSavings) }}</strong>
              </div>
              <div class="calc-row green" v-if="appliedDiscount > 0">
                <span>{{ t('checkout.couponDiscount', { code: appliedCouponCode }) }}</span>
                <strong>- EGP {{ formatPrice(appliedDiscount) }}</strong>
              </div>
              <div class="calc-row">
                <span>
                  {{ t('checkout.coldChainLogistics') }}
                  <span v-if="selectedCityName" class="ship-city">— {{ selectedCityName }}</span>
                </span>
                <span v-if="isShippingLoading" class="ship-loading">
                  <span class="mini-spinner"></span>
                  {{ t('checkout.shippingCalculating') }}
                </span>
                <span v-else-if="shippingError" class="ship-error">
                  {{ t('checkout.shippingUnavailable') }}
                  <button type="button" class="retry-link" @click="loadShippingFee(selectedAddressId)">
                    {{ t('checkout.retry') }}
                  </button>
                </span>
                <span v-else-if="shippingFee === null" class="ship-pending">
                  {{ t('checkout.shippingPending') }}
                </span>
                <span v-else-if="shippingFee === 0" class="free-ship">{{ t('checkout.free') }}</span>
                <strong v-else>EGP {{ formatPrice(shippingFee) }}</strong>
              </div>
            </div>

            <div
              v-if="priceState !== 'idle'"
              class="price-check-card"
              :class="{
                'is-verified': priceState === 'verified',
                'is-issues': priceState === 'issues',
                'is-error': priceState === 'error'
              }"
            >
              <div class="pc-row">
                <span v-if="priceState === 'checking'" class="mini-spinner pc-ico"></span>
                <CheckCircle2 v-else-if="priceState === 'verified'" :size="16" class="pc-ico" />
                <AlertTriangle v-else :size="16" class="pc-ico" />
                <div class="pc-copy">
                  <strong v-if="priceState === 'checking'">{{ t('checkout.priceChecking') }}</strong>
                  <strong v-else-if="priceState === 'verified'">{{ t('checkout.priceVerified') }}</strong>
                  <strong v-else-if="priceState === 'issues'">{{ t('checkout.priceIssuesTitle') }}</strong>
                  <strong v-else>{{ t('checkout.priceVerifyFailed') }}</strong>

                  <ul v-if="priceState === 'issues' && priceIssues.length > 0" class="pc-issues">
                    <li v-for="issue in priceIssues" :key="issue.key">
                      <template v-if="issue.kind === 'price'">
                        {{ t('checkout.priceChanged', { name: issue.name, old: formatPrice(issue.oldPrice ?? 0), new: formatPrice(issue.newPrice ?? 0) }) }}
                      </template>
                      <template v-else-if="issue.kind === 'stock'">
                        {{ t('checkout.stockInsufficient', { name: issue.name, available: issue.available ?? 0, requested: issue.requested ?? 0 }) }}
                      </template>
                      <template v-else>
                        {{ t('checkout.priceUnavailable', { name: issue.name }) }}
                      </template>
                    </li>
                  </ul>
                  <p v-if="hasQuantityIssues" class="pc-hint">{{ t('checkout.adjustCartHint') }}</p>
                </div>
              </div>

              <div v-if="priceState === 'issues' && pendingPriceUpdates.length > 0" class="pc-actions">
                <Button variant="secondary" size="sm" @click="applyVerifiedPrices">
                  <RefreshCw :size="14" />
                  <span>{{ t('checkout.updatePrices') }}</span>
                </Button>
              </div>

              <div v-if="priceState === 'error'" class="pc-actions">
                <Button variant="outline" size="sm" @click="verifyPrices">
                  <RefreshCw :size="14" />
                  <span>{{ t('checkout.retry') }}</span>
                </Button>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="total-payable-row">
              <span class="total-label">{{ t('checkout.grandTotal') }}</span>
              <PriceDisplay v-if="shippingFee !== null" :price="finalPayable" size="lg" />
              <span v-else class="total-pending">{{ t('checkout.totalPending') }}</span>
            </div>

            <Button
              variant="cta"
              size="lg"
              block
              :disabled="isPlacingOrder"
              :loading="isPlacingOrder || priceState === 'checking'"
              class="place-order-btn"
              @click="handlePlaceOrder"
            >
              <span>{{ t('checkout.confirmOrder') }}</span>
              <ArrowRight :size="18" class="arrow-icon" />
            </Button>

            <div class="trust-guarantee">
              <ShieldCheck :size="16" class="trust-ico" />
              <span>{{ t('checkout.trustNotice') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
}

.checkout-header {
  margin-bottom: var(--space-xl);
}

.checkout-title {
  font-size: 2rem;
  color: var(--color-deep-blue);
}

.checkout-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-xl);
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .checkout-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}

.checkout-steps-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.step-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-xs);
}

.step-title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-name {
  font-size: 1.125rem;
  color: var(--color-deep-blue);
  line-height: 1.2;
}

.step-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.address-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.address-option:hover {
  background: var(--color-surface-hover);
}

.address-option.is-selected {
  border-color: var(--color-primary-blue);
  background: var(--color-pale-blue);
}

.radio-dot {
  margin-top: 3px;
  accent-color: var(--color-primary-blue);
}

.addr-text {
  flex-grow: 1;
}

.addr-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.addr-name-row strong {
  font-size: 0.875rem;
  color: var(--color-deep-blue);
}

.default-chip {
  font-size: 0.625rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-blue);
  background: #FFFFFF;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
}

.addr-line {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.pay-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pay-ico {
  color: var(--color-primary-blue);
}

/* Slots */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .slots-grid {
    grid-template-columns: 1fr;
  }
}

.slot-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.slot-card.is-selected {
  border-color: var(--color-primary-blue);
  background: var(--color-pale-blue);
}

.slot-details {
  display: flex;
  flex-direction: column;
}

.slot-badge {
  font-size: 0.625rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.slot-label {
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
}

.slot-time {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* Coupon Box */
.coupon-box {
  display: flex;
  gap: var(--space-xs);
}

.coupon-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.tag-ico {
  position: absolute;
  left: 12px;
  color: var(--color-text-tertiary);
}

.coupon-input {
  width: 100%;
  height: 42px;
  padding: 0 12px 0 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

/* Right Summary */
.summary-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 96px;
}

.summary-title {
  font-size: 1.25rem;
  color: var(--color-deep-blue);
  margin-bottom: var(--space-md);
}

.warehouses-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
}

.wh-label {
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.wh-row {
  display: flex;
  justify-content: space-between;
  color: var(--color-deep-blue);
}

.summary-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-md) 0;
}

.calc-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--font-size-sm);
}

.calc-row {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-secondary);
}

.calc-row.green strong {
  color: var(--color-success);
}

.free-ship {
  font-weight: var(--font-weight-bold);
  color: var(--color-success);
}

.included-hint {
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
}

.ship-city {
  color: var(--color-text-tertiary);
  font-size: 0.6875rem;
}

.ship-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--color-text-secondary);
}

.mini-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid rgba(25, 118, 173, 0.18);
  border-top-color: var(--color-primary-blue);
  animation: drugza-spin 0.8s linear infinite;
}

.ship-error {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #d93a3f;
}

.retry-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-blue);
  text-decoration: underline;
  cursor: pointer;
}

.ship-pending {
  font-size: 0.72rem;
  color: var(--color-text-tertiary);
}

.total-pending {
  font-size: 0.78rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
}

/* Address states */
.step-card.has-error {
  border-color: #e5484d;
  box-shadow: 0 0 0 3px rgba(229, 72, 77, 0.08);
}

.address-empty-state {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  padding: var(--space-md);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-off-white);
}

.empty-ico-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.empty-copy {
  flex: 1 1 200px;
  min-width: 0;
}

.empty-copy strong {
  display: block;
  font-size: 0.875rem;
  color: var(--color-deep-blue);
}

.empty-copy p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.5;
}

.manage-addresses-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  padding: 2px 0;
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
  cursor: pointer;
  align-self: flex-start;
}

.manage-addresses-link:hover {
  text-decoration: underline;
}

.step-hint-inline {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: #b45309;
  margin-top: 2px;
}

.step-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: #d93a3f;
}

/* Price & stock verification */
.price-check-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: var(--space-md);
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-off-white);
}

.price-check-card.is-verified {
  border-color: rgba(14, 159, 110, 0.35);
  background: rgba(14, 159, 110, 0.06);
}

.price-check-card.is-issues {
  border-color: rgba(217, 119, 6, 0.4);
  background: rgba(217, 119, 6, 0.07);
}

.price-check-card.is-error {
  border-color: rgba(229, 72, 77, 0.35);
  background: rgba(229, 72, 77, 0.06);
}

.pc-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.pc-ico {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-text-tertiary);
}

.is-verified .pc-ico {
  color: #0e9f6e;
}

.is-issues .pc-ico,
.is-error .pc-ico {
  color: #d97706;
}

.pc-copy {
  min-width: 0;
}

.pc-copy strong {
  display: block;
  font-size: 0.78rem;
  color: var(--color-deep-blue);
  line-height: 1.45;
}

.pc-issues {
  margin: 6px 0 0;
  padding-inline-start: 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.72rem;
  color: var(--color-text-secondary);
}

.pc-hint {
  margin-top: 6px;
  font-size: 0.72rem;
  color: #b45309;
  line-height: 1.5;
}

.pc-actions {
  display: flex;
  justify-content: flex-start;
}

.total-payable-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.total-label {
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
}

.place-order-btn {
  margin-bottom: var(--space-md);
}

.trust-guarantee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.trust-ico {
  color: var(--color-success);
  flex-shrink: 0;
}

/* RTL Overrides */
[dir="rtl"] .tag-ico {
  left: auto;
  right: 12px;
}

[dir="rtl"] .coupon-input {
  padding: 0 36px 0 12px;
}

@media (max-width: 640px) {
  .checkout-page {
    padding: var(--space-md) 0 var(--space-xl);
  }
  .checkout-header {
    margin-bottom: var(--space-md);
  }
  .checkout-title {
    font-size: 1.5rem;
  }
  .step-card {
    padding: var(--space-md);
  }
  .summary-card {
    position: static;
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .coupon-box {
    flex-direction: column;
  }
  .coupon-box button {
    width: 100%;
  }
  .step-title-row {
    gap: var(--space-xs);
  }
}
</style>