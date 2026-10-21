<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight, Search, Building2 } from 'lucide-vue-next';
import type { Supplier } from '@/types';
import { providersService } from '@/services';
import SupplierCard from '@/components/domain/SupplierCard.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const { t } = useI18n();
const suppliers = ref<Supplier[]>([]);
const searchQuery = ref('');
const isLoading = ref(true);
const currentPage = ref(1);
const pageSize = 12;

onMounted(async () => {
  isLoading.value = true;
  try {
    const list = await providersService.getProviders();
    if (list && list.length > 0) {
      suppliers.value = list;
    }
  } catch (e) {
    console.warn('Error loading suppliers:', e);
  } finally {
    isLoading.value = false;
  }
});

const filteredSuppliers = computed(() => {
  if (!searchQuery.value.trim()) return suppliers.value;
  const q = searchQuery.value.toLowerCase().trim();
  return suppliers.value.filter(s =>
    s.businessName.toLowerCase().includes(q) ||
    (s.arabicName && s.arabicName.includes(q)) ||
    (s.location && s.location.toLowerCase().includes(q))
  );
});

watch(searchQuery, () => {
  currentPage.value = 1;
});

const paginatedSuppliers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredSuppliers.value.slice(start, start + pageSize);
});

function handleSelectSupplier(sup: Supplier) {
  router.push(`/providers/${sup.id}`);
}
</script>

<template>
  <div class="providers-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <span class="current">{{ t('providersPage.heading') }}</span>
      </nav>

      <!-- Hero Header -->
      <div class="providers-hero-card">
        <div class="hero-text-col">
          <span class="eyebrow">{{ t('providersPage.eyebrow') }}</span>
          <h1 class="page-title">{{ t('providersPage.heading') }}</h1>
          <p class="page-subtitle">
            {{ t('providersPage.subtitle') }}
          </p>

          <!-- Search Distributors Input -->
          <div class="providers-search-bar">
            <Search :size="18" class="search-ico" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('providersPage.searchPlaceholder')"
              class="search-input"
            />
          </div>
        </div>
      </div>

      <!-- Count Header -->
      <div class="providers-meta-bar">
        <span class="count-pill">
          <Building2 :size="16" />
          {{ t('providersPage.showingCount', { count: filteredSuppliers.length }) }}
        </span>
      </div>

      <!-- Suppliers Grid (Paginated, 12 per page) -->
      <div v-if="filteredSuppliers.length > 0" class="suppliers-grid">
        <SupplierCard
          v-for="sup in paginatedSuppliers"
          :key="sup.id"
          :supplier="sup"
          @select="handleSelectSupplier"
        />
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="filteredSuppliers.length > 0"
        v-model="currentPage"
        :total-items="filteredSuppliers.length"
        :page-size="pageSize"
        :item-label="t('nav.distributors')"
      />
    </div>
  </div>
</template>

<style scoped>
.providers-page {
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
}
.breadcrumb-row a:hover {
  color: var(--color-primary-blue);
}
.breadcrumb-row .current {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
}

.providers-hero-card {
  background: linear-gradient(135deg, #12496B 0%, #1976AD 100%);
  border-radius: var(--radius-2xl);
  padding: var(--space-2xl);
  color: #FFFFFF;
  margin-bottom: var(--space-2xl);
  box-shadow: var(--shadow-md);
}

@media (max-width: 640px) {
  .providers-hero-card {
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
  }
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-accent-yellow);
  letter-spacing: 0.08em;
}

.page-title {
  font-size: 2.25rem;
  color: #FFFFFF;
  margin: 4px 0 8px;
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.5rem;
  }
}

.page-subtitle {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 680px;
  line-height: 1.6;
}

.suppliers-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .suppliers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .suppliers-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 520px) {
  .suppliers-grid {
    grid-template-columns: 1fr;
  }
}

.providers-search-bar {
  margin-top: var(--space-md);
  position: relative;
  display: flex;
  align-items: center;
  max-width: 480px;
}

.search-ico {
  position: absolute;
  left: 14px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

[dir="rtl"] .search-ico {
  left: auto;
  right: 14px;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 42px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-deep-blue);
  font-size: 0.875rem;
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all var(--dur-fast) var(--ease-smooth);
}

[dir="rtl"] .search-input {
  padding: 0 42px 0 16px;
}

.search-input:focus {
  background: #FFFFFF;
  border-color: var(--color-accent-yellow);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.3);
}

.providers-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.count-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
  box-shadow: var(--shadow-xs);
}
</style>
