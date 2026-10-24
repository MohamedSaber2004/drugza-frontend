<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Search,
  ShoppingBag,
  User,
  Heart,
  ChevronDown,
  LogOut,
  Package,
  Menu,
  X,
  MapPin,
  Layers,
  Flame,
  Building2,
  Home,
  Globe
} from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';
import { useCart } from '@/composables/useCart';
import { useFavorites } from '@/composables/useFavorites';
import { useI18n } from '@/composables/useI18n';

const emit = defineEmits<{
  (e: 'open-search'): void;
}>();

const router = useRouter();
const { t, locale, toggleLocale, isRtl } = useI18n();
const { user, isAuthenticated, logout, fetchUserProfile } = useAuth();
const { totalItemsCount, openCartDrawer } = useCart();
const { favoritesCount, fetchFavorites } = useFavorites();

const isUserMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);
const isScrolled = ref(false);
let scrollRaf = 0;

function handleHeaderScroll() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    isScrolled.value = window.scrollY > 12;
    scrollRaf = 0;
  });
}

onMounted(() => {
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();
  if (isAuthenticated.value) {
    if (user.value?.id) {
      fetchUserProfile(user.value.id).catch(() => {});
    }
    fetchFavorites().catch(() => {});
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleHeaderScroll);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
});

watch(isAuthenticated, (authed) => {
  if (authed) {
    fetchFavorites(true).catch(() => {});
  }
});

const displayName = computed(() => {
  if (!user.value) return '';
  const full = user.value.fullName?.trim();
  const userN = user.value.userName?.trim();
  const bus = user.value.businessName?.trim();
  return full || userN || bus || (locale.value === 'ar' ? 'صيدلي معتمد' : 'Pharmacist');
});

const pharmacyName = computed(() => {
  if (!user.value) return '';
  const bus = user.value.businessName?.trim();
  const dName = displayName.value.trim().toLowerCase();

  // If businessName is present and differs from the user's name, show it
  if (bus && bus.toLowerCase() !== dName) {
    return bus;
  }
  // Otherwise, show the role text without duplicating the name
  const role = user.value.role;
  if (role) {
    return locale.value === 'ar' && (role === 'Pharmacy' || role.toLowerCase() === 'pharmacy')
      ? 'صيدلية مرخصة'
      : role;
  }
  return locale.value === 'ar' ? 'صيدلية مرخصة' : 'Licensed Pharmacy';
});

const avatarInitial = computed(() => {
  if (!user.value) return 'P';
  const name = user.value.fullName || user.value.businessName || user.value.userName || 'P';
  return name.trim().charAt(0).toUpperCase() || 'P';
});

function navigateTo(path: string) {
  isMobileMenuOpen.value = false;
  isUserMenuOpen.value = false;
  router.push(path);
}

function handleLogout() {
  isUserMenuOpen.value = false;
  isMobileMenuOpen.value = false;
  logout();
  router.push('/');
}

