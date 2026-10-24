# Full Clean Architecture & Dependency Injection Refactoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the entire Drugza frontend project into a strict Layer-First Clean Architecture (`@presentation`, `@core`, `@infrastructure`, `@shared`), migrate all data access to Dependency Injection with Domain Use Cases, and completely eliminate legacy `src/services/`.

**Architecture:** Layer-First Clean Architecture where pure TypeScript domain models, repository contracts, and use cases reside in `src/core/domain`. Concrete HTTP implementations and mappers reside in `src/infrastructure`. A lightweight DI Container in `src/core/di` manages singletons and transient instances. The presentation layer in `src/presentation` comprises composables (acting as ViewModels injecting use cases), views, and components. All cross-cutting code lives in `src/shared`.

**Tech Stack:** Vue 3, TypeScript, Vite, Axios, Lucide Vue Next, Vue Router.

---

### Task 1: Vite & TypeScript Configuration for Layer Aliases

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`

- [ ] **Step 1: Add path aliases to vite.config.ts**
Update `vite.config.ts` with `@core`, `@infrastructure`, `@presentation`, `@shared`.

- [ ] **Step 2: Add path aliases to tsconfig.app.json**
Update `tsconfig.app.json` paths with `@core/*`, `@infrastructure/*`, `@presentation/*`, `@shared/*`.

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: Succeeded with 0 errors.

- [ ] **Step 4: Commit Task 1**
```bash
git add vite.config.ts tsconfig.app.json
git commit -m "chore(config): configure clean architecture path aliases"
```

---

### Task 2: Presentation & Shared Layer Reorganization

**Files:**
- Move: `src/views` -> `src/presentation/views`
- Move: `src/components` -> `src/presentation/components`
- Move: `src/composables` -> `src/presentation/composables`
- Move: `src/utils` -> `src/shared/utils`
- Move: `src/directives` -> `src/shared/directives`
- Move: `src/locales` -> `src/shared/locales`
- Move: `src/types` -> `src/shared/types`
- Modify: `src/router/index.ts`
- Modify: `src/main.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: Create directories and move files**
Move files to `src/presentation/` and `src/shared/`.

- [ ] **Step 2: Update router and main entrypoint**
Update `src/router/index.ts` and `src/main.ts` to import views and directives from `@presentation` and `@shared`.

- [ ] **Step 3: Update inter-component and view import paths**
Fix relative and absolute imports to use new aliases.

- [ ] **Step 4: Run typecheck and build**
Run: `npx vue-tsc --noEmit; npm run build`
Expected: 0 errors and build succeeds.

- [ ] **Step 5: Commit Task 2**
```bash
git add src/
git commit -m "refactor(presentation): restructure views, components, and shared utilities"
```

---

### Task 3: Auth Domain Migration to DI & Elimination of auth.service.ts

**Files:**
- Modify: `src/presentation/composables/useAuth.ts`
- Modify: `src/presentation/views/auth/LoginView.vue`
- Modify: `src/presentation/views/auth/RegisterView.vue`
- Modify: `src/presentation/views/auth/OtpView.vue`
- Modify: `src/presentation/views/auth/ForgotPasswordView.vue`
- Delete: `src/services/auth.service.ts`

- [ ] **Step 1: Refactor useAuth.ts to use DI use cases**
Inject `LoginUseCase`, `RegisterUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase`, `VerifyOtpUseCase`, `ForgotPasswordUseCase`, `ResetPasswordUseCase` via `useInjection()`.

- [ ] **Step 2: Update auth views to consume refactored useAuth**
Verify and update `LoginView`, `RegisterView`, `OtpView`, `ForgotPasswordView`.

- [ ] **Step 3: Delete legacy auth.service.ts**
Remove `src/services/auth.service.ts` and any remaining imports of it.

- [ ] **Step 4: Verify build**
Run: `npx vue-tsc --noEmit; npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 3**
```bash
git add src/
git commit -m "refactor(auth): migrate auth module to DI use cases and remove legacy auth service"
```

---

### Task 4: Catalog, Categories & Providers Domain Migration to DI

**Files:**
- Create: `src/presentation/composables/useProducts.ts`
- Create: `src/presentation/composables/useCategories.ts`
- Create: `src/presentation/composables/useProviders.ts`
- Modify: `src/presentation/views/CatalogView.vue`
- Modify: `src/presentation/views/CategoriesView.vue`
- Modify: `src/presentation/views/CategoryProvidersView.vue`
- Modify: `src/presentation/views/ProvidersView.vue`
- Modify: `src/presentation/views/ProviderDetailView.vue`
- Modify: `src/presentation/views/ProductDetailView.vue`
- Modify: `src/presentation/views/FlashSalesView.vue`
- Modify: `src/presentation/components/domain/SearchModal.vue`
- Modify: `src/presentation/components/domain/ProductDetailModal.vue`
- Delete: `src/services/products.service.ts`
- Delete: `src/services/categories.service.ts`
- Delete: `src/services/providers.service.ts`
- Delete: `src/services/brands.service.ts`
- Delete: `src/services/active-ingredients.service.ts`

- [ ] **Step 1: Create catalog composables with DI**
Implement `useProducts`, `useCategories`, `useProviders` injecting respective use cases.

- [ ] **Step 2: Update catalog views and search modals**
Replace direct service calls in catalog views and modals with composables / use cases.

- [ ] **Step 3: Remove legacy catalog services**
Delete legacy product, category, provider, brand, and ingredient services.

- [ ] **Step 4: Verify build**
Run: `npx vue-tsc --noEmit; npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 4**
```bash
git add src/
git commit -m "refactor(catalog): migrate products, categories, and providers to DI use cases"
```

---

### Task 5: Cart, Checkout & Orders Domain Migration to DI

**Files:**
- Modify: `src/presentation/composables/useCart.ts`
- Create: `src/presentation/composables/useOrders.ts`
- Modify: `src/presentation/views/CheckoutView.vue`
- Modify: `src/presentation/views/OrdersView.vue`
- Modify: `src/presentation/components/domain/CartDrawer.vue`
- Delete: `src/services/cart.service.ts`
- Delete: `src/services/orders.service.ts`
- Delete: `src/services/coupons.service.ts`

- [ ] **Step 1: Refactor useCart.ts to use DI**
Inject `GetCartUseCase`, `AddToCartUseCase`, `UpdateCartItemUseCase`, `RemoveCartItemUseCase`, `ClearCartUseCase`, `ApplyCouponUseCase`.

- [ ] **Step 2: Create useOrders.ts with DI**
Inject `CheckoutOrderUseCase`, `GetUserOrdersUseCase`, `GetOrderDetailUseCase`, `CancelOrderUseCase`.

- [ ] **Step 3: Update CheckoutView, OrdersView, and CartDrawer**
Migrate views and drawer to use refactored composables.

- [ ] **Step 4: Remove legacy cart and order services**
Delete `src/services/cart.service.ts`, `src/services/orders.service.ts`, `src/services/coupons.service.ts`.

- [ ] **Step 5: Verify build**
Run: `npx vue-tsc --noEmit; npm run build`
Expected: 0 errors.

- [ ] **Step 6: Commit Task 5**
```bash
git add src/
git commit -m "refactor(cart-orders): migrate cart, checkout, and orders to DI use cases"
```

---

### Task 6: Addresses, Home, Content Domain Migration & Decommission of services/

**Files:**
- Create: `src/presentation/composables/useAddresses.ts`
- Modify: `src/presentation/views/AddressesView.vue`
- Modify: `src/presentation/views/HomeView.vue`
- Modify: `src/presentation/views/ProfileView.vue`
- Modify: `src/presentation/views/PrivacyPolicyView.vue`
- Modify: `src/presentation/views/TermsView.vue`
- Modify: `src/presentation/components/layout/MainFooter.vue`
- Modify: `src/presentation/components/domain/AiAssistant.vue`
- Delete: Remaining files in `src/services/`
- Delete: Directory `src/services/`

- [ ] **Step 1: Migrate Addresses, Home, and Content views to DI**
Update `AddressesView.vue`, `HomeView.vue`, `ProfileView.vue`, `PrivacyPolicyView.vue`, `TermsView.vue`, and footer/AI assistant to use DI use cases.

- [ ] **Step 2: Remove all remaining legacy services and client files**
Delete `address.service.ts`, `home.service.ts`, `banners.service.ts`, `policy.service.ts`, `invoices.service.ts`, `balances.service.ts`, `notifications.service.ts`, `returns.service.ts`, `codecraft.service.ts`, `api.ts`, `client.ts`, `index.ts`. Remove `src/services` folder.

- [ ] **Step 3: Final verification**
Run: `npx vue-tsc --noEmit; npm run build`
Expected: 0 errors and production build fully generated.

- [ ] **Step 4: Commit Task 6**
```bash
git add src/
git commit -m "refactor(cleanup): complete Clean Architecture migration and decommission legacy services"
```
