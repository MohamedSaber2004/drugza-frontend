# Comprehensive Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement and standardize responsive, grid-optimized client-side pagination (12 items per page) across all categories, products, and distributor pages in Drugza frontend store.

**Architecture:** Use the existing shared `Pagination.vue` component with computed sliced lists and automatic page resets on search and filter modifications. Set 12 items per page across all 2-col, 3-col, 4-col, and 6-col responsive CSS grids.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Lucide Vue Next, Vite.

---

### Task 1: Fix and Optimize Pagination in ProvidersView (`/providers`)
**Files:**
- Modify: `src/views/ProvidersView.vue`

- [x] **Step 1: Update pageSize to 12 and add reactive reset watcher**
  - Change `pageSize` from 10 to 12.
  - Add `watch(searchQuery, () => { currentPage.value = 1; })` to eliminate blank results when filtering from high page numbers.
  - Update `<Pagination :page-size="12">`.

---

### Task 2: Add Pagination to ProviderDetailView (`/providers/:id`)
**Files:**
- Modify: `src/views/ProviderDetailView.vue`

- [x] **Step 1: Import Pagination component and define pagination state**
  - Import `Pagination` from `@/components/ui/Pagination.vue`.
  - Add `currentPage = ref(1)` and `pageSize = 12`.
  - Add `paginatedProducts = computed(() => { const start = (currentPage.value - 1) * pageSize; return filteredProducts.value.slice(start, start + pageSize); })`.
  - Add watcher on `[searchQuery, selectedCategory]` to reset `currentPage.value = 1`.
- [x] **Step 2: Render paginated products and Pagination component in template**
  - Change `v-for="prod in filteredProducts"` to `v-for="prod in paginatedProducts"`.
  - Place `<Pagination v-if="filteredProducts.length > 0" v-model="currentPage" :total-items="filteredProducts.length" :page-size="pageSize" :item-label="locale === 'ar' ? 'منتج' : 'products'" />` below the grid.

---

### Task 3: Align Pagination in CategoriesView (`/categories`)
**Files:**
- Modify: `src/views/CategoriesView.vue`

- [x] **Step 1: Update pageSize to 12**
  - Change `pageSize` from 10 to 12 so that in 6-column desktop grids and 3-column tablet grids, all rows are balanced.
  - Update `:page-size="12"` in the `<Pagination>` component.

---

### Task 4: Align Pagination in CatalogView (`/catalog`)
**Files:**
- Modify: `src/views/CatalogView.vue`

- [x] **Step 1: Update pageSize to 12 and verify filter watchers**
  - Change `pageSize` from 10 to 12 so the 3-column grid displays 4 full rows of 3 items.
  - Verify that the watcher on `[searchQuery, selectedCategory, selectedSort, onlyInStock, onlyFlashSales, maxPrice]` resets `currentPage.value = 1`.
  - Update `:page-size="12"` in `<Pagination>`.

---

### Task 5: Align Pagination in CategoryProvidersView (`/categories/:id`)
**Files:**
- Modify: `src/views/CategoryProvidersView.vue`

- [x] **Step 1: Standardize pageSize to 12 for both suppliers and products**
  - Set `pageSize = 12`.
  - Update `:page-size="12"` on both `<Pagination>` components.

---

### Task 6: Type Check & Build Verification
**Files:**
- Workspace root

- [x] **Step 1: Run TypeScript compiler and Vite build**
  - Execute `npm run build` to confirm 0 type errors, clean compilation, and bundle integrity.