watch(isMobileMenuOpen, (open) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : '';
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <header class="drugza-main-header" :class="{ 'is-scrolled': isScrolled }">
    <!-- Top Bar: Logo, Global Search, and Actions -->
    <div class="drugza-container header-inner">
      <!-- Logo -->
      <router-link to="/" class="logo-link">
        <DrugzaLogo size="md" :show-tagline="true" />
      </router-link>

      <!-- Desktop Search Bar Trigger (Compact & Sleek) -->
      <div class="search-trigger-box" @click="emit('open-search')">
        <Search :size="16" class="search-icon" />
        <span class="search-placeholder">
          {{ t('nav.searchPlaceholder') }}
        </span>
        <kbd class="search-kbd">Ctrl K</kbd>
      </div>

      <!-- Header Actions -->
      <div class="header-actions">
        <!-- Tablet/Mobile Compact Search Trigger Icon Button -->
        <button
          type="button"
          class="action-icon-btn mobile-search-icon-btn"
          :title="locale === 'ar' ? 'بحث' : 'Search'"
          @click="emit('open-search')"
        >
          <Search :size="20" />
          <span class="icon-label">{{ locale === 'ar' ? 'بحث' : 'Search' }}</span>
        </button>

        <!-- Language Switcher Button -->
        <button
          type="button"
          class="action-icon-btn lang-btn"
          :title="locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'"
          @click="toggleLocale"
        >
          <Globe :size="20" class="lang-icon" />
          <span class="icon-label">{{ locale === 'ar' ? 'English' : 'العربية' }}</span>
        </button>

        <!-- Wishlist / Favorites Dedicated Page Link -->
        <router-link to="/favorites" class="action-icon-btn" :title="t('nav.favorites')">
          <div class="cart-icon-wrap">
            <Heart :size="20" />
            <span v-if="favoritesCount > 0" class="cart-badge fav-badge">
              {{ favoritesCount }}
            </span>
          </div>
          <span class="icon-label">{{ t('nav.favorites') }}</span>
        </router-link>

        <!-- Cart Button with Badge -->
        <button
          type="button"
          class="action-icon-btn cart-btn"
          :title="t('nav.cart')"
          @click="openCartDrawer"
        >
          <div class="cart-icon-wrap">
            <ShoppingBag :size="20" />
            <span v-if="totalItemsCount > 0" class="cart-badge">
              {{ totalItemsCount }}
            </span>
          </div>
          <span class="icon-label">{{ t('nav.cart') }}</span>
        </button>

        <div class="divider"></div>

        <!-- Auth State: User Menu with Profile & Addresses, or Login Buttons -->
        <div v-if="isAuthenticated && user" class="user-menu-wrapper">
          <!-- Backdrop to close dropdown on click outside -->
          <div
            v-if="isUserMenuOpen"
            class="user-menu-backdrop"
            @click="isUserMenuOpen = false"
          ></div>

          <button
            type="button"
            class="user-profile-btn"
            :class="{ 'is-active': isUserMenuOpen }"
            @click="isUserMenuOpen = !isUserMenuOpen"
            :aria-expanded="isUserMenuOpen"
          >
            <div class="user-avatar">
              <img
                v-if="user.profileImage"
                :src="user.profileImage"
                :alt="displayName"
                class="avatar-img"
              />
              <span v-else>{{ avatarInitial }}</span>
            </div>
            <div class="user-info-text">
              <span class="user-name" :title="displayName">{{ displayName }}</span>
              <span class="pharmacy-name" :title="pharmacyName">{{ pharmacyName }}</span>
            </div>
            <ChevronDown :size="15" class="chevron-icon" :class="{ 'rotate-180': isUserMenuOpen }" />
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isUserMenuOpen" class="user-dropdown">
            <div class="dropdown-header">
              <div class="dropdown-avatar-row">
                <div class="user-avatar-sm">
                  <img v-if="user.profileImage" :src="user.profileImage" :alt="displayName" class="avatar-img" />
                  <span v-else>{{ avatarInitial }}</span>
                </div>
                <div class="dropdown-user-meta">
                  <strong class="meta-name" :title="displayName">{{ displayName }}</strong>
                  <span v-if="pharmacyName && pharmacyName !== displayName" class="dropdown-business" :title="pharmacyName">{{ pharmacyName }}</span>
                  <span class="dropdown-email" :title="user.email || ''">{{ user.email || (locale === 'ar' ? 'البريد غير متوفر' : 'No email') }}</span>
                </div>
              </div>
            </div>

            <div class="dropdown-links">
              <!-- Profile Page -->
              <button class="menu-item" @click="navigateTo('/profile')">
                <User :size="16" />
                <span>{{ t('nav.profile') }}</span>
              </button>

              <!-- Delivery Addresses Page -->
              <button class="menu-item" @click="navigateTo('/addresses')">
                <MapPin :size="16" />
                <span>{{ t('nav.addresses') }}</span>
              </button>

              <!-- Orders Page -->
              <button class="menu-item" @click="navigateTo('/orders')">
                <Package :size="16" />
                <span>{{ t('nav.orders') }}</span>
              </button>

              <!-- Favorites Page -->
              <button class="menu-item" @click="navigateTo('/favorites')">
                <Heart :size="16" />
                <span>{{ t('nav.favorites') }}</span>
              </button>

              <div class="dropdown-divider"></div>

              <button class="menu-item logout" @click="handleLogout">
                <LogOut :size="16" />
                <span>{{ t('nav.logout') }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="auth-buttons-group">
          <Button variant="ghost" size="sm" @click="navigateTo('/auth/login')">
            {{ t('nav.signIn') }}
          </Button>
          <Button variant="primary" size="sm" @click="navigateTo('/auth/register')">
            {{ t('nav.registerPharmacy') }}
          </Button>
        </div>

        <!-- Mobile Language Quick Switcher -->
        <button
          type="button"
          class="mobile-lang-quick-btn"
          @click="toggleLocale"
          :title="locale === 'ar' ? 'English' : 'عربي'"
        >
          <Globe :size="16" />
          <span>{{ locale === 'ar' ? 'EN' : 'عربي' }}</span>
        </button>

        <!-- Mobile Menu Toggle Button (Hamburger / Close) -->
        <button
          type="button"
          class="mobile-toggle-btn"
          :class="{ 'is-open': isMobileMenuOpen }"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle Navigation Menu"
        >
          <X v-if="isMobileMenuOpen" :size="24" />
          <Menu v-else :size="24" />
        </button>
      </div>
    </div>

    <!-- Navigation Links Bar (Desktop >= 1024px: Home, Categories, Flash Sales, Providers, Products) -->
    <div class="header-nav-strip">
      <div class="drugza-container nav-strip-inner">
        <nav class="main-nav-links">
          <router-link to="/" class="nav-link-item" exact-active-class="is-active">
            <Home :size="16" />
            <span>{{ t('nav.home') }}</span>
          </router-link>

          <router-link to="/categories" class="nav-link-item" active-class="is-active">
            <Layers :size="16" />
            <span>{{ t('nav.categories') }}</span>
          </router-link>

          <router-link to="/flash-sales" class="nav-link-item flash-nav-item" active-class="is-active">
            <Flame :size="16" class="fire-icon" />
            <span>{{ t('nav.flashSales') }}</span>
            <span class="flash-tag">{{ t('nav.hotDeals') }}</span>
          </router-link>

          <router-link to="/providers" class="nav-link-item" active-class="is-active">
            <Building2 :size="16" />
            <span>{{ t('nav.distributors') }}</span>
          </router-link>

          <router-link to="/catalog" class="nav-link-item" active-class="is-active">
            <Package :size="16" />
            <span>{{ t('nav.allProducts') }}</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Mobile Navigation Sidebar Drawer (App-Style Sidebar) -->
    <Teleport to="body">
      <div
        v-if="isMobileMenuOpen"
        class="mobile-nav-backdrop"
        @click="isMobileMenuOpen = false"
      ></div>

      <aside
        v-if="isMobileMenuOpen"
        class="mobile-nav-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <!-- Sidebar Top Header -->
        <div class="sidebar-header">
          <router-link to="/" class="sidebar-logo-link" @click="isMobileMenuOpen = false">
            <DrugzaLogo size="sm" :show-tagline="false" />
          </router-link>
          <button
            type="button"
            class="sidebar-close-btn"
            @click="isMobileMenuOpen = false"
            :aria-label="locale === 'ar' ? 'إغلاق القائمة' : 'Close menu'"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="sidebar-scrollable-body">
          <!-- User / Guest Profile Card -->
          <div v-if="isAuthenticated && user" class="sidebar-user-card">
            <div class="sidebar-user-avatar">
              {{ avatarInitial }}
            </div>
            <div class="sidebar-user-details">
              <strong class="sidebar-user-name">{{ displayName }}</strong>
              <span class="sidebar-business-tag">{{ pharmacyName }}</span>
              <span class="sidebar-user-email">{{ user.email }}</span>
            </div>
          </div>
          <div v-else class="sidebar-guest-card">
            <div class="guest-icon-circle">
              <User :size="20" />
            </div>
            <div class="guest-info">
              <strong>{{ locale === 'ar' ? 'بوابة الصيادلة والمستودعات' : 'Pharmacist & Supplier Portal' }}</strong>
              <span>{{ locale === 'ar' ? 'سجل دخولك لتصفح الأسعار والشحن المباشر' : 'Sign in to access B2B pricing & express shipping' }}</span>
            </div>
          </div>

          <!-- Search Trigger in Mobile Drawer -->
          <div class="mobile-search-btn" @click="emit('open-search'); isMobileMenuOpen = false">
            <Search :size="18" class="search-ico" />
            <span class="search-placeholder">{{ t('nav.searchPlaceholder') }}</span>
          </div>

          <!-- Section: Main Menu -->
          <div class="sidebar-nav-group">
            <span class="group-title">{{ locale === 'ar' ? 'التصفح والتسوق' : 'Marketplace' }}</span>
            <div class="mobile-nav-links">
              <button
                class="mobile-nav-item"
                :class="{ 'is-active': router.currentRoute.value.path === '/' }"
                @click="navigateTo('/')"
              >
                <Home :size="18" />
                <span>{{ t('nav.home') }}</span>
              </button>

              <button
                class="mobile-nav-item"
                :class="{ 'is-active': router.currentRoute.value.path === '/categories' }"
                @click="navigateTo('/categories')"
              >
                <Layers :size="18" />
                <span>{{ t('nav.categories') }}</span>
              </button>

              <button
                class="mobile-nav-item highlight-flash"
                :class="{ 'is-active': router.currentRoute.value.path === '/flash-sales' }"
                @click="navigateTo('/flash-sales')"
              >
                <Flame :size="18" />
                <span>🔥 {{ t('nav.flashSales') }}</span>
              </button>

              <button
                class="mobile-nav-item"
                :class="{ 'is-active': router.currentRoute.value.path === '/providers' }"
                @click="navigateTo('/providers')"
              >
                <Building2 :size="18" />
                <span>{{ t('nav.distributors') }}</span>
              </button>

              <button
                class="mobile-nav-item"
                :class="{ 'is-active': router.currentRoute.value.path === '/catalog' }"
                @click="navigateTo('/catalog')"
              >
                <Package :size="18" />
                <span>{{ t('nav.allProducts') }}</span>
              </button>
            </div>
          </div>

          <!-- Section: Account & Management -->
          <div class="sidebar-nav-group">
            <span class="group-title">{{ locale === 'ar' ? 'حساب الصيدلية والإدارة' : 'Pharmacy Account' }}</span>
            <div class="mobile-nav-links">
              <button
                class="mobile-nav-item"
                :class="{ 'is-active': router.currentRoute.value.path === '/favorites' }"
                @click="navigateTo('/favorites')"
              >
                <Heart :size="18" />
                <span>{{ t('nav.favorites') }}</span>
              </button>

              <button
                class="mobile-nav-item"
                :class="{ 'is-active': router.currentRoute.value.path === '/orders' }"
                @click="navigateTo('/orders')"
              >
                <Package :size="18" />
                <span>{{ t('nav.orders') }}</span>
              </button>

              <template v-if="isAuthenticated">
                <button
                  class="mobile-nav-item"
                  :class="{ 'is-active': router.currentRoute.value.path === '/profile' }"
                  @click="navigateTo('/profile')"
                >
                  <User :size="18" />
                  <span>{{ t('nav.profile') }}</span>
                </button>
                <button
                  class="mobile-nav-item"
                  :class="{ 'is-active': router.currentRoute.value.path === '/addresses' }"
                  @click="navigateTo('/addresses')"
                >
                  <MapPin :size="18" />
                  <span>{{ t('nav.addresses') }}</span>
                </button>
              </template>
            </div>
          </div>

          <!-- Language Switch in Mobile Menu -->
          <button type="button" class="mobile-lang-drawer-btn" @click="toggleLocale">
            <Globe :size="18" />
            <span>{{ locale === 'ar' ? 'English (Switch to English)' : 'اللغة العربية (التحويل للعربية)' }}</span>
          </button>
        </div>

        <!-- Sticky Bottom Auth Section -->
        <div class="sidebar-footer">
          <template v-if="isAuthenticated && user">
            <Button variant="danger" size="md" block @click="handleLogout">
              <LogOut :size="16" />
              <span>{{ t('nav.logout') }}</span>
            </Button>
          </template>
          <template v-else>
            <Button variant="primary" size="md" block @click="navigateTo('/auth/login')">
              {{ t('nav.signIn') }}
            </Button>
            <Button variant="secondary" size="md" block @click="navigateTo('/auth/register')">
              {{ t('nav.registerPharmacy') }}
            </Button>
          </template>
        </div>
      </aside>
    </Teleport>
  </header>
</template>

<style scoped>
.drugza-main-header {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 0 rgba(18, 73, 107, 0.04), 0 6px 20px -12px rgba(18, 73, 107, 0.12);
  transition:
    background-color var(--dur-base) var(--ease-smooth),
    box-shadow var(--dur-base) var(--ease-smooth);
}

.drugza-main-header.is-scrolled {
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 1px 0 rgba(18, 73, 107, 0.05),
    0 10px 30px -10px rgba(18, 73, 107, 0.22);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  height: 72px;
}

.logo-link {
  text-decoration: none;
  flex-shrink: 0;
}

/* Search Trigger Box */
.search-trigger-box {
  flex-grow: 1;
  max-width: 520px;
  height: 44px;
  background-color: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.search-trigger-box:hover {
  background-color: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: 0 2px 8px rgba(25, 118, 173, 0.1);
}

.search-icon {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.search-placeholder {
  flex-grow: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-kbd {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

/* Actions Group */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.action-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
  background: transparent;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.action-icon-btn:hover {
  color: var(--color-primary-blue);
  background: var(--color-off-white);
}

.icon-label {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-medium);
  margin-top: 2px;
}

/* Notifications */
.notification-wrapper {
  position: relative;
}

.notif-icon-wrap {
  position: relative;
  display: flex;
}

.notif-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: var(--color-error);
  color: #FFFFFF;
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  width: 17px;
  height: 17px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: -60px;
  width: 340px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 210;
  overflow: hidden;
  animation: fadeIn 0.15s ease-out;
}

.notif-header {
  padding: 12px 16px;
  background: var(--color-pale-blue);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notif-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-title-row strong {
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
}

.unread-pill {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  background: var(--color-primary-blue);
  color: #FFFFFF;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
}

.mark-all-read-btn {
  background: none;
  border: none;
  font-size: 0.6875rem;
  color: var(--color-primary-blue);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.mark-all-read-btn:hover {
  text-decoration: underline;
}

.notif-list {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-smooth);
}

.notif-item:hover {
  background: var(--color-surface-hover);
}

.notif-item.is-unread {
  background: #F7FBFE;
}

.notif-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.notif-type-dot.order {
  background-color: var(--color-primary-blue);
}
.notif-type-dot.discount {
  background-color: #E67E22;
}
.notif-type-dot.stock {
  background-color: var(--color-success);
}
.notif-type-dot.system {
  background-color: var(--color-deep-blue);
}

.notif-content-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notif-title {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
}

.notif-message {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.35;
}

.notif-time {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.notif-footer {
  padding: 10px 16px;
  background: var(--color-off-white);
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.view-orders-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-blue);
  cursor: pointer;
}

.view-orders-btn:hover {
  text-decoration: underline;
}

/* Cart Button */
.cart-icon-wrap {
  position: relative;
  display: flex;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background-color: var(--color-accent-yellow);
  color: var(--color-text-primary);
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.cart-badge.fav-badge {
  background-color: #DC5B61;
  color: #FFFFFF;
}

[dir="rtl"] .cart-badge {
  right: auto;
  left: -10px;
}

.divider {
  width: 1px;
  height: 32px;
  background-color: var(--color-border);
}

/* User Menu */
.user-menu-wrapper {
  position: relative;
}

.user-profile-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 4px 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background var(--dur-fast) var(--ease-smooth);
}

.user-profile-btn:hover {
  background: var(--color-off-white);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.2;
}

.pharmacy-name {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.chevron-icon {
  color: var(--color-text-tertiary);
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 260px;
  max-width: 300px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-xs);
  z-index: 200;
  animation: fadeIn 0.15s ease-out;
}

[dir="rtl"] .user-dropdown {
  right: auto;
  left: 0;
}

.dropdown-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.dropdown-avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-sm {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-bold);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  flex-shrink: 0;
}

.dropdown-user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  text-align: left;
}

[dir="rtl"] .dropdown-user-meta {
  text-align: right;
}

.meta-name {
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.dropdown-business {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.dropdown-email {
  font-size: 0.71875rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.dropdown-links {
  padding-top: var(--space-2xs);
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 8px 12px;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-radius: var(--radius-xs);
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-fast) var(--ease-smooth);
}

.menu-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-primary-blue);
}

.menu-item.logout {
  color: var(--color-error);
}
.menu-item.logout:hover {
  background: var(--color-error-bg);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 4px 0;
}

/* Secondary Navigation Links Strip */
.header-nav-strip {
  background: var(--color-off-white);
  border-top: 1px solid var(--color-border-light);
}

.nav-strip-inner {
  display: flex;
  align-items: center;
  height: 44px;
}

.main-nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  overflow-x: auto;
}

.nav-link-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
  text-decoration: none;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.nav-link-item:hover {
  color: var(--color-primary-blue);
  background: rgba(25, 118, 173, 0.08);
}

.nav-link-item.is-active {
  color: var(--color-primary-blue);
  background: #FFFFFF;
  box-shadow: inset 0 0 0 1px rgba(25, 118, 173, 0.16), 0 2px 6px rgba(18, 73, 107, 0.06);
}

.flash-nav-item {
  color: #C0392B;
}

.flash-nav-item:hover {
  color: #E74C3C;
}

.fire-icon {
  color: #E74C3C;
}

.flash-tag {
  font-size: 0.625rem;
  font-weight: var(--font-weight-extrabold);
  background: #FDEDEC;
  color: #C0392B;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  text-transform: uppercase;
}

/* Auth Buttons */
.auth-buttons-group {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}

.demo-quick-btn {
  font-size: 0.6875rem;
  background: #FEF3F2;
  color: #B42318;
  border: 1px solid rgba(220, 91, 97, 0.3);
  padding: 3px 6px;
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.mobile-toggle-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--color-deep-blue);
  padding: 4px;
}

/* Mobile Navigation Sidebar Drawer (App-Style Sidebar) */
.mobile-nav-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 73, 107, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 999;
  animation: backdropFadeIn 0.25s ease-out;
}

