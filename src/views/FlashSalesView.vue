<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
  Flame,
  Search,
  Building2,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Percent,
  X
} from 'lucide-vue-next';
import type { Product } from '@/types';
import { productsService } from '@/services';
import ProductCard from '@/components/domain/ProductCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import Button from '@/components/ui/Button.vue';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const { t, locale, isRtl } = useI18n();

const products = ref<Product[]>([]);
const isLoading = ref(true);

const searchQuery = ref('');
const selectedProvider = ref('all');
const selectedSort = ref<'discount' | 'price-asc' | 'price-desc' | 'name'>('discount');

const selectedProduct = ref<Product | null>(null);
const isModalOpen = ref(false);

// Countdown Timer logic (Target midnight or 8 hours ahead)
const now = new Date();
const targetTime = new Date();
targetTime.setHours(23, 59, 59, 999);
const remainingSeconds = ref(Math.max(3600, Math.floor((targetTime.getTime() - now.getTime()) / 1000)));

let timerInterval: ReturnType<typeof setInterval> | null = null;

const hours = computed(() => Math.floor(remainingSeconds.value / 3600));
const minutes = computed(() => Math.floor((remainingSeconds.value % 3600) / 60));
const seconds = computed(() => remainingSeconds.value % 60);

onMounted(async () => {
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      remainingSeconds.value = 86400; // Reset to 24 hours
    }
  }, 1000);

  await loadFlashProducts();
});

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});

async function loadFlashProducts() {
  isLoading.value = true;
  try {
    const list = await productsService.getFlashSaleProducts();
    products.value = list;
  } catch (err) {
    console.warn('Error loading flash products in FlashSalesView:', err);
    products.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Available Providers from current flash sales
const providersList = computed(() => {
  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const p of products.value) {
    const rawName = p.inventoryName || t('flashSales.verifiedWarehouse');
    const name = rawName.trim();
    const id = (p.inventoryId || name).trim();
    if (!map.has(name)) {
      map.set(name, { id, name, count: 0 });
    }
    map.get(name)!.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
});

// Max discount across all deals
const maxDiscount = computed(() => {
  if (products.value.length === 0) return 80;
  return Math.max(...products.value.map(p => p.discountRate || 0));
});

// Filtered and Sorted Products
const filteredProducts = computed(() => {
  let list = [...products.value];

  // Provider filter
  if (selectedProvider.value !== 'all') {
    const target = selectedProvider.value.trim().toLowerCase();
    list = list.filter(p => {
      const pInvId = (p.inventoryId || '').trim().toLowerCase();
      const pInvName = (p.inventoryName || '').trim().toLowerCase();
      return pInvId === target || pInvName === target;
    });
  }

  // Search filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(p => {
      const n = (p.name || '').toLowerCase();
      const ar = (p.arabicName || '').toLowerCase();
      const ing = (p.activeIngredient || '').toLowerCase();
      const brand = (p.brandName || '').toLowerCase();
      const prov = (p.inventoryName || '').toLowerCase();
      return n.includes(q) || ar.includes(q) || ing.includes(q) || brand.includes(q) || prov.includes(q);
    });
  }

  // Sorting
  return list.sort((a, b) => {
    if (selectedSort.value === 'discount') {
      return (b.discountRate || 0) - (a.discountRate || 0);
    }
    if (selectedSort.value === 'price-asc') {
      return a.price - b.price;
    }
    if (selectedSort.value === 'price-desc') {
      return b.price - a.price;
    }
    if (selectedSort.value === 'name') {
      const nameA = locale.value === 'ar' && a.arabicName ? a.arabicName : a.name;
      const nameB = locale.value === 'ar' && b.arabicName ? b.arabicName : b.name;
      return nameA.localeCompare(nameB);
    }
    return 0;
  });
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isModalOpen.value = true;
}

function handleViewAlternatives(ingredientId: string) {
  router.push({ path: '/catalog', query: { search: ingredientId } });
}

function resetFilters() {
  selectedProvider.value = 'all';
  searchQuery.value = '';
  selectedSort.value = 'discount';
}
</script>

