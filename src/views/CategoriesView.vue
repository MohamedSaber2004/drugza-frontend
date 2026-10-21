<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import type { Category } from '@/types';
import { categoriesService } from '@/services';
import CategoryCard from '@/components/domain/CategoryCard.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const { t } = useI18n();
const categories = ref<Category[]>([]);
const currentPage = ref(1);

onMounted(async () => {
  try {
    const list = await categoriesService.getCategories();
    if (list && list.length > 0) {
      categories.value = list;
    }
  } catch (e) {
    console.warn('Error loading categories:', e);
  }
});

const pageSize = 12;
const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return categories.value.slice(start, start + pageSize);
});

function handleSelectCategory(cat: Category) {
  router.push(`/categories/${cat.id}`);
}
</script>

<template>
  <div class="categories-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <span class="current">{{ t('categoriesPage.heading') }}</span>
      </nav>

      <!-- Header Card -->
      <div class="categories-hero-card">
        <div class="hero-text-col">
          <span class="eyebrow">{{ t('categoriesPage.eyebrow') }}</span>
          <h1 class="page-title">{{ t('categoriesPage.heading') }}</h1>
          <p class="page-subtitle">
            {{ t('categoriesPage.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Categories Grid (Paginated, 12 per page) -->
      <div v-if="categories.length > 0" class="categories-grid">
        <CategoryCard
          v-for="cat in paginatedCategories"
          :key="cat.id"
          :category="cat"
          @select="handleSelectCategory"
        />
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="categories.length > 0"
        v-model="currentPage"
        :total-items="categories.length"
        :page-size="pageSize"
        :item-label="t('nav.categories')"
      />
    </div>
  </div>
</template>

<style scoped>
.categories-page {
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

.categories-hero-card {
  background: linear-gradient(135deg, #12496B 0%, #1976AD 100%);
  border-radius: var(--radius-2xl);
  padding: var(--space-2xl);
  color: #FFFFFF;
  margin-bottom: var(--space-2xl);
  box-shadow: var(--shadow-md);
}

@media (max-width: 640px) {
  .categories-hero-card {
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

.categories-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-md);
}

@media (max-width: 1200px) {
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
</style>
