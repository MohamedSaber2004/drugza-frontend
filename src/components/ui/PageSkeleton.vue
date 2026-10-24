<script setup lang="ts">
import Skeleton from './Skeleton.vue';
import type { SkeletonType } from '@/composables/useLoading';

interface Props {
  type?: SkeletonType;
}

withDefaults(defineProps<Props>(), {
  type: 'default',
});
</script>

<template>
  <div class="page-skeleton-container" aria-busy="true" aria-label="Loading page content...">
    <!-- 1. CATALOG & PRODUCTS GRID PRESET -->
    <div v-if="type === 'catalog' || type === 'grid'" class="skeleton-catalog">
      <!-- Search & Filter Bar -->
      <div class="skeleton-toolbar">
        <Skeleton height="46px" radius="12px" class="toolbar-search" />
        <div class="toolbar-actions">
          <Skeleton width="120px" height="46px" radius="12px" />
          <Skeleton width="46px" height="46px" radius="12px" />
        </div>
      </div>

      <!-- Categories Pills Row -->
      <div class="skeleton-pills-row">
        <Skeleton v-for="i in 6" :key="i" width="110px" height="38px" rounded />
      </div>

      <!-- Products Grid -->
      <div class="skeleton-products-grid">
        <div v-for="i in 8" :key="i" class="skeleton-product-card">
          <Skeleton height="170px" radius="12px" class="product-image" />
          <div class="product-body">
            <div class="product-badge-row">
              <Skeleton width="60px" height="18px" rounded />
              <Skeleton width="40px" height="18px" rounded />
            </div>
            <Skeleton width="85%" height="16px" radius="4px" />
            <Skeleton width="60%" height="14px" radius="4px" />
            <div class="product-footer">
              <div class="price-stack">
                <Skeleton width="70px" height="20px" radius="6px" />
                <Skeleton width="45px" height="12px" radius="4px" />
              </div>
              <Skeleton width="40px" height="40px" radius="10px" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. ORDERS & TABLE PRESET -->
    <div v-else-if="type === 'orders' || type === 'table'" class="skeleton-orders">
      <!-- Page Header -->
      <div class="skeleton-header-section">
        <Skeleton width="180px" height="32px" radius="8px" />
        <Skeleton width="280px" height="16px" radius="6px" />
      </div>

      <!-- Filter Tabs -->
      <div class="skeleton-tabs-row">
        <Skeleton v-for="i in 4" :key="i" width="130px" height="42px" radius="10px" />
      </div>

      <!-- Order Cards List -->
      <div class="skeleton-orders-list">
        <div v-for="i in 4" :key="i" class="skeleton-order-card">
          <div class="order-card-header">
            <div class="order-id-group">
              <Skeleton width="130px" height="20px" radius="6px" />
              <Skeleton width="90px" height="14px" radius="4px" />
            </div>
            <Skeleton width="100px" height="28px" rounded />
          </div>
          <div class="order-card-provider">
            <Skeleton circle width="36px" height="36px" />
            <div class="provider-text">
              <Skeleton width="140px" height="16px" radius="4px" />
              <Skeleton width="80px" height="12px" radius="4px" />
            </div>
          </div>
          <div class="order-card-items">
            <Skeleton v-for="j in 3" :key="j" width="56px" height="56px" radius="8px" />
          </div>
          <div class="order-card-footer">
            <Skeleton width="120px" height="22px" radius="6px" />
            <div class="footer-buttons">
              <Skeleton width="100px" height="38px" radius="10px" />
              <Skeleton width="120px" height="38px" radius="10px" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. PROFILE & FORM PRESET -->
    <div v-else-if="type === 'profile' || type === 'form'" class="skeleton-profile">
      <!-- Profile Hero Banner -->
      <div class="skeleton-profile-hero">
        <Skeleton circle width="84px" height="84px" class="profile-avatar" />
        <div class="profile-hero-info">
          <Skeleton width="200px" height="26px" radius="6px" />
          <Skeleton width="160px" height="16px" radius="4px" />
        </div>
      </div>

      <!-- Form Card -->
      <div class="skeleton-form-card">
        <div class="form-card-title">
          <Skeleton width="160px" height="22px" radius="6px" />
          <Skeleton width="240px" height="14px" radius="4px" />
        </div>

        <div class="form-grid">
          <div v-for="i in 6" :key="i" class="form-field-skeleton">
            <Skeleton width="100px" height="14px" radius="4px" class="field-label" />
            <Skeleton height="46px" radius="10px" />
          </div>
        </div>

        <div class="form-actions">
          <Skeleton width="140px" height="46px" radius="12px" />
          <Skeleton width="100px" height="46px" radius="12px" />
        </div>
      </div>
    </div>

    <!-- 4. DETAIL PRESET (Provider / Product Detail) -->
    <div v-else-if="type === 'detail'" class="skeleton-detail">
      <Skeleton height="220px" radius="16px" class="detail-banner" />
      <div class="detail-info-row">
        <div class="detail-title-group">
          <Skeleton width="240px" height="30px" radius="8px" />
          <Skeleton width="180px" height="18px" radius="6px" />
        </div>
        <div class="detail-chips">
          <Skeleton width="90px" height="32px" rounded />
          <Skeleton width="90px" height="32px" rounded />
          <Skeleton width="90px" height="32px" rounded />
        </div>
      </div>
      <div class="skeleton-products-grid">
        <div v-for="i in 4" :key="i" class="skeleton-product-card">
          <Skeleton height="170px" radius="12px" class="product-image" />
          <div class="product-body">
            <Skeleton width="80%" height="16px" radius="4px" />
            <Skeleton width="50%" height="14px" radius="4px" />
            <div class="product-footer">
              <Skeleton width="60px" height="20px" radius="6px" />
              <Skeleton width="36px" height="36px" radius="10px" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. CONTENT PRESET (Terms, Privacy, FAQs, Articles) -->
    <div v-else-if="type === 'content'" class="skeleton-content">
      <!-- Breadcrumbs + Hero -->
      <div class="content-hero">
        <Skeleton width="140px" height="16px" radius="4px" />
        <Skeleton width="320px" height="36px" radius="8px" />
        <div class="content-meta">
          <Skeleton width="120px" height="22px" rounded />
          <Skeleton width="90px" height="22px" rounded />
        </div>
      </div>

      <!-- Main Layout: Sidebar Navigation + Body Sections -->
      <div class="content-layout">
        <div class="content-sidebar">
          <Skeleton width="100%" height="40px" radius="8px" />
          <div class="sidebar-links">
            <Skeleton v-for="i in 6" :key="i" width="100%" height="34px" radius="8px" />
          </div>
        </div>

        <div class="content-main">
          <div v-for="i in 4" :key="i" class="content-section-card">
            <div class="section-header">
              <Skeleton circle width="32px" height="32px" />
              <Skeleton width="220px" height="24px" radius="6px" />
            </div>
            <div class="section-lines">
              <Skeleton width="100%" height="14px" radius="4px" />
              <Skeleton width="96%" height="14px" radius="4px" />
              <Skeleton width="92%" height="14px" radius="4px" />
              <Skeleton width="75%" height="14px" radius="4px" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. DEFAULT PRESET (Home / General Fallback) -->
    <div v-else class="skeleton-default">
      <!-- Big Hero Banner -->
      <Skeleton height="320px" radius="20px" class="home-hero-skeleton" />

      <!-- Categories Pills / Circles -->
      <div class="home-categories-row">
        <div v-for="i in 6" :key="i" class="category-circle-item">
          <Skeleton circle width="68px" height="68px" />
          <Skeleton width="60px" height="12px" radius="4px" />
        </div>
      </div>

      <!-- Deals Section Heading -->
      <div class="section-heading-row">
        <div>
          <Skeleton width="200px" height="26px" radius="6px" />
          <Skeleton width="140px" height="14px" radius="4px" style="margin-top: 6px;" />
        </div>
        <Skeleton width="90px" height="32px" rounded />
      </div>

      <!-- Product Cards Grid -->
      <div class="skeleton-products-grid">
        <div v-for="i in 4" :key="i" class="skeleton-product-card">
          <Skeleton height="170px" radius="12px" class="product-image" />
          <div class="product-body">
            <div class="product-badge-row">
              <Skeleton width="60px" height="18px" rounded />
            </div>
            <Skeleton width="85%" height="16px" radius="4px" />
            <Skeleton width="55%" height="14px" radius="4px" />
            <div class="product-footer">
              <Skeleton width="70px" height="20px" radius="6px" />
              <Skeleton width="38px" height="38px" radius="10px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-skeleton-container {
  width: 100%;
  max-width: 1280px;
  min-height: 60vh;
  margin: 0 auto;
  padding: 28px 16px 56px;
  box-sizing: border-box;
  animation: skeleton-page-in 0.24s var(--ease-smooth) both;
}

