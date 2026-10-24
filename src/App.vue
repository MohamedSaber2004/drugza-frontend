<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MainHeader from '@/components/layout/MainHeader.vue';
import MainFooter from '@/components/layout/MainFooter.vue';
import CartDrawer from '@/components/domain/CartDrawer.vue';
import SearchModal from '@/components/domain/SearchModal.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
import GlobalProgressBar from '@/components/ui/GlobalProgressBar.vue';
import PageSkeleton from '@/components/ui/PageSkeleton.vue';
import { useLoading } from '@/composables/useLoading';
import { useCart } from '@/composables/useCart';
import type { Product } from '@/types';

const router = useRouter();
const route = useRoute();
const isSearchOpen = ref(false);
const { isSkeletonVisible, pageSkeletonType } = useLoading();
const { hydrateCart } = useCart();

const isAuthRoute = computed(() => {
  return (
    route.path.startsWith('/auth') ||
    route.query.minimal === 'true' ||
    route.query.layout === 'minimal' ||
    route.meta.hideNav === true
  );
});

function openSearch() {
  isSearchOpen.value = true;
}

function closeSearch() {
  isSearchOpen.value = false;
}

function handleSelectProductFromSearch(product: Product) {
  router.push(`/catalog?search=${encodeURIComponent(product.name)}`);
}

// Global Keyboard Shortcut: Ctrl+K or Cmd+K to open Search
function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    isSearchOpen.value = true;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  hydrateCart().catch(() => {});
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="drugza-app-layout">
    <!-- Top Progress Bar for API calls & Page Navigations -->
    <GlobalProgressBar />

    <!-- Main Header (Hidden on dedicated Auth pages) -->
    <MainHeader v-if="!isAuthRoute" @open-search="openSearch" />

    <!-- Main Dynamic Route View / Smooth Page Skeleton -->
    <main class="drugza-main-content">
      <Transition name="page-fade" mode="out-in">
        <PageSkeleton
          v-if="isSkeletonVisible"
          :key="'skeleton-' + pageSkeletonType"
          :type="pageSkeletonType"
        />
        <div v-else :key="'content-' + route.fullPath" class="page-content-wrapper">
          <router-view @open-search="openSearch" />
        </div>
      </Transition>
    </main>

    <!-- Footer (Hidden on dedicated Auth pages) -->
    <MainFooter v-if="!isAuthRoute" />

    <!-- Global Cart Drawer -->
    <CartDrawer v-if="!isAuthRoute" />

    <!-- Global Live Search Modal -->
    <SearchModal
      v-if="!isAuthRoute"
      :is-open="isSearchOpen"
      @close="closeSearch"
      @select-product="handleSelectProductFromSearch"
    />

    <!-- Global Reactive Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.drugza-app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.drugza-main-content {
  flex-grow: 1;
  width: 100%;
}

.page-content-wrapper {
  width: 100%;
  min-height: 100%;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.24s var(--ease-smooth),
    transform 0.24s var(--ease-smooth);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.998);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
