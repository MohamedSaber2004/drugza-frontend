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
  Flame,
  Award
} from 'lucide-vue-next';
import type { Product, Category, Supplier } from '@/types';
import {
  homeService,
  type HomeBanner,
  type HomeBrand,
  type HomeSpecialOffer
} from '@/services/home.service';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import SectionPlaceholder from '@/components/ui/SectionPlaceholder.vue';
import ProductCard from '@/components/domain/ProductCard.vue';
import CategoryCard from '@/components/domain/CategoryCard.vue';
import SupplierCard from '@/components/domain/SupplierCard.vue';
import ProductDetailModal from '@/components/domain/ProductDetailModal.vue';
import { useI18n } from '@/composables/useI18n';
import { useAuth } from '@/composables/useAuth';
import { onImageError } from '@/utils/placeholders';

const router = useRouter();
const { t, locale, isRtl } = useI18n();
const { user } = useAuth();

const emit = defineEmits<{
  (e: 'open-search'): void;
}>();

// Unified Home State loaded strictly from /api/Home/GetHomeProduct
const isLoading = ref(true);
const categories = ref<Category[] | null>(null);
const suppliers = ref<Supplier[] | null>(null);
const products = ref<Product[] | null>(null);
const flashSales = ref<Product[] | null>(null);
const banners = ref<HomeBanner[] | null>(null);
const brands = ref<HomeBrand[] | null>(null);
const specialOffersOne = ref<HomeSpecialOffer[] | null>(null);
const specialOffersTwo = ref<HomeSpecialOffer[] | null>(null);
const businessName = computed(() => user.value?.fullName || user.value?.businessName || null);

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
    return locale.value === 'ar'
      ? `خصومات تصل إلى ${maxDiscountRate.value}% على الأدوية والمستلزمات الحيوية`
      : `Up to ${maxDiscountRate.value}% OFF on Vital Prescriptions & Supplements`;
  }
  return '';
});

// Single unified onMounted loading all home sections from GET /api/Home/GetHomeProduct
onMounted(async () => {
  isLoading.value = true;
  try {
    const data = await homeService.getHomeProduct();
    banners.value = data.banners;
    categories.value = data.categories;
    products.value = data.products;
    suppliers.value = data.providers;
    brands.value = data.brands;
    specialOffersOne.value = data.specialOffersone;
    specialOffersTwo.value = data.specialOfferstwo;
    flashSales.value = data.flashSales;
    businessName.value = data.businessName || null;
  } catch (err) {
    console.warn('Error loading home data via getHomeProduct:', err);
    banners.value = null;
    categories.value = null;
    products.value = null;
    suppliers.value = null;
    brands.value = null;
    specialOffersOne.value = null;
    specialOffersTwo.value = null;
    flashSales.value = null;
  } finally {
    isLoading.value = false;
  }
});

function handleViewProduct(prod: Product) {
  selectedProduct.value = prod;
  isProductModalOpen.value = true;
}

// When clicking a category -> navigate to dedicated Category Providers page
function handleSelectCategory(cat: Category) {
  router.push(`/categories/${cat.id}`);
}