<template>
  <div class="flash-sales-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" :class="{ 'rtl-flip': isRtl }" />
        <span class="current">{{ t('flashSales.breadcrumbCurrent') }}</span>
      </nav>

      <!-- Flash Sale Hero Banner -->
      <section class="flash-hero-banner">
        <div class="banner-content">
          <div class="pill-fire-badge">
            <Flame :size="18" class="flame-icon animate-pulse" />
            <span>{{ t('flashSales.badge') }}</span>
          </div>

          <h1 class="flash-hero-title">
            {{ t('flashSales.heroTitle') }}
            <span class="highlight-text">{{ t('flashSales.upToDiscount', { discount: maxDiscount }) }}</span>
          </h1>

          <p class="flash-hero-sub">
            {{ t('flashSales.subtitleDesc') }}
          </p>

          <!-- Feature Trust Badges -->
          <div class="hero-trust-row">
            <span class="trust-badge">
              <Percent :size="14" />
              <span>{{ t('flashSales.realDiscount', { discount: maxDiscount }) }}</span>
            </span>
            <span class="trust-badge">
              <Truck :size="14" />
              <span>{{ t('flashSales.directFastShipping') }}</span>
            </span>
            <span class="trust-badge">
              <ShieldCheck :size="14" />
              <span>{{ t('flashSales.edaVerifiedProducts') }}</span>
            </span>
          </div>
        </div>

        <!-- Live Countdown Timer Card -->
        <div class="countdown-card">
          <div class="countdown-top-header">
            <Sparkles :size="15" class="sparkle-icon" />
            <span>{{ products.length > 0 ? t('flashSale.countdownLabel') : t('flashSales.statusBadge') }}</span>
          </div>

          <div v-if="products.length > 0" class="countdown-digits-grid">
            <div class="digit-box">
              <span class="num">{{ String(hours).padStart(2, '0') }}</span>
              <span class="unit">{{ t('flashSale.hours') }}</span>
            </div>
            <span class="colon">:</span>
            <div class="digit-box">
              <span class="num">{{ String(minutes).padStart(2, '0') }}</span>
              <span class="unit">{{ t('flashSale.mins') }}</span>
            </div>
            <span class="colon">:</span>
            <div class="digit-box">
              <span class="num">{{ String(seconds).padStart(2, '0') }}</span>
              <span class="unit">{{ t('flashSale.secs') }}</span>
            </div>
          </div>
          <div v-else class="no-active-notice">
            <Flame :size="24" class="no-active-fire" />
            <p>{{ t('flashSales.noDealsTitle') }}</p>
            <span class="no-active-sub">{{ t('flashSales.noDealsSub') }}</span>
          </div>

          <div class="deals-counter-bar">
            <span>{{ t('flashSales.activeDealsLabel') }}</span>
            <strong>{{ t('flashSales.discountedCount', { count: products.length }) }}</strong>
          </div>
        </div>
      </section>

      <!-- Filter & Search Controls Bar -->
      <section v-if="products.length > 0" class="controls-bar-card">
        <!-- Search Input -->
        <div class="search-box">
          <Search :size="16" class="search-ico" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('flashSales.searchPlaceholder')"
            class="filter-input"
          />
          <button v-if="searchQuery" type="button" class="clear-btn" @click="searchQuery = ''">
            <X :size="16" />
          </button>
        </div>

        <!-- Sort Select -->
        <div class="sort-box">
          <SlidersHorizontal :size="15" class="sort-ico" />
          <select v-model="selectedSort" class="sort-select">
            <option value="discount">{{ t('flashSales.sortByDiscount') }}</option>
            <option value="price-asc">{{ t('flashSales.sortByPriceAsc') }}</option>
            <option value="price-desc">{{ t('flashSales.sortByPriceDesc') }}</option>
            <option value="name">{{ t('flashSales.sortByName') }}</option>
          </select>
        </div>
      </section>

      <!-- Provider Filter Chips -->
      <div v-if="providersList.length > 0" class="providers-chips-row">
        <span class="chips-title">
          <Building2 :size="14" />
          <span>{{ t('flashSales.warehouseLabel') }}</span>
        </span>

        <div class="chips-scroll">
          <button
            type="button"
            class="provider-pill"
            :class="{ active: selectedProvider === 'all' }"
            @click="selectedProvider = 'all'"
          >
            <span>{{ t('flashSales.allWarehouses') }}</span>
            <span class="count">{{ products.length }}</span>
          </button>

          <button
            v-for="prov in providersList"
            :key="prov.name"
            type="button"
            class="provider-pill"
            :class="{ active: selectedProvider.trim() === prov.name.trim() }"
            @click="selectedProvider = (selectedProvider.trim() === prov.name.trim() ? 'all' : prov.name.trim())"
          >
            <span>{{ prov.name }}</span>
            <span class="count">{{ prov.count }}</span>
          </button>
        </div>
      </div>

      <!-- Active Filter Status Bar -->
      <div v-if="selectedProvider !== 'all' || searchQuery" class="active-chips-strip">
        <span class="active-label">{{ t('common.activeFilters') }}</span>
        <span v-if="selectedProvider !== 'all'" class="filter-chip">
          <Building2 :size="12" />
          {{ selectedProvider }}
          <X :size="12" class="remove-chip" @click="selectedProvider = 'all'" />
        </span>
        <span v-if="searchQuery" class="filter-chip">
          "{{ searchQuery }}"
          <X :size="12" class="remove-chip" @click="searchQuery = ''" />
        </span>
        <button type="button" class="reset-link" @click="resetFilters">
          {{ t('common.resetFilters') }}
        </button>
      </div>

      <!-- Products Grid -->
      <div class="products-container">
        <!-- Loading Skeletons -->
        <div v-if="isLoading" class="flash-grid">
          <div
            v-for="i in 8"
            :key="'flash-skel-' + i"
            class="skeleton-card"
          >
            <Skeleton height="175px" radius="12px" />
            <Skeleton width="40%" height="16px" radius="4px" />
            <Skeleton width="85%" height="18px" radius="4px" />
            <Skeleton width="60%" height="14px" radius="4px" />
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px;">
              <Skeleton width="80px" height="24px" radius="6px" />
              <Skeleton width="38px" height="38px" radius="10px" />
            </div>
          </div>
        </div>

        <!-- Render Flash Products -->
        <template v-else-if="filteredProducts.length > 0">
          <div class="flash-grid">
            <ProductCard
              v-for="prod in filteredProducts"
              :key="prod.id + (prod.inventoryId || '')"
              :product="prod"
              @view-details="handleViewProduct"
              @view-alternatives="handleViewAlternatives"
            />
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="empty-deals-card">
          <div class="empty-icon-box">
            <Flame :size="40" />
          </div>
          <template v-if="products.length === 0">
            <h3>{{ t('flashSales.emptyAllTitle') }}</h3>
            <p>{{ t('flashSales.emptyAllDesc') }}</p>
            <div class="empty-actions">
              <Button variant="primary" size="md" @click="router.push('/catalog')">
                <span>{{ t('flashSales.browseCatalogBtn') }}</span>
              </Button>
              <Button variant="outline" size="md" @click="router.push('/')">
                <span>{{ t('common.backToHome') }}</span>
              </Button>
            </div>
          </template>
          <template v-else>
            <h3>{{ t('flashSales.emptyFilterTitle') }}</h3>
            <p>{{ t('flashSales.emptyFilterDesc') }}</p>
            <Button variant="primary" size="md" @click="resetFilters">
              <span>{{ t('common.resetFilters') }}</span>
            </Button>
          </template>
        </div>
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
.flash-sales-page {
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
  text-decoration: none;
}

