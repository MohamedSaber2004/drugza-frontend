<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
import { useI18n } from '@/composables/useI18n';

const emit = defineEmits<{
  (e: 'open-search'): void;
}>();

const router = useRouter();
const { t, locale, toggleLocale, isRtl } = useI18n();
const { user, isAuthenticated, logout, fetchUserProfile } = useAuth();
const { totalItemsCount, openCartDrawer } = useCart();

const isUserMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);

onMounted(() => {
  if (isAuthenticated.value && user.value?.id) {
    fetchUserProfile(user.value.id).catch(() => {});
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
</script>

<template>
  <header class="drugza-main-header">
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
          <Heart :size="20" />
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

    <!-- Navigation Links Bar (Desktop >= 1024px: Home, Categories, Flash Sales, Providers, Products, FAQ) -->
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

    <!-- Mobile Navigation Drawer Overlay & Panel (Screen < 1024px) -->
    <div
      v-if="isMobileMenuOpen"
      class="mobile-nav-backdrop"
      @click="isMobileMenuOpen = false"
    ></div>

    <div v-if="isMobileMenuOpen" class="mobile-nav-panel">
      <!-- Search Trigger in Mobile Drawer -->
      <div class="mobile-search-btn" @click="emit('open-search'); isMobileMenuOpen = false">
        <Search :size="18" />
        <span>{{ t('nav.searchPlaceholder') }}</span>
      </div>

      <!-- Navigation Links Grid/List inside Drawer -->
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

      <!-- Language Switch in Mobile Menu -->
      <button type="button" class="mobile-lang-drawer-btn" @click="toggleLocale">
        <Globe :size="18" />
        <span>{{ locale === 'ar' ? 'English (Switch to English)' : 'اللغة العربية (التحويل للعربية)' }}</span>
      </button>

      <!-- Auth section in Mobile Drawer -->
      <div class="mobile-auth-sec">
        <template v-if="isAuthenticated && user">
          <div class="mobile-user-card">
            <strong>{{ user.fullName || user.businessName }}</strong>
            <span>{{ user.businessName }}</span>
            <span class="user-email-micro">{{ user.email }}</span>
          </div>
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
    </div>
  </header>
</template>

<style scoped>
.drugza-main-header {
  background: #FFFFFF;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(18, 73, 107, 0.04);
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

/* Mobile Drawer */
.mobile-nav-panel {
  display: none;
  position: absolute;
  top: 72px;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-bottom: 2px solid var(--color-primary-blue);
  box-shadow: var(--shadow-lg);
  padding: var(--space-md);
  flex-direction: column;
  gap: var(--space-md);
  animation: fadeIn 0.2s ease-out;
}

.mobile-search-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 12px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
  border-radius: var(--radius-sm);
  background: var(--color-off-white);
  border: none;
  cursor: pointer;
}

.mobile-nav-item.highlight-flash {
  color: #C0392B;
  background: #FDEDEC;
}

.mobile-auth-sec {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-border);
}

.mobile-user-card {
  padding: 8px 12px;
  background: var(--color-pale-blue);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
}

@media (max-width: 860px) {
  .header-nav-strip {
    display: none;
  }

  .search-trigger-box,
  .divider,
  .action-icon-btn.cart-btn .icon-label,
  .action-icon-btn:not(.cart-btn),
  .auth-buttons-group {
    display: none;
  }

  .mobile-toggle-btn {
    display: flex;
  }

  .mobile-nav-panel {
    display: flex;
  }

  .mobile-lang-quick-btn {
    display: inline-flex;
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