@keyframes skeleton-page-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 1. Catalog Styles */
.skeleton-toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.toolbar-search {
  flex: 1;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.skeleton-pills-row {
  display: flex;
  gap: 10px;
  overflow-x: hidden;
  margin-bottom: 24px;
}

.skeleton-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.skeleton-product-card {
  background: #ffffff;
  border: 1px solid rgba(229, 234, 240, 0.8);
  border-radius: var(--radius-lg, 16px);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(18, 73, 107, 0.03);
}

.product-image {
  background: #f1f5f9;
}

.product-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-badge-row {
  display: flex;
  gap: 6px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 6px;
}

.price-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 2. Orders Styles */
.skeleton-header-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.skeleton-tabs-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.skeleton-orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-order-card {
  background: #ffffff;
  border: 1px solid rgba(229, 234, 240, 0.9);
  border-radius: var(--radius-lg, 16px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(18, 73, 107, 0.03);
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.order-id-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-card-provider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-card-items {
  display: flex;
  gap: 10px;
}

.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.footer-buttons {
  display: flex;
  gap: 10px;
}

/* 3. Profile Styles */
.skeleton-profile-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #ffffff;
  border: 1px solid #e5eaf0;
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  margin-bottom: 24px;
}

.profile-hero-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-form-card {
  background: #ffffff;
  border: 1px solid #e5eaf0;
  border-radius: var(--radius-lg, 16px);
  padding: 28px;
}

.form-card-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.form-field-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

/* 4. Detail Styles */
.skeleton-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-title-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-chips {
  display: flex;
  gap: 10px;
}

/* 5. Content Styles (Terms, Privacy) */
.content-hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.content-meta {
  display: flex;
  gap: 12px;
}

.content-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  align-items: start;
}

.content-sidebar {
  background: #ffffff;
  border: 1px solid #e5eaf0;
  border-radius: var(--radius-lg, 16px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-section-card {
  background: #ffffff;
  border: 1px solid #e5eaf0;
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 6. Default Styles */
.home-hero-skeleton {
  margin-bottom: 32px;
}

.home-categories-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 36px;
  gap: 12px;
  overflow-x: hidden;
}

.category-circle-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.section-heading-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .page-skeleton-container {
    padding: 16px 12px 32px;
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    display: none;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
