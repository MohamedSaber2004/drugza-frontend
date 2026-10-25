<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Building2,
  Clock,
  Tag,
  CheckCircle2,
  ShoppingBag,
  Flame
} from 'lucide-vue-next';
import type { Product, Category, Supplier } from '@/types';
import {
  homeService,
  type HomeBanner,
  type HomeSpecialOffer
} from '@/services/home.service';
import { categoriesService } from '@/services/categories.service';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue';
import SectionPlaceholder from '@/components/ui/SectionPlaceholder.vue';
import ProductCard from '@/components/domain/ProductCard.vue';
import CategoryCard from '@/components/domain/CategoryCard.vue';
import SupplierCard from '@/components/domain/SupplierCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import { useI18n } from '@/composables/useI18n';
import { useAuth } from '@/composables/useAuth';
import { onImageError } from '@/utils/placeholders';
import { encryptId } from '@/utils/id-crypto';

const router = useRouter();
const { t, locale, isRtl } = useI18n();
const { user } = useAuth();

// Unified Home State loaded from the public home endpoints
const isLoading = ref(true);
const categories = ref<Category[] | null>(null);
const suppliers = ref<Supplier[] | null>(null);
const products = ref<Product[] | null>(null);
const flashSales = ref<Product[] | null>(null);
const banners = ref<HomeBanner[] | null>(null);
const specialOffersOne = ref<HomeSpecialOffer[] | null>(null);
const specialOffersTwo = ref<HomeSpecialOffer[] | null>(null);
const customBusinessName = ref<string | null>(null);
const businessName = computed(() => customBusinessName.value || user.value?.fullName || user.value?.businessName || null);

const featuredCategories = computed(() => categories.value?.slice(0, 12) ?? null);
const featuredSuppliers = computed(() => suppliers.value?.slice(0, 8) ?? null);

const currentBannerIdx = ref(0);
const isHoveringBanner = ref(false);
const selectedProduct = ref<Product | null>(null);
const isProductModalOpen = ref(false);

// Auto-rotate promotional banners
setInterval(() => {
  if (!isHoveringBanner.value && banners.value && banners.value.length > 1) {
    nextBanner();
  }
}, 5000);

function nextBanner() {
  if (!banners.value || banners.value.length <= 1) return;
  currentBannerIdx.value = (currentBannerIdx.value + 1) % banners.value.length;
}

function prevBanner() {
  if (!banners.value || banners.value.length <= 1) return;
  currentBannerIdx.value = (currentBannerIdx.value - 1 + banners.value.length) % banners.value.length;
}

// Touch swipe support for mobile & tablet
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e: TouchEvent) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    touchStartX = e.changedTouches[0].screenX;
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    touchEndX = e.changedTouches[0].screenX;
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // Swiped left
        isRtl.value ? prevBanner() : nextBanner();
      } else {
        // Swiped right
        isRtl.value ? nextBanner() : prevBanner();
      }
    }
  }
}

function handleBannerClick(banner?: { link?: string }) {
  if (!banner?.link) {
    router.push('/catalog');
    return;
  }
  const target = banner.link.trim();
  if (target.startsWith('http://') || target.startsWith('https://')) {
    window.open(target, '_blank');
  } else if (target.startsWith('/')) {
    router.push(target);
  } else {
    router.push('/catalog');
  }
}

// Countdown timer for Flash Sale
const hours = ref(14);
const minutes = ref(38);
const seconds = ref(45);

setInterval(() => {
  if (seconds.value > 0) {
    seconds.value--;
  } else {
    seconds.value = 59;
    if (minutes.value > 0) {
      minutes.value--;
    } else {
      minutes.value = 59;
      if (hours.value > 0) hours.value--;
    }
  }
}, 1000);

// Dynamic largest offer calculation strictly from API products & flash sales
const maxDiscountRate = computed(() => {
  const allProds = [...(products.value || []), ...(flashSales.value || [])];
  const discounts = allProds
    .map(p => p.discountRate || 0)
    .filter(rate => rate > 0);
  return discounts.length > 0 ? Math.max(...discounts) : 0;
});

const promoHeadline = computed(() => {
  if (maxDiscountRate.value > 0) {
    return t('home.maxDiscountsBanner', { rate: maxDiscountRate.value });
  }
  return '';
});