.breadcrumb-row a:hover {
  color: var(--color-primary-blue);
}

.breadcrumb-row .current {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
}

.arrow-icon.rtl-flip {
  transform: rotate(180deg);
}

/* Flash Hero Banner */
.flash-hero-banner {
  background: linear-gradient(135deg, #092336 0%, #12496B 60%, #1E3A5F 100%);
  border-radius: var(--radius-2xl);
  padding: 36px 36px;
  color: #FFFFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  margin-bottom: var(--space-xl);
  box-shadow: 0 10px 30px rgba(18, 73, 107, 0.15);
  position: relative;
  overflow: hidden;
}

.flash-hero-banner::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(239, 68, 68, 0) 70%);
  pointer-events: none;
}

.banner-content {
  max-width: 650px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1;
}

.pill-fire-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #FFA384;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  width: fit-content;
}

.flame-icon {
  color: #F97316;
}

.animate-pulse {
  animation: pulseFire 1.5s infinite;
}

@keyframes pulseFire {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

.flash-hero-title {
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.25;
  color: #FFFFFF;
  margin: 0;
}

.highlight-text {
  color: #FBBF24;
  display: inline-block;
  margin-inline-start: 6px;
}

.flash-hero-sub {
  font-size: 0.96rem;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.6;
  margin: 0;
}

.hero-trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #E2E8F0;
  backdrop-filter: blur(4px);
}

