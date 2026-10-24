# Clean Architecture & Dependency Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Drugza frontend application to implement Clean Architecture (Core Domain, Infrastructure, Presentation) and a type-safe Dependency Injection container with zero breaking changes and full build verification.

**Architecture:** Layer-First Clean Architecture where pure TypeScript domain entities, repository contracts, and use cases reside in `src/core/domain`. Concrete HTTP implementations and mappers reside in `src/infrastructure`. A lightweight type-safe DI Container in `src/core/di` manages singletons, transient instances, and token resolution for Vue composables and views.

**Tech Stack:** Vue 3, TypeScript, Vite, Axios, Lucide Vue Next, Vue Router.

---

### Task 1: DI Container Core, Tokens, and Composable

**Files:**
- Create: `src/core/di/container.ts`
- Create: `src/core/di/tokens.ts`
- Create: `src/core/di/useInjection.ts`
- Create: `src/core/di/index.ts`

- [ ] **Step 1: Create DI Container with lifecycle support**
Create `src/core/di/container.ts` supporting `registerInstance`, `registerSingleton`, `registerTransient`, and `resolve`.

- [ ] **Step 2: Define strong Injection Tokens**
Create `src/core/di/tokens.ts` defining tokens for HTTP client, Storage service, all domain repositories, and all use cases.

- [ ] **Step 3: Create Vue Injection Composable and Barrel Export**
Create `src/core/di/useInjection.ts` and `src/core/di/index.ts` exposing the default container instance and helper methods.

- [ ] **Step 4: Commit Task 1**
```bash
git add src/core/di/
git commit -m "feat(di): implement lightweight dependency injection container and tokens"
```

---

### Task 2: Core Domain Entities

**Files:**
- Create: `src/core/domain/entities/user.entity.ts`
- Create: `src/core/domain/entities/product.entity.ts`
- Create: `src/core/domain/entities/category.entity.ts`
- Create: `src/core/domain/entities/provider.entity.ts`
- Create: `src/core/domain/entities/cart.entity.ts`
- Create: `src/core/domain/entities/order.entity.ts`
- Create: `src/core/domain/entities/address.entity.ts`
- Create: `src/core/domain/entities/common.entity.ts`
- Create: `src/core/domain/entities/index.ts`

- [ ] **Step 1: Create pure domain entities**
Implement clean TypeScript interfaces and types in `src/core/domain/entities/` free from external HTTP or framework dependencies.

- [ ] **Step 2: Export unified barrel**
Export all entities in `src/core/domain/entities/index.ts`.

- [ ] **Step 3: Commit Task 2**
```bash
git add src/core/domain/entities/
git commit -m "feat(domain): define core business entities and value objects"
```

---

### Task 3: Core Domain Repository Interfaces (Contracts)

**Files:**
- Create: `src/core/domain/repositories/auth.repository.ts`
- Create: `src/core/domain/repositories/product.repository.ts`
- Create: `src/core/domain/repositories/category.repository.ts`
- Create: `src/core/domain/repositories/provider.repository.ts`
- Create: `src/core/domain/repositories/cart.repository.ts`
- Create: `src/core/domain/repositories/order.repository.ts`
- Create: `src/core/domain/repositories/address.repository.ts`
- Create: `src/core/domain/repositories/banner.repository.ts`
- Create: `src/core/domain/repositories/content.repository.ts`
- Create: `src/core/domain/repositories/index.ts`

- [ ] **Step 1: Create repository interfaces**
Define contracts in `src/core/domain/repositories/` specifying methods and return promises of domain entities.

- [ ] **Step 2: Export unified repository barrel**
Export all interfaces in `src/core/domain/repositories/index.ts`.

- [ ] **Step 3: Commit Task 3**
```bash
git add src/core/domain/repositories/
git commit -m "feat(domain): define repository interface contracts"
```

---

### Task 4: Infrastructure Storage & HTTP Client

**Files:**
- Create: `src/infrastructure/storage/storage.service.ts`
- Create: `src/infrastructure/http/http.client.ts`
- Create: `src/infrastructure/http/index.ts`

- [ ] **Step 1: Create Storage Service**
Create `src/infrastructure/storage/storage.service.ts` with `IStorageService` interface and `LocalStorageService` implementation for managing auth tokens and user profile state.

- [ ] **Step 2: Create HTTP Client with Interceptors**
Create `src/infrastructure/http/http.client.ts` with `IHttpClient` interface and Axios-backed `AxiosHttpClient` supporting JWT injection, 401 handling, and loading state integration.

- [ ] **Step 3: Commit Task 4**
```bash
git add src/infrastructure/storage/ src/infrastructure/http/
git commit -m "feat(infrastructure): implement storage service and resilient HTTP client"
```

---

### Task 5: Infrastructure DTOs & Mappers

**Files:**
- Create: `src/infrastructure/dto/index.ts`
- Create: `src/infrastructure/mappers/index.ts`

- [ ] **Step 1: Define API DTOs**
Create `src/infrastructure/dto/index.ts` matching Swagger contracts for Auth, Products, Orders, Categories, Addresses, Cart, Balances, etc.