// Single unified onMounted loading all public home sections
onMounted(async () => {
  isLoading.value = true;
  const [homeRes, catsRes] = await Promise.allSettled([
    homeService.getHome(),
    categoriesService.getCategories()
  ]);

  if (homeRes.status === 'fulfilled') {
    const data = homeRes.value;
    banners.value = data.banners;
    // The home payload can list deleted category ids, so prefer the canonical list.
    categories.value =
      catsRes.status === 'fulfilled' && catsRes.value.length > 0
        ? catsRes.value
        : data.categories;
    products.value = data.products;
    suppliers.value = data.providers;
    specialOffersOne.value = data.specialOffersone;
    specialOffersTwo.value = data.specialOfferstwo;
    flashSales.value = data.flashSales;
    customBusinessName.value = data.businessName || null;
  } else {
    console.warn('Error loading home data:', homeRes.reason);
    banners.value = null;
    categories.value = catsRes.status === 'fulfilled' && catsRes.value.length > 0 ? catsRes.value : null;
    products.value = null;
    suppliers.value = null;
    specialOffersOne.value = null;
    specialOffersTwo.value = null;
    flashSales.value = null;
  }
  isLoading.value = false;
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isProductModalOpen.value = true;
}

// Hero search: typing a keyword navigates to the All Products (catalog) filter
const heroSearchQuery = ref('');

function handleHeroSearch() {
  const q = heroSearchQuery.value.trim();
  if (!q) {
    router.push('/catalog');
    return;
  }
  router.push({ path: '/catalog', query: { search: q } });
}

// When clicking a category -> navigate to dedicated Category Providers page
function handleSelectCategory(cat: Category) {
  router.push(`/categories/${encryptId(cat.id)}`);
}

// When clicking a supplier -> navigate to dedicated Provider Products page
function handleSelectSupplier(sup: Supplier) {
  router.push(`/providers/${encryptId(sup.id)}`);
}

function handleViewAlternatives(ingredientId: string) {
  router.push(`/catalog?search=${ingredientId}`);
}
</script>

<template>
  <div class="drugza-home-page">
    <!-- =========================================================================
         1. HERO SECTION
         ========================================================================= -->
    <section class="hero-section">
      <div class="drugza-container hero-container">
        <div class="hero-content" v-reveal>
          <!-- Trust Pill / Personalized Welcome -->
          <div class="hero-badge">
            <span class="pulse-icon"></span>
            <span v-if="businessName">{{ t('home.welcomeUser', { name: businessName }) }}</span>
            <span v-else>{{ t('hero.badge') }}</span>
          </div>

          <!-- Main Headlines -->
          <h1 class="hero-headline">
            {{ t('hero.title') }}
          </h1>

          <p class="hero-subtext">
            {{ t('hero.subtitle') }}
          </p>

          <!-- Interactive Hero Search Bar -->
          <form class="hero-search-box" role="search" @submit.prevent="handleHeroSearch">
            <Search :size="20" class="search-ico" />
            <input
              v-model="heroSearchQuery"
              type="text"
              class="hero-search-input"
              :placeholder="t('hero.searchPlaceholder')"
              :aria-label="t('hero.searchPlaceholder')"
            />
            <Button variant="cta" size="md" type="submit" class="hero-search-btn">
              <span>{{ t('hero.searchBtn') }}</span>
              <ArrowRight :size="16" class="arrow-icon" />
            </Button>
          </form>

          <!-- CTAs -->
          <div class="hero-actions">
            <Button variant="cta" size="lg" @click="router.push('/catalog')">
              <ShoppingBag :size="18" />
              <span>{{ t('hero.shopNow') }}</span>
            </Button>
            <Button variant="secondary" size="lg" @click="router.push('/catalog')">
              <Layers :size="18" />
              <span>{{ t('hero.exploreCatalog') }}</span>
            </Button>
          </div>
        </div>

        <!-- Hero Visual Showcase (Fixed Drugza Logo / Brand Image) -->
        <div class="hero-visual" v-reveal>
          <div class="visual-card">
            <img
              src="/images/hero-banner.jpg"
              alt="Drugza Pharmaceutical Care Essentials"
              class="hero-img"
            />

            <!-- Floating Trust Badges -->
            <div class="floating-badge badge-top-right">
              <ShieldCheck :size="20" class="badge-icon success" />
              <div>
                <strong>{{ t('hero.edaCertified') }}</strong>
                <span>{{ t('hero.directSupply') }}</span>
              </div>
            </div>

            <div class="floating-badge badge-bottom-left">
              <Truck :size="20" class="badge-icon blue" />
              <div>
                <strong>{{ t('hero.expressColdChain') }}</strong>
                <span>{{ t('hero.temperatureControlled') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         PROMOTIONAL BANNERS CAROUSEL (Displayed directly beneath Hero Section)
         ========================================================================= -->
    <section class="banners-carousel-section">
      <div class="drugza-container banner-container-center">
        <!-- Loading skeleton for the promotional banner -->
        <div v-if="isLoading" class="banner-skeleton-wrap">
          <Skeleton class="banner-skeleton" aspect-ratio="16 / 9" radius="24px" />
        </div>

        <!-- Banner Carousel if banners available -->
        <div
          v-else-if="banners && banners.length > 0"
          class="banner-slider-card"
          @mouseenter="isHoveringBanner = true"
          @mouseleave="isHoveringBanner = false"
          @touchstart.passive="handleTouchStart"
          @touchend.passive="handleTouchEnd"
        >
          <!-- Banner Slide -->
          <div
            class="banner-slide"
            @click="handleBannerClick(banners[currentBannerIdx])"
          >
            <!-- Ambient blurred backdrop for seamless color matching & framing -->
            <div
              class="banner-ambient-bg"
              :style="{ backgroundImage: `url(${banners[currentBannerIdx]?.imageName})` }"
              aria-hidden="true"
            ></div>
            <div class="banner-tint-overlay"></div>

            <img
              :src="banners[currentBannerIdx]?.imageName"
              :alt="`Drugza Promotion ${currentBannerIdx + 1}`"
              class="banner-slide-img"
              loading="lazy"
              @error="onImageError($event, 'banner')"
            />
          </div>

          <!-- Left / Right Nav Buttons -->
          <button
            v-if="banners.length > 1"
            type="button"
            class="slider-nav-btn prev-btn"
            @click.stop="isRtl ? nextBanner() : prevBanner()"
            :aria-label="t('home.prevBanner')"
          >
            <component :is="isRtl ? ChevronRight : ChevronLeft" :size="20" />
          </button>

          <button
            v-if="banners.length > 1"
            type="button"
            class="slider-nav-btn next-btn"
            @click.stop="isRtl ? prevBanner() : nextBanner()"
            :aria-label="t('home.nextBanner')"
          >
            <component :is="isRtl ? ChevronLeft : ChevronRight" :size="20" />
          </button>

          <!-- Indicator Dots -->
          <div v-if="banners.length > 1" class="slider-dots-bar">
            <button
              v-for="(_, bIdx) in banners"
              :key="bIdx"
              type="button"
              class="slider-dot"
              :class="{ active: currentBannerIdx === bIdx }"
              @click.stop="currentBannerIdx = bIdx"
              :aria-label="`Slide ${bIdx + 1}`"
            ></button>
          </div>
        </div>

        <!-- Placeholder container if banners is null or empty -->
        <SectionPlaceholder
          v-else
          variant="banner"
          :icon="Sparkles"
          :title="t('home.promoPlaceholderTitle')"
          :badge="t('home.promoPlaceholderBadge')"
          :subtitle="t('home.promoPlaceholderSubtitle')"
          :action-text="t('home.promoPlaceholderAction')"
          action-route="/catalog"
        />
      </div>
    </section>

    <!-- =========================================================================
         2. FLASH SALE SECTION
         ========================================================================= -->
    <section class="drugza-section flash-sale-section">
      <div class="drugza-container">
        <!-- Loading state -->
        <template v-if="isLoading">
          <Skeleton height="104px" radius="20px" class="section-skeleton-head" />
          <SkeletonGrid variant="product" :count="4" />
        </template>

        <!-- Render Flash Products when available -->
        <template v-else-if="flashSales && flashSales.length > 0">
          <div class="flash-header-card">
            <div class="flash-title-col">
              <div class="flash-pill">
                <span class="fire-icon">🔥</span>
                <span>{{ t('flashSale.badge') }}</span>
              </div>
              <h2 class="flash-title">{{ t('flashSale.title') }}</h2>
              <p class="flash-sub">{{ t('flashSale.subtitle') }}</p>
            </div>

            <!-- Countdown Clock -->
            <div class="countdown-clock-box">
              <span class="ends-in-label">{{ t('flashSale.countdownLabel') }}</span>
              <div class="countdown-digits">
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

              <router-link to="/flash-sales" class="home-flash-view-all">
                <span>{{ t('flashSale.viewAllDeals') }}</span>
                <ChevronLeft v-if="isRtl" :size="16" />
                <ChevronRight v-else :size="16" />
              </router-link>
            </div>
          </div>

          <!-- Flash Products Grid -->
          <div class="flash-products-grid" v-reveal.children>
            <ProductCard
              v-for="prod in flashSales"
              :key="prod.id"
              :product="prod"
              @view-details="handleViewProduct"
              @view-alternatives="handleViewAlternatives"
            />
          </div>
        </template>

        <!-- Placeholder container if flashSales is null or empty -->
        <SectionPlaceholder
          v-else
          :icon="Flame"
          :title="t('home.flashSalePlaceholderTitle')"
          :badge="t('home.flashSalePlaceholderBadge')"
          :subtitle="t('home.flashSalePlaceholderSubtitle')"
          :action-text="t('home.flashSalePlaceholderAction')"
          action-route="/catalog"
          min-height="220px"
        />
      </div>
    </section>

    <!-- =========================================================================
         3. ALL PROVIDERS / DISTRIBUTORS SECTION
         ========================================================================= -->
    <section id="suppliers-section" class="drugza-section suppliers-section">
      <div class="drugza-container">
        <div class="section-header-row">
          <div>
            <span class="sub-heading">{{ t('providers.badge') }}</span>
            <h2 class="section-title">{{ t('providers.title') }}</h2>
            <p class="section-desc">{{ t('providers.subtitle') }}</p>
          </div>
          <router-link to="/providers" class="view-all-link">
            <span>{{ t('providers.viewAllProviders') }}</span>
            <ArrowRight :size="16" class="arrow-icon" />
          </router-link>
        </div>

        <SkeletonGrid v-if="isLoading" variant="supplier" :count="5" />

        <div v-else-if="featuredSuppliers && featuredSuppliers.length > 0" class="suppliers-grid" v-reveal.children>
          <SupplierCard
            v-for="sup in featuredSuppliers"
            :key="sup.id"
            :supplier="sup"
            @select="handleSelectSupplier"
          />
        </div>

        <SectionPlaceholder
          v-else
          :icon="Building2"
          :title="t('providers.title')"
          :subtitle="t('providers.subtitle')"
          :action-text="t('home.providersPlaceholderAction')"
          action-route="/providers"
          min-height="220px"
        />
      </div>
    </section>

    <!-- =========================================================================
         4. SPECIAL OFFERS ONE SECTION (Hidden completely if no offer / maxDiscountRate <= 0)
         ========================================================================= -->
    <section
      v-if="specialOffersOne && specialOffersOne.length > 0 && maxDiscountRate > 0"
      class="drugza-section ads-banner-section"
    >
      <div class="drugza-container">
        <div
          class="promo-card"
          @click="handleBannerClick(specialOffersOne[0])"
        >
          <div class="promo-content">
            <Badge variant="discount" size="md">
              -{{ maxDiscountRate }}% {{ t('promoBanner.tag') }}
            </Badge>

            <h2 class="promo-heading">
              {{ promoHeadline }}
            </h2>

            <p class="promo-desc">
              {{ t('promoBanner.desc') }}
            </p>

            <Button
              variant="cta"
              size="lg"
              class="promo-cta-btn"
              @click.stop="handleBannerClick(specialOffersOne[0])"
            >
              <span>{{ t('promoBanner.cta') }}</span>
              <ArrowRight :size="18" class="arrow-icon" />
            </Button>
          </div>

          <div class="promo-visual">
            <img
              :src="specialOffersOne[0].imagePath"
              alt="Special Promotional Medical Offer"
              class="promo-img"
              loading="lazy"
              @error="onImageError($event, 'banner')"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         5. CATEGORIES SECTION (Clicking navigates to Category Providers Page!)
         ========================================================================= -->
    <section class="drugza-section categories-section">
      <div class="drugza-container">
        <div class="section-header-row">
          <div>
            <span class="sub-heading">{{ t('categories.badge') }}</span>
            <h2 class="section-title">{{ t('categories.title') }}</h2>
            <p class="section-desc">{{ t('categories.subtitle') }}</p>
          </div>
          <router-link to="/categories" class="view-all-link">
            <span>{{ t('categories.viewAllCategories') }}</span>
            <ArrowRight :size="16" class="arrow-icon" />
          </router-link>
        </div>

        <SkeletonGrid v-if="isLoading" variant="category" :count="6" />

        <div v-else-if="featuredCategories && featuredCategories.length > 0" class="categories-grid" v-reveal.children>
          <CategoryCard
            v-for="cat in featuredCategories"
            :key="cat.id"
            :category="cat"
            @select="handleSelectCategory"
          />
        </div>

        <SectionPlaceholder
          v-else
          :icon="Layers"
          :title="t('categories.title')"
          :subtitle="t('categories.subtitle')"
          :action-text="t('home.categoriesPlaceholderAction')"
          action-route="/categories"
          min-height="220px"
        />
      </div>
    </section>

    <!-- =========================================================================
         6. PRODUCTS SECTION
         ========================================================================= -->
    <section class="drugza-section featured-products-section">
      <div class="drugza-container">
        <div class="section-header-row">
          <div>
            <span class="sub-heading">{{ t('products.badge') }}</span>
            <h2 class="section-title">{{ t('products.title') }}</h2>
            <p class="section-desc">{{ t('products.subtitle') }}</p>
          </div>
          <router-link to="/catalog" class="view-all-link">
            <span>{{ t('products.viewAllProducts') }}</span>
            <ArrowRight :size="16" class="arrow-icon" />
          </router-link>
        </div>

        <SkeletonGrid v-if="isLoading" variant="product" :count="4" />

        <div v-else-if="products && products.length > 0" class="products-grid" v-reveal.children>
          <ProductCard
            v-for="prod in products"
            :key="prod.id"
            :product="prod"
            @view-details="handleViewProduct"
            @view-alternatives="handleViewAlternatives"
          />
        </div>

        <SectionPlaceholder
          v-else
          :icon="ShoppingBag"
          :title="t('home.featuredProductsTitle')"
          :subtitle="t('home.featuredProductsSub')"
          :action-text="t('home.browseCatalog')"
          action-route="/catalog"
          min-height="240px"
        />
      </div>
    </section>

    <!-- =========================================================================
         7. SPECIAL OFFERS TWO SECTION
         ========================================================================= -->
    <section class="drugza-section special-offers-two-section">
      <div class="drugza-container">
        <Skeleton v-if="isLoading" height="220px" radius="24px" />

        <div
          v-else-if="specialOffersTwo && specialOffersTwo.length > 0"
          class="promo-card promo-card-secondary"
          @click="handleBannerClick(specialOffersTwo[0])"
        >
          <div class="promo-content">
            <Badge variant="warning" size="md">
              {{ t('home.exclusivePartnerOffer') }}
            </Badge>

            <h2 class="promo-heading">
              {{ t('home.partnerOffersTitle') }}
            </h2>

            <p class="promo-desc">
              {{ t('home.partnerOffersDesc') }}
            </p>

            <Button
              variant="cta"
              size="lg"
              class="promo-cta-btn"
              @click.stop="handleBannerClick(specialOffersTwo[0])"
            >
              <span>{{ t('home.exploreOffers') }}</span>
              <ArrowRight :size="18" class="arrow-icon" />
            </Button>
          </div>

          <div class="promo-visual">
            <img
              :src="specialOffersTwo[0].imagePath"
              alt="Secondary Special Offer"
              class="promo-img"
              loading="lazy"
              @error="onImageError($event, 'banner')"
            />
          </div>
        </div>

        <SectionPlaceholder
          v-else
          variant="banner"
          :icon="Sparkles"
          :title="t('home.partnerSpecialOffers')"
          :badge="t('home.partnersBadge')"
          :subtitle="t('home.noPartnerOffersSub')"
          :action-text="t('home.browseAllProducts')"
          action-route="/catalog"
        />
      </div>
    </section>

    <!-- Product Detail Modal -->
    <ProductDetailModal
      :product="selectedProduct"
      :is-open="isProductModalOpen"
      @close="isProductModalOpen = false"
      @select-alternative="(alt) => selectedProduct = alt"
    />
  </div>
</template>

<style scoped>
.drugza-home-page {
  display: flex;
  flex-direction: column;
}

/* =========================================================================
   1. HERO SECTION
   ========================================================================= */
.hero-section {
  background:
    radial-gradient(900px 420px at 88% 0%, rgba(243, 206, 121, 0.16) 0%, transparent 62%),
    radial-gradient(700px 380px at 0% 100%, rgba(20, 184, 166, 0.08) 0%, transparent 60%),
    linear-gradient(180deg, #F0F4FA 0%, #F7F8FC 100%);
  padding: var(--space-2xl) 0 var(--space-3xl);
  border-bottom: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.hero-container {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  align-items: center;
  gap: var(--space-2xl);
}

@media (max-width: 1024px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

@media (max-width: 1024px) {
  .hero-content {
    align-items: center;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  padding: 4px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
  box-shadow: var(--shadow-xs);
  align-self: flex-start;
}

@media (max-width: 1024px) {
  .hero-badge {
    align-self: center;
  }
}

.pulse-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.2);
}

.hero-headline {
  font-size: 2.75rem;
  font-weight: var(--font-weight-extrabold);
  line-height: 1.2;
  color: var(--color-deep-blue);
  letter-spacing: -0.02em;
}

@media (max-width: 768px) {
  .hero-headline {
    font-size: 1.875rem;
  }
}

.hero-subtext {
  font-size: 1.0625rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-width: 540px;
}

@media (max-width: 640px) {
  .hero-subtext {
    font-size: 0.9375rem;
  }
}

/* Hero Search Box */
.hero-search-box {
  width: 100%;
  max-width: 560px;
  background: #FFFFFF;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 6px;
  padding-inline-start: 18px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  box-shadow: var(--shadow-sm);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.hero-search-box:hover {
  border-color: var(--color-primary-blue);
  box-shadow: var(--shadow-md);
}

.hero-search-box:focus-within {
  border-color: var(--color-primary-blue);
  box-shadow: 0 0 0 4px rgba(25, 118, 173, 0.12), var(--shadow-md);
}

.search-ico {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.hero-search-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.hero-search-input::placeholder {
  color: var(--color-text-tertiary);
}

.hero-search-btn {
  border-radius: var(--radius-pill);
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .hero-search-box {
    padding-inline-start: 14px;
  }

  .hero-search-btn {
    padding-inline: 14px;
  }
}

/* Hero Actions */
.hero-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .hero-actions {
    justify-content: center;
    width: 100%;
  }
}

/* Hero Visual */
.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
}

.visual-card {
  position: relative;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 4px solid #FFFFFF;
  background: #FFFFFF;
  max-width: 100%;
}

/* =========================================================================
   PROMOTIONAL BANNERS CAROUSEL (Centered & Full Responsive across all devices)
   ========================================================================= */
.banners-carousel-section {
  width: 100%;
  padding: var(--space-xl) 0 var(--space-2xl);
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-container-center {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.banner-skeleton-wrap {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
}

.banner-skeleton {
  width: 100%;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
}

.section-skeleton-head {
  width: 100%;
  margin-bottom: var(--space-xl);
}

.banner-slider-card {
  position: relative;
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: 0 16px 40px -12px rgba(18, 73, 107, 0.16), 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-border);
  background: var(--color-off-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.banner-slide {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #0b2b4d;
}

/* Ambient blurred backdrop for luxurious color-matching */
.banner-ambient-bg {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(28px) saturate(1.3) brightness(0.85);
  transform: scale(1.15);
  opacity: 0.55;
  z-index: 1;
  pointer-events: none;
}

.banner-tint-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(18, 73, 107, 0.08) 100%);
  z-index: 2;
  pointer-events: none;
}

/* Main banner image: perfectly centered, uncropped, sharp */
.banner-slide-img {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.banner-slider-card:hover .banner-slide-img {
  transform: scale(1.015);
}

/* Navigation Buttons */
.slider-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: var(--color-deep-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  transition: all 0.2s ease;
  opacity: 0;
}

.banner-slider-card:hover .slider-nav-btn {
  opacity: 1;
}

.slider-nav-btn:hover {
  background: #FFFFFF;
  transform: translateY(-50%) scale(1.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

[dir="rtl"] .prev-btn {
  left: auto;
  right: 20px;
}

[dir="rtl"] .next-btn {
  right: auto;
  left: 20px;
}

/* Dots Indicator */
.slider-dots-bar {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  background: rgba(11, 43, 77, 0.52);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
}

.slider-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s ease;
}

.slider-dot.active {
  width: 24px;
  border-radius: var(--radius-pill);
  background: #FFFFFF;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.85);
}

/* =========================================================================
   RESPONSIVE DEVICE BREAKPOINTS FOR PROMO BANNERS
   Computer / Desktop, Laptop, Tablet, Mobile (all variants)
   ========================================================================= */

/* Laptops & Standard Desktop (1024px - 1199px) */
@media (max-width: 1199px) {
  .banner-slider-card {
    max-width: 900px;
    border-radius: var(--radius-xl);
  }
}

/* Tablets (portrait & landscape, 768px - 1023px) */
@media (max-width: 1023px) {
  .banners-carousel-section {
    padding: var(--space-lg) 0 var(--space-xl);
  }

  .banner-slider-card {
    max-width: 720px;
    border-radius: var(--radius-xl);
  }

  /* Always show navigation buttons on touch-capable devices */
  .slider-nav-btn {
    opacity: 0.9;
    width: 38px;
    height: 38px;
  }

  .prev-btn {
    left: 12px;
  }

  .next-btn {
    right: 12px;
  }

  [dir="rtl"] .prev-btn {
    right: 12px;
    left: auto;
  }

  [dir="rtl"] .next-btn {
    left: 12px;
    right: auto;
  }

  .slider-dots-bar {
    bottom: 10px;
    padding: 4px 10px;
    gap: 6px;
  }

  .slider-dot {
    width: 7px;
    height: 7px;
  }

  .slider-dot.active {
    width: 18px;
  }
}

/* Mobile Devices (phones in landscape & large phones, 480px - 767px) */
@media (max-width: 767px) {
  .banners-carousel-section {
    padding: var(--space-md) 0 var(--space-lg);
  }

  .banner-slider-card {
    max-width: 100%;
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 24px -6px rgba(18, 73, 107, 0.12);
  }

  .slider-nav-btn {
    opacity: 0.88;
    width: 32px;
    height: 32px;
  }

  .prev-btn {
    left: 8px;
  }

  .next-btn {
    right: 8px;
  }

  [dir="rtl"] .prev-btn {
    right: 8px;
    left: auto;
  }

  [dir="rtl"] .next-btn {
    left: 8px;
    right: auto;
  }
}

/* Small Mobile Phones (< 480px down to 320px) */
@media (max-width: 480px) {
  .banners-carousel-section {
    padding: var(--space-sm) 0 var(--space-md);
  }

  .banner-slider-card {
    border-radius: var(--radius-md);
  }

  .slider-nav-btn {
    width: 28px;
    height: 28px;
    opacity: 0.85;
  }

  .prev-btn {
    left: 6px;
  }

  .next-btn {
    right: 6px;
  }

  [dir="rtl"] .prev-btn {
    right: 6px;
    left: auto;
  }

  [dir="rtl"] .next-btn {
    left: 6px;
    right: auto;
  }

  .slider-dots-bar {
    bottom: 8px;
    padding: 3px 8px;
    gap: 5px;
  }

  .slider-dot {
    width: 6px;
    height: 6px;
  }

  .slider-dot.active {
    width: 15px;
  }
}

.hero-img {
  width: 100%;
  max-width: 560px;
  height: auto;
  display: block;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.visual-card:hover .hero-img {
  transform: scale(1.02);
}

/* Floating Badges */
.floating-badge {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  padding: 8px 14px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-lg);
  animation: float 4s ease-in-out infinite;
}

.badge-top-right {
  top: 24px;
  right: -10px;
}

.badge-bottom-left {
  bottom: 24px;
  left: -10px;
  animation-delay: -2s;
}

[dir="rtl"] .badge-top-right {
  right: auto;
  left: -10px;
}

[dir="rtl"] .badge-bottom-left {
  left: auto;
  right: -10px;
}

@media (max-width: 640px) {
  .floating-badge {
    display: none;
  }
}

.badge-icon.success {
  color: var(--color-success);
}
.badge-icon.blue {
  color: var(--color-primary-blue);
}

.floating-badge strong {
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
  display: block;
}

.floating-badge span {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* =========================================================================
   2. FLASH SALE SECTION
   ========================================================================= */
.flash-sale-section {
  background-color: #FFFFFF;
  border-bottom: 1px solid var(--color-border);
}

.flash-header-card {
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.flash-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #EA580C;
  color: #FFFFFF;
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.flash-title {
  font-size: 1.5rem;
  color: #7C2D12;
}

.flash-sub {
  font-size: 0.8125rem;
  color: #9A3412;
  margin-top: 2px;
}

.countdown-clock-box {
  background: #FFFFFF;
  border: 1px solid #FED7AA;
  border-radius: var(--radius-lg);
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ends-in-label {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  color: #C2410C;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.countdown-digits {
  display: flex;
  align-items: center;
  gap: 6px;
}

.digit-box {
  background: #EA580C;
  color: #FFFFFF;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
}

.digit-box .num {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: var(--font-weight-extrabold);
  line-height: 1;
}

.digit-box .unit {
  font-size: 0.5625rem;
  text-transform: uppercase;
  opacity: 0.9;
}

.colon {
  font-weight: bold;
  color: #EA580C;
}

.home-flash-view-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #C2410C;
  color: #FFFFFF;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  margin-top: 4px;
}

.home-flash-view-all:hover {
  background: #9A3412;
  transform: translateY(-1px);
}

.flash-products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1100px) {
  .flash-products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 600px) {
  .flash-products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 360px) {
  .flash-products-grid {
    grid-template-columns: 1fr;
  }
}

/* =========================================================================
   3. SUPPLIERS SECTION
   ========================================================================= */
.suppliers-section {
  background-color: var(--color-off-white);
  border-bottom: 1px solid var(--color-border);
}

.suppliers-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-md);
}

@media (max-width: 1100px) {
  .suppliers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .suppliers-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .suppliers-grid {
    grid-template-columns: 1fr;
  }
}

/* =========================================================================
   4. ADS BANNERS SECTION
   ========================================================================= */
.ads-banner-section {
  padding-top: var(--space-lg);
  padding-bottom: var(--space-lg);
  background-color: #FFFFFF;
}

.promo-card {
  background: linear-gradient(135deg, #12496B 0%, #1976AD 100%);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  box-shadow: var(--shadow-xl);
  align-items: center;
}

@media (max-width: 960px) {
  .promo-card {
    grid-template-columns: 1fr;
  }
}

.promo-content {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  color: #FFFFFF;
}

@media (max-width: 640px) {
  .promo-content {
    padding: var(--space-lg);
  }
}

.promo-heading {
  font-size: 2rem;
  color: #FFFFFF;
  line-height: 1.2;
}

@media (max-width: 640px) {
  .promo-heading {
    font-size: 1.5rem;
  }
}

.promo-desc {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

.promo-cta-btn {
  align-self: flex-start;
  margin-top: var(--space-xs);
}

.promo-visual {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.promo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-height: 380px;
}

/* =========================================================================
   5. CATEGORIES SECTION
   ========================================================================= */
.categories-section {
  background-color: var(--color-off-white);
  border-bottom: 1px solid var(--color-border);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-md);
}

@media (max-width: 1024px) {
  .categories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 360px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

/* =========================================================================
   6. PRODUCTS SECTION
   ========================================================================= */
.featured-products-section {
  background-color: #FFFFFF;
  border-bottom: 1px solid var(--color-border);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }
}

@media (max-width: 840px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

@media (max-width: 360px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}

/* Common Section Headers */
.section-header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.sub-heading {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary-blue);
  display: block;
  margin-bottom: 4px;
}

.section-title {
  font-size: 1.875rem;
  color: var(--color-deep-blue);
}

@media (max-width: 640px) {
  .section-title {
    font-size: 1.5rem;
  }
}

.section-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  max-width: 580px;
  margin-top: 4px;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
  white-space: nowrap;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* =========================================================================
   SPECIAL OFFERS TWO & BRANDS STYLES
   ========================================================================= */
.special-offers-two-section {
  padding: var(--space-2xl) 0;
  background-color: var(--color-white);
}

.promo-card-secondary {
  background: linear-gradient(135deg, #07192C 0%, #0B2B4D 50%, #0F3A66 100%);
}
</style>
