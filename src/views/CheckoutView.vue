<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  MapPin,
  Clock,
  CreditCard,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight
} from 'lucide-vue-next';
import { useCart } from '@/composables/useCart';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';
import PriceDisplay from '@/components/ui/PriceDisplay.vue';
import Button from '@/components/ui/Button.vue';
import { useI18n } from '@/composables/useI18n';
import { formatPrice, ceilPrice } from '@/utils/price';

const router = useRouter();
const toast = useToast();
const { t, locale } = useI18n();
import { onMounted } from 'vue';
import { addressService, ordersService, couponsService } from '@/services';
import type { Address, DeliveryTimeSlotDto } from '@/types';

const { totalCartAmount, totalSavings, items, suppliersGroups, clearCart } = useCart();
const { user, isAuthenticated } = useAuth();

// Checkout Steps
const selectedAddressId = ref('');
const selectedSlotId = ref('');
const selectedPayment = ref<'cod' | 'card'>('cod');
const couponCode = ref('');
const appliedDiscount = ref(0);
const isPlacingOrder = ref(false);

const addresses = ref<Address[]>([]);
const timeSlots = ref<DeliveryTimeSlotDto[]>([]);

onMounted(async () => {
  try {
    const [addrList, slotList] = await Promise.allSettled([
      addressService.getUserAddresses(),
      ordersService.getDeliveryTimeSlots(1)
    ]);

    if (addrList.status === 'fulfilled' && addrList.value.length > 0) {
      addresses.value = addrList.value;
      selectedAddressId.value = addrList.value[0].id;
    }
    if (slotList.status === 'fulfilled' && slotList.value.length > 0) {
      timeSlots.value = slotList.value;
      selectedSlotId.value = slotList.value[0].id;
    }
  } catch (e) {
    console.warn('Error loading checkout prerequisites:', e);
  }
});

const shippingFee = computed(() => {
  return totalCartAmount.value >= 1000 ? 0 : 25;
});

const finalPayable = computed(() => {
  return Math.max(0, totalCartAmount.value + shippingFee.value - appliedDiscount.value);
});

async function applyCoupon() {
  if (!couponCode.value.trim()) return;
  try {
    const res = await couponsService.applyCoupon(couponCode.value.trim(), totalCartAmount.value);
    const disc = res?.discountAmount || (res?.discountPercentage ? ceilPrice(totalCartAmount.value * (res.discountPercentage / 100)) : 0);
    if (disc > 0) {
      appliedDiscount.value = disc;
      toast.success(
        locale.value === 'ar'
          ? `تم تطبيق الكوبون بنجاح! قيمة الخصم: ${disc} ج.م`
          : `Coupon ${couponCode.value} applied successfully! Discount: ${disc} EGP`
      );
    } else {
      appliedDiscount.value = 0;
      toast.error(
        locale.value === 'ar'
          ? 'كود الكوبون غير صالح أو انتهت صلاحيته.'
          : 'Invalid or expired coupon code.'
      );
    }
  } catch {
    appliedDiscount.value = 0;
    toast.error(
      locale.value === 'ar'
        ? 'كود الكوبون غير صالح.'
        : 'Invalid coupon code.'
    );
  }
}

async function handlePlaceOrder() {
  if (items.value.length === 0) {
    toast.error('Your cart is empty. Please add products first.');
    return;
  }
  if (!selectedAddressId.value) {
    toast.warning('Please select a delivery address.');
    return;
  }

  isPlacingOrder.value = true;
  try {
    const res = await ordersService.createOrder({
      addresssId: selectedAddressId.value,
      deliveryTimeSlotId: selectedSlotId.value || undefined,
      couponCode: couponCode.value || undefined
    });

    const orderNum = res?.orderNumber || res?.id || `DRG-${Date.now().toString().slice(-6)}`;
    toast.success(`Order #${orderNum} placed successfully! Confirmed with distributor warehouses.`);
    clearCart();
    isPlacingOrder.value = false;
    router.push(`/orders?placedOrder=${orderNum}`);
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Failed to submit order. Please try again.';
    toast.error(msg, 'Order Failed');
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
        v-loading="{ loading: isPlacingOrder, text: locale === 'ar' ? 'جاري تأكيد طلبيتك وإرسالها للمستودعات...' : 'Placing and routing your wholesale orders...' }"
      >
        <!-- Left: Form Steps -->
        <div class="checkout-steps-col">
          <!-- Step 1: Delivery Address -->
          <div class="step-card">
            <div class="step-title-row">
              <span class="step-num">1</span>
              <div>
                <h3 class="step-name">{{ t('checkout.step1Title') }}</h3>
                <span class="step-hint">{{ t('checkout.step1Hint') }}</span>
              </div>
            </div>

            <div class="options-list">
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
            </div>
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
                  <span v-if="slot.isNow" class="slot-badge">{{ locale === 'ar' ? 'فوري' : 'Express' }}</span>
                  <strong class="slot-label">{{ slot.name }}</strong>
                  <span v-if="slot.from || slot.to" class="slot-time">{{ slot.from }} - {{ slot.to }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 3: Payment Method (Cash on Delivery or Bank Card - No Credit/Wallet) -->
          <div class="step-card">
            <div class="step-title-row">
              <span class="step-num">3</span>
              <div>
                <h3 class="step-name">{{ t('checkout.step3Title') }}</h3>
                <span class="step-hint">{{ t('checkout.step3Hint') }}</span>
              </div>
            </div>

            <div class="options-list">
              <!-- Cash on Delivery -->
              <label
                class="address-option"
                :class="{ 'is-selected': selectedPayment === 'cod' }"
              >
                <input
                  v-model="selectedPayment"
                  type="radio"
                  value="cod"
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

              <!-- Online Card -->
              <label
                class="address-option"
                :class="{ 'is-selected': selectedPayment === 'card' }"
              >
                <input
                  v-model="selectedPayment"
                  type="radio"
                  value="card"
                  class="radio-dot"
                />
                <div class="addr-text">
                  <div class="addr-name-row">
                    <div class="pay-title">
                      <CreditCard :size="18" class="pay-ico" />
                      <strong>{{ t('checkout.cardTitle') }}</strong>
                    </div>
                  </div>
                  <p class="addr-line">
                    {{ t('checkout.cardDesc') }}
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
                  v-model="couponCode"
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
                <span>{{ t('checkout.volumeRebates') }}</span>
                <strong>- EGP {{ formatPrice(totalSavings) }}</strong>
              </div>
              <div class="calc-row green" v-if="appliedDiscount > 0">
                <span>{{ t('checkout.couponDiscount', { code: 'DRUGZA10' }) }}</span>
                <strong>- EGP {{ formatPrice(appliedDiscount) }}</strong>
              </div>
              <div class="calc-row">
                <span>{{ t('checkout.coldChainLogistics') }}</span>
                <span v-if="shippingFee === 0" class="free-ship">{{ t('checkout.free') }}</span>
                <strong v-else>EGP {{ formatPrice(shippingFee) }}</strong>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="total-payable-row">
              <span class="total-label">{{ t('checkout.grandTotal') }}</span>
              <PriceDisplay :price="finalPayable" size="lg" />
            </div>

            <Button
              variant="cta"
              size="lg"
              block
              :disabled="isPlacingOrder"
              :loading="isPlacingOrder"
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