- [ ] **Step 2: Implement bi-directional mappers**
Create `src/infrastructure/mappers/index.ts` with pure converter functions transforming DTOs into Domain Entities.

- [ ] **Step 3: Commit Task 5**
```bash
git add src/infrastructure/dto/ src/infrastructure/mappers/
git commit -m "feat(infrastructure): implement API DTOs and entity mappers"
```

---

### Task 6: Concrete Repository Implementations

**Files:**
- Create: `src/infrastructure/repositories/auth.repository.impl.ts`
- Create: `src/infrastructure/repositories/product.repository.impl.ts`
- Create: `src/infrastructure/repositories/category.repository.impl.ts`
- Create: `src/infrastructure/repositories/provider.repository.impl.ts`
- Create: `src/infrastructure/repositories/cart.repository.impl.ts`
- Create: `src/infrastructure/repositories/order.repository.impl.ts`
- Create: `src/infrastructure/repositories/address.repository.impl.ts`
- Create: `src/infrastructure/repositories/banner.repository.impl.ts`
- Create: `src/infrastructure/repositories/content.repository.impl.ts`
- Create: `src/infrastructure/repositories/index.ts`

- [ ] **Step 1: Implement concrete repositories**
Implement each repository using `IHttpClient` and mappers in `src/infrastructure/repositories/`.

- [ ] **Step 2: Export repository barrel**
Export all implementations in `src/infrastructure/repositories/index.ts`.

- [ ] **Step 3: Commit Task 6**
```bash
git add src/infrastructure/repositories/
git commit -m "feat(infrastructure): implement concrete repositories with HTTP client and mappers"
```

---

### Task 7: Core Domain Use Cases

**Files:**
- Create: `src/core/domain/usecases/auth.usecases.ts`
- Create: `src/core/domain/usecases/product.usecases.ts`
- Create: `src/core/domain/usecases/category.usecases.ts`
- Create: `src/core/domain/usecases/cart.usecases.ts`
- Create: `src/core/domain/usecases/order.usecases.ts`
- Create: `src/core/domain/usecases/address.usecases.ts`
- Create: `src/core/domain/usecases/banner.usecases.ts`
- Create: `src/core/domain/usecases/index.ts`

- [ ] **Step 1: Implement domain use cases**
Implement single-responsibility use cases in `src/core/domain/usecases/` each taking their required repository via constructor injection.

- [ ] **Step 2: Export use cases barrel**
Export all use cases in `src/core/domain/usecases/index.ts`.

- [ ] **Step 3: Commit Task 7**
```bash
git add src/core/domain/usecases/
git commit -m "feat(domain): implement modular application use cases"
```

---

### Task 8: DI Registry Composition Root

**Files:**
- Create: `src/core/di/registry.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Wire all dependencies in DI registry**
Create `src/core/di/registry.ts` registering HTTP client, storage service, all concrete repositories, and all use cases into `container`.

- [ ] **Step 2: Initialize DI in main.ts**
Update `src/main.ts` to call `setupDependencyInjection()` on application bootstrap.

- [ ] **Step 3: Commit Task 8**
```bash
git add src/core/di/registry.ts src/main.ts
git commit -m "feat(di): bind all repositories and use cases in composition root"
```

---

### Task 9: Compatibility Facades & Services Layer Delegation

**Files:**
- Modify: `src/services/api.ts`
- Modify: `src/services/auth.service.ts`
- Modify: `src/services/products.service.ts`
- Modify: `src/services/cart.service.ts`
- Modify: `src/services/orders.service.ts`
- Modify: `src/services/address.service.ts`
- Modify: `src/services/index.ts`

- [ ] **Step 1: Update services to delegate to DI container**
Update legacy services in `src/services/` to act as thin facades delegating to the DI container use cases and repositories, preserving existing method signatures for existing views.

- [ ] **Step 2: Commit Task 9**
```bash
git add src/services/
git commit -m "refactor(services): delegate legacy services to DI container and use cases"
```

---

### Task 10: Missing Route Fix & Router Alignment

**Files:**
- Create: `src/views/auth/RegisterView.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1: Create RegisterView.vue**
Build `src/views/auth/RegisterView.vue` matching the Drugza design system, locale, form validation, and registration flow.

- [ ] **Step 2: Verify router resolution**
Ensure `src/router/index.ts` resolves `RegisterView.vue` properly.

- [ ] **Step 3: Commit Task 10**
```bash
git add src/views/auth/RegisterView.vue src/router/index.ts
git commit -m "feat(views): create RegisterView and align auth routes"
```

---

### Task 11: Composables Refactor & Full Build Verification

**Files:**
- Modify: `src/composables/useAuth.ts`
- Modify: `src/composables/useCart.ts`
- Modify: `src/composables/useFavorites.ts`

- [ ] **Step 1: Refactor composables to inject use cases**
Update core composables to use `useInjection` for resolving their respective use cases.

- [ ] **Step 2: Run production build**
Execute `npm run build` to verify 0 errors and production bundle generation.

- [ ] **Step 3: Commit Task 11**
```bash
git add src/composables/
git commit -m "refactor(composables): inject domain use cases and verify build"
```