// When clicking a supplier -> navigate to dedicated Provider Products page
function handleSelectSupplier(sup: Supplier) {
  router.push(`/providers/${sup.id}`);
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
        <div class="hero-content">
          <!-- Trust Pill / Personalized Welcome -->
          <div class="hero-badge">
            <span class="pulse-icon"></span>
            <span v-if="businessName">{{ locale === 'ar' ? `مرحباً بك: ${businessName}` : `Welcome: ${businessName}` }}</span>
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
          <div class="hero-search-box" @click="emit('open-search')">
            <div class="search-input-mock">
              <Search :size="20" class="search-ico" />
              <span class="search-text">{{ t('hero.searchPlaceholder') }}</span>
            </div>
            <Button variant="cta" size="md" class="hero-search-btn">
              <span>{{ t('hero.searchBtn') }}</span>
              <ArrowRight :size="16" class="arrow-icon" />
            </Button>
          </div>

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
        <div class="hero-visual">
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
        <!-- Banner Carousel if banners available -->
        <div
          v-if="banners && banners.length > 0"
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
            :aria-label="locale === 'ar' ? 'السابق' : 'Previous banner'"
          >
            <component :is="isRtl ? ChevronRight : ChevronLeft" :size="20" />
          </button>

          <button
            v-if="banners.length > 1"
            type="button"
            class="slider-nav-btn next-btn"
            @click.stop="isRtl ? prevBanner() : nextBanner()"
            :aria-label="locale === 'ar' ? 'التالي' : 'Next banner'"
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
          :title="locale === 'ar' ? 'العروض الترويجية الحصرية' : 'Exclusive Promotional Campaigns'"
          :badge="locale === 'ar' ? 'عروض قادمة' : 'Coming Soon'"
          :subtitle="locale === 'ar' ? 'لا توجد بنرات ترويجية نشطة حالياً. ترقبوا أحدث الخصومات قريباً!' : 'No promotional banners currently active. Check back soon for exclusive deals!'"
          action-text="تصفح الكتالوج"
          action-route="/catalog"
        />
      </div>
    </section>

    <!-- =========================================================================
         2. FLASH SALE SECTION
         ========================================================================= -->
    <section class="drugza-section flash-sale-section">
      <div class="drugza-container">
        <!-- Render Flash Products when available -->
        <template v-if="flashSales && flashSales.length > 0">
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
            </div>
          </div>

          <!-- Flash Products Grid -->
          <div class="flash-products-grid">
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
          :title="locale === 'ar' ? 'عروض الفلاش سيل الأسبوعية' : 'Flash Sale Deals'"
          :badge="locale === 'ar' ? 'عروض فلاش سيل' : 'Flash Sale'"
          :subtitle="locale === 'ar' ? 'لا توجد عروض تخفيض فوري نشطة في الوقت الحالي. انتظروا عروضنا الاستثنائية القادمة قريباً!' : 'No active flash sales right now. Limited-time discounts will be announced shortly!'"
          action-text="تصفح جميع المنتجات"
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

        <div v-if="suppliers && suppliers.length > 0" class="suppliers-grid">
          <SupplierCard
            v-for="sup in suppliers"
            :key="sup.id"
            :supplier="sup"
            @select="handleSelectSupplier"
          />
        </div>

        <SectionPlaceholder
          v-else
          :icon="Building2"
          :title="locale === 'ar' ? 'الموزعون المعتمدون' : 'Authorized Distributors'"
          :subtitle="locale === 'ar' ? 'لا يوجد موزعون متاحون حالياً في هذا القسم' : 'No distributors available at the moment'"
          action-text="عرض كافة الموزعين"
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

        <div v-if="categories && categories.length > 0" class="categories-grid">
          <CategoryCard
            v-for="cat in categories"
            :key="cat.id"
            :category="cat"
            @select="handleSelectCategory"
          />
        </div>

        <SectionPlaceholder
          v-else
          :icon="Layers"
          :title="locale === 'ar' ? 'التصنيفات الدوائية' : 'Medicine Categories'"
          :subtitle="locale === 'ar' ? 'لا توجد تصنيفات متاحة حالياً' : 'No categories available at the moment'"
          action-text="عرض كافة التصنيفات"
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

        <div v-if="products && products.length > 0" class="products-grid">
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
          :title="locale === 'ar' ? 'المنتجات الدوائية المميزة' : 'Featured Pharmaceutical Products'"
          :subtitle="locale === 'ar' ? 'لا توجد منتجات متوفرة حالياً في هذا القسم' : 'No products available at the moment'"
          action-text="استعراض الكتالوج"
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
        <div
          v-if="specialOffersTwo && specialOffersTwo.length > 0"
          class="promo-card promo-card-secondary"
          @click="handleBannerClick(specialOffersTwo[0])"
        >
          <div class="promo-content">
            <Badge variant="warning" size="md">
              {{ locale === 'ar' ? 'عرض إضافي' : 'Exclusive Partner Offer' }}
            </Badge>

            <h2 class="promo-heading">
              {{ locale === 'ar' ? 'خصومات وعروض شركاء دراجزا' : 'Drugza Partner Offers & Discounts' }}
            </h2>

            <p class="promo-desc">
              {{ locale === 'ar' ? 'عروض حصرية مقدمة من كبرى شركات التوزيع الدوائي والمستحضرات الطبية.' : 'Exclusive offers from verified pharmaceutical distributors and medical suppliers.' }}
            </p>

            <Button
              variant="cta"
              size="lg"
              class="promo-cta-btn"
              @click.stop="handleBannerClick(specialOffersTwo[0])"
            >
              <span>{{ locale === 'ar' ? 'تصفح العروض' : 'Explore Offers' }}</span>
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
          :title="locale === 'ar' ? 'عروض الشركاء المميزة' : 'Partner Special Offers'"
          :badge="locale === 'ar' ? 'قسم الشركاء' : 'Partners'"
          :subtitle="locale === 'ar' ? 'لا توجد عروض شركاء إضافية حالياً، سيتم إشعاركم فور توفرها.' : 'No secondary special offers active right now. Check back soon!'"
          action-text="تصفح جميع المنتجات"
          action-route="/catalog"
        />
      </div>
    </section>

    <!-- =========================================================================
         8. BRANDS / PHARMACY PARTNERS SECTION
         ========================================================================= -->
    <section class="drugza-section brands-section">
      <div class="drugza-container">
        <div class="section-header-row">
          <div>
            <span class="sub-heading">{{ locale === 'ar' ? 'الشركاء والعلامات التجارية' : 'Brands & Partners' }}</span>
            <h2 class="section-title">{{ locale === 'ar' ? 'كبرى الصيدليات والكيانات المعتمدة' : 'Trusted Pharmacy Brands' }}</h2>
            <p class="section-desc">
              {{ locale === 'ar' ? 'نخبة من كبرى الكيانات والصيدليات الرائدة المشاركة على منصة دراجزا' : 'Top verified pharmacy brands collaborating on Drugza marketplace' }}
            </p>
          </div>
          <router-link to="/catalog" class="view-all-link">
            <span>{{ locale === 'ar' ? 'عرض الكتالوج' : 'View Catalog' }}</span>
            <ArrowRight :size="16" class="arrow-icon" />
          </router-link>
        </div>

        <div v-if="brands && brands.length > 0" class="brands-grid">
          <div
            v-for="brand in brands"
            :key="brand.id"
            class="brand-card"
            @click="router.push(`/catalog?search=${encodeURIComponent(brand.name)}`)"
          >
            <div class="brand-logo-wrap">
              <img
                :src="brand.imagePath"
                :alt="brand.name"
                class="brand-logo"
                loading="lazy"
                @error="onImageError($event, 'category')"
              />
            </div>
            <div class="brand-info">
              <h4 class="brand-name">
                {{ locale === 'ar' && brand.arabicName ? brand.arabicName : brand.name }}
              </h4>
              <p
                v-if="locale === 'ar' && brand.arabicName && brand.arabicName !== brand.name"
                class="brand-en-name"
              >
                {{ brand.name }}
              </p>
              <span v-if="brand.isPopular" class="popular-tag">
                ⭐ {{ locale === 'ar' ? 'شائع' : 'Popular' }}
              </span>
            </div>
          </div>
        </div>

        <SectionPlaceholder
          v-else
          :icon="Award"
          :title="locale === 'ar' ? 'العلامات التجارية والشركاء' : 'Brands & Partners'"
          :subtitle="locale === 'ar' ? 'لا توجد علامات تجارية مدرجة حالياً' : 'No brand partners listed currently'"
          action-text="تصفح الكتالوج"
          action-route="/catalog"
          min-height="200px"
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
  background: linear-gradient(180deg, #F0F4FA 0%, #F7F8FC 100%);
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
  max-width: 540px;
  background: #FFFFFF;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 6px 8px 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.hero-search-box:hover {
  border-color: var(--color-primary-blue);
  box-shadow: var(--shadow-md);
}

.search-input-mock {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  overflow: hidden;
}

.search-ico {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.search-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-search-btn {
  border-radius: var(--radius-pill);
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .hero-search-box {
    padding: 6px 8px;
  }
  .hero-search-btn span {
    display: none;
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

.brands-section {
  background-color: #F8FAFC;
  padding: var(--space-3xl) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.brand-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-smooth);
  box-shadow: var(--shadow-xs);
}

.brand-card:hover {
  border-color: var(--color-primary-teal);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.brand-logo-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 6px;
  overflow: hidden;
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.brand-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-en-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popular-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #D97706;
  background: #FEF3C7;
  padding: 2px 8px;
  border-radius: 9999px;
  width: fit-content;
}
</style>