/* Countdown Card */
.countdown-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 22px 26px;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 260px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.countdown-top-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #FBBF24;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.countdown-digits-grid {
  display: flex;
  align-items: center;
  gap: 8px;
}

.digit-box {
  background: rgba(10, 37, 56, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 58px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.digit-box .num {
  font-family: var(--font-family-mono, monospace);
  font-size: 1.6rem;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1;
}

.digit-box .unit {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 4px;
}

.colon {
  font-size: 1.4rem;
  font-weight: 800;
  color: #F97316;
  animation: blinkColon 1s infinite;
}

@keyframes blinkColon {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.deals-counter-bar {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  gap: 6px;
}

.deals-counter-bar strong {
  color: #FBBF24;
}

/* Controls Bar Card */
.controls-bar-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 12px 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 240px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-ico {
  position: absolute;
  right: 12px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

[dir="ltr"] .search-ico {
  right: auto;
  left: 12px;
}

.filter-input {
  width: 100%;
  padding: 10px 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 0.9rem;
  color: var(--color-deep-blue);
  background: #F8FAFC;
  outline: none;
  transition: all 0.2s;
}

.filter-input:focus {
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: 0 0 0 3px rgba(18, 73, 107, 0.1);
}

.clear-btn {
  position: absolute;
  left: 10px;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
}

[dir="ltr"] .clear-btn {
  left: auto;
  right: 10px;
}

.clear-btn:hover {
  color: var(--color-danger);
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0 12px;
}

.sort-ico {
  color: var(--color-text-secondary);
}

.sort-select {
  border: none;
  background: transparent;
  padding: 10px 4px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-deep-blue);
  outline: none;
  cursor: pointer;
}

/* Providers Chips Row */
.providers-chips-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--space-md);
  padding: 4px 0;
  overflow-x: auto;
}

.chips-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.chips-scroll {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.chips-scroll::-webkit-scrollbar {
  display: none;
}

.provider-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-deep-blue);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.provider-pill:hover {
  border-color: var(--color-primary-blue);
  background: #F0F9FF;
}

.provider-pill.active {
  background: var(--color-deep-blue);
  border-color: var(--color-deep-blue);
  color: #FFFFFF;
}

.provider-pill .count {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
}

.provider-pill.active .count {
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

/* Active Chips Strip */
.active-chips-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
  font-size: 0.84rem;
}

.active-label {
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1D4ED8;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
}

.remove-chip {
  cursor: pointer;
  color: #1D4ED8;
}

.remove-chip:hover {
  color: #DC2626;
}

.reset-link {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: underline;
  margin-inline-start: 6px;
}

/* Products Container & Grid */
.products-container {
  margin-top: var(--space-md);
}

.flash-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .flash-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 840px) {
  .flash-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 540px) {
  .flash-grid {
    grid-template-columns: 1fr;
  }
}

.skeleton-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Empty State */
.empty-deals-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 520px;
  margin: 32px auto;
  box-shadow: var(--shadow-sm);
}

.empty-icon-box {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #FEF3C7;
  color: #D97706;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-deals-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin: 0;
}

.empty-deals-card p {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.no-active-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  text-align: center;
}

.no-active-fire {
  color: #F59E0B;
}

.no-active-notice p {
  color: #FFFFFF;
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.no-active-sub {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .flash-hero-banner {
    flex-direction: column;
    align-items: stretch;
    padding: 24px 20px;
  }

  .countdown-card {
    width: 100%;
  }

  .flash-hero-title {
    font-size: 1.6rem;
  }
}
</style>