@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-nav-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: auto;
  width: 84vw;
  max-width: 320px;
  height: 100vh;
  height: 100dvh;
  background: #FFFFFF;
  box-shadow: 0 0 40px rgba(18, 73, 107, 0.25);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  animation: slideInFromLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

[dir="rtl"] .mobile-nav-sidebar {
  left: auto;
  right: 0;
  animation: slideInFromRight 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideInFromLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Sidebar Top Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: #FFFFFF;
  flex-shrink: 0;
}

.sidebar-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.sidebar-close-btn {
  background: var(--color-off-white);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--dur-fast);
}

.sidebar-close-btn:hover {
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  border-color: var(--color-primary-blue);
}

/* Scrollable Body */
.sidebar-scrollable-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-scrollable-body::-webkit-scrollbar {
  width: 4px;
}
.sidebar-scrollable-body::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 999px;
}

/* User Profile Card */
.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, var(--color-pale-blue), #F0F9FF);
  border: 1px solid rgba(25, 118, 173, 0.2);
  border-radius: var(--radius-md);
}

.sidebar-user-avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue);
  color: #FFFFFF;
  font-weight: var(--font-weight-bold);
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(25, 118, 173, 0.3);
}

.sidebar-user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex-grow: 1;
}

.sidebar-user-name {
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-business-tag {
  font-size: 0.6875rem;
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-email {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Guest Card */
.sidebar-guest-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.guest-icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guest-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.guest-info strong {
  font-size: 0.8125rem;
  color: var(--color-deep-blue);
}

.guest-info span {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

/* Search Button inside Sidebar */
.mobile-search-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mobile-search-btn:hover {
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
}

.mobile-search-btn .search-ico {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.mobile-search-btn .search-placeholder {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nav Groups */
.sidebar-nav-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-title {
  font-size: 0.6875rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  padding: 0 4px;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  width: 100%;
  text-align: inherit;
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-deep-blue);
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--dur-fast);
}

.mobile-nav-item:hover {
  background: var(--color-off-white);
  color: var(--color-primary-blue);
}

.mobile-nav-item.is-active {
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-bold);
}

.mobile-nav-item.highlight-flash {
  color: #C0392B;
}

.mobile-nav-item.highlight-flash:hover {
  background: #FDEDEC;
}

/* Language Switch */
.mobile-lang-drawer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: var(--color-off-white);
  color: var(--color-primary-blue);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--dur-fast);
  margin-top: 4px;
}

.mobile-lang-drawer-btn:hover {
  background: var(--color-primary-blue-light);
  border-color: var(--color-primary-blue);
}

/* Sticky Bottom Auth Section */
.sidebar-footer {
  padding: 14px 16px;
  background: #FFFFFF;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.mobile-search-icon-btn {
  display: none;
}

/* Intermediate Laptop Breakpoint: 1025px - 1200px */
@media (max-width: 1200px) {
  .search-trigger-box {
    max-width: 320px;
  }
  .search-kbd {
    display: none;
  }
  .action-icon-btn:not(.cart-btn) .icon-label,
  .cart-btn .icon-label {
    display: none;
  }
}

@media (max-width: 1100px) {
  .user-info-text {
    display: none;
  }
  .search-trigger-box {
    max-width: 220px;
  }
  .auth-buttons-group :deep(button) {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}

/* Tablet & Mobile Breakpoint: <= 1024px */
@media (max-width: 1024px) {
  .header-nav-strip {
    display: none;
  }

  .search-trigger-box,
  .divider,
  .action-icon-btn:not(.mobile-search-icon-btn):not(.cart-btn),
  .auth-buttons-group {
    display: none;
  }

  .mobile-search-icon-btn {
    display: flex;
  }

  .mobile-search-icon-btn .icon-label {
    display: none;
  }

  .action-icon-btn.cart-btn {
    display: flex;
  }

  .action-icon-btn.cart-btn .icon-label {
    display: none;
  }

  .mobile-toggle-btn {
    display: flex;
  }

  .mobile-lang-quick-btn {
    display: inline-flex;
  }
}

/* Small Screens: <= 600px */
@media (max-width: 600px) {
  .header-inner {
    height: 64px;
    gap: var(--space-xs);
  }

  .logo-link :deep(.drugza-brand-tagline) {
    display: none;
  }

  .logo-link :deep(.drugza-pill-icon) {
    width: 30px;
    height: 30px;
  }

  .logo-link :deep(.drugza-brand-name) {
    font-size: 1.35rem;
  }

  .header-actions {
    gap: 4px;
  }

  .action-icon-btn {
    padding: 4px 6px;
  }

  .mobile-toggle-btn {
    padding: 4px;
  }
}

/* Ultra compact: <= 360px */
@media (max-width: 360px) {
  .logo-link :deep(.drugza-brand-name) {
    font-size: 1.15rem;
  }
  .mobile-lang-quick-btn {
    padding: 3px 6px;
    font-size: 0.6875rem;
  }
}

.mobile-lang-quick-btn {
  display: none;
  align-items: center;
  gap: 4px;
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  border: 1px solid rgba(25, 118, 173, 0.2);
  border-radius: var(--radius-pill);
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.mobile-lang-drawer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  border: 1px solid rgba(25, 118, 173, 0.25);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.mobile-lang-drawer-btn:hover {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

.lang-btn {
  color: var(--color-primary-blue);
}

.lang-btn:hover {
  background: var(--color-primary-blue-light);
}

.lang-icon {
  color: var(--color-primary-blue);
}

[dir="rtl"] .mobile-nav-item {
  text-align: right;
}

[dir="rtl"] .user-dropdown {
  right: auto;
  left: 0;
}

[dir="rtl"] .notification-dropdown {
  right: auto;
  left: -20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
