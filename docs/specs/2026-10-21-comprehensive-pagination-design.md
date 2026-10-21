# Comprehensive Pagination Design Document

**Date:** 2026-10-21  
**Status:** Approved  
**Topic:** Unified Client-Side Pagination for All Categories, Products, and Distributors  

---

## 1. Overview & Objective
Ensure all pages that display collections of categories, products, and distributors provide unified, consistent, and grid-optimized pagination using the shared `Pagination.vue` component.

Specifically covers:
1. **Categories (`/categories` - [CategoriesView.vue](file:///e:/Drugza%20frontend%20store/drugza-frontend/src/views/CategoriesView.vue)):** Standardize pagination with 12 items per page to perfectly match the 6-column / 3-column / 2-column responsive grid without jagged rows.
2. **Catalog / All Products (`/catalog` - [CatalogView.vue](file:///e:/Drugza%20frontend%20store/drugza-frontend/src/views/CatalogView.vue)):** Standardize pagination with 12 items per page (matching 3-col / 2-col / 1-col layout), ensuring all reactive filters (search, category, availability, price, sort) automatically reset to page 1.
3. **Distributors / Providers (`/providers` - [ProvidersView.vue](file:///e:/Drugza%20frontend%20store/drugza-frontend/src/views/ProvidersView.vue)):** Standardize pagination with 12 items per page (matching 4-col / 3-col / 2-col / 1-col layout) and fix the missing `watch(searchQuery)` so that searching always resets `currentPage` to 1, eliminating blank results.
4. **Distributor Details & Products (`/providers/:id` - [ProviderDetailView.vue](file:///e:/Drugza%20frontend%20store/drugza-frontend/src/views/ProviderDetailView.vue)):** Add full pagination for the provider's product catalog (12 items per page) with reactive page resets on search query or category pill switches.
5. **Category Providers & Products (`/categories/:id` - [CategoryProvidersView.vue](file:///e:/Drugza%20frontend%20store/drugza-frontend/src/views/CategoryProvidersView.vue)):** Verify and align pagination with 12 items per page and proper page reset handlers.

---

## 2. Architecture & UX Specification
- **Component:** `src/components/ui/Pagination.vue`
- **Page Size:** `12` items per page across all catalog grids. 12 is mathematically divisible by 6, 4, 3, 2, and 1, ensuring every row on desktop, tablet, and mobile is completely filled without empty trailing slots.
- **Scroll Behavior:** Smooth scroll to top on page change (handled cleanly by `Pagination.vue` via `:scroll-to-top="true"`).
- **Reactive Page Reset:** Any user action that modifies the active subset of items (typing in search, picking a category filter, checking in-stock, adjusting price slider, or sorting) MUST reset `currentPage = 1`.
- **Bilingual Support (i18n):** Summary indicators ("عرض 1-12 من إجمالي 48 منتج / موزع / صنف" / "Showing 1-12 of 48 items") using the current language (`ar` / `en`).

---

## 3. Scope & Files Affected
- `src/views/CategoriesView.vue`
- `src/views/CatalogView.vue`
- `src/views/ProvidersView.vue`
- `src/views/ProviderDetailView.vue`
- `src/views/CategoryProvidersView.vue`
