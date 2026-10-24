# Clean Architecture & Dependency Injection Full Refactoring Design

**Date:** 2026-10-24
**Topic:** Full Codebase Refactoring to Layer-First Clean Architecture and Dependency Injection
**Status:** Approved

---

## 1. Context & Motivation

The application is an online pharmacy frontend (Drugza) built with Vue 3, Vite, and TypeScript. While the foundations for Clean Architecture (`src/core/domain`, `src/core/di`, `src/infrastructure`) were partially introduced, presentation layers (Views, Components, Composables) still directly depend on legacy `src/services/` singletons.

This refactor reorganizes the entire project directory into a strict Layer-First Clean Architecture:
- Core Domain (`src/core/domain`)
- Dependency Injection (`src/core/di`)
- Infrastructure (`src/infrastructure`)
- Presentation (`src/presentation`)
- Shared Modules (`src/shared`)
- Complete decommission and elimination of `src/services/`

---

## 2. Target Directory Hierarchy

```
src/
├── core/                        # Domain entities, repository interfaces, use cases & DI
│   ├── di/                      # Container, Tokens, Registry, useInjection
│   └── domain/
│       ├── entities/            # Pure domain models (User, Product, Cart, Order, Address...)
│       ├── repositories/        # Repository interface contracts
│       └── usecases/            # Business use cases
│
├── infrastructure/              # External interactions and concrete implementations
│   ├── http/                    # Axios HTTP client, token interceptors
│   ├── storage/                 # Storage services (LocalStorage, SessionStorage)
│   ├── dto/                     # Server DTO definitions
│   ├── mappers/                 # Bi-directional DTO <-> Entity mappers
│   └── repositories/            # Concrete repository implementations
│
├── presentation/                # Vue 3 UI layer
│   ├── composables/             # Presentation ViewModels consuming UseCases via DI
│   ├── components/              # Reusable UI & Domain components (ui/, layout/, domain/)
│   └── views/                   # Route views (auth/, CatalogView, CheckoutView...)
│
├── shared/                      # Reusable cross-cutting concerns
│   ├── utils/                   # Helper functions (currency, formatting, validation)
│   ├── directives/              # Vue directives (v-loading, v-reveal)
│   ├── locales/                 # Localization files (ar.ts, en.ts)
│   └── types/                   # Cross-cutting presentation types
│
├── router/                      # Vue Router mapping routes to @presentation/views
├── assets/                      # Global styles, fonts, and images
├── App.vue                      # Root App component
└── main.ts                      # Entrypoint initializing DI and mounting Vue
```

---

## 3. Path Aliases Configuration

In `vite.config.ts` and `tsconfig.app.json`:
- `@/` -> `src/`
- `@core/` -> `src/core/`
- `@infrastructure/` -> `src/infrastructure/`
- `@presentation/` -> `src/presentation/`
- `@shared/` -> `src/shared/`

---

## 4. Architectural Patterns & Data Flow

1. **Presentation Layer (Views & Components)**
   - Views and components never talk directly to HTTP clients or Axios.
   - Views consume Presentation Composables (`useAuth`, `useCart`, `useProducts`, etc.).
   - Composables inject Use Cases using `useInjection(TOKENS.SomeUseCase)`.

2. **Core Domain Layer**
   - Free from any framework imports (no Vue, no Axios).
   - Use Cases encapsulate application business operations.
   - Repositories are abstract TypeScript interfaces.

3. **Infrastructure Layer**
   - Concrete implementations of repository interfaces.
   - Encapsulates network payloads and data conversion (Mappers & DTOs).

4. **Decommissioning `src/services`**
   - All logic migrated to repositories and use cases.
   - `src/services` folder completely removed upon completion.

---

## 5. Phased Implementation Plan

- **Phase 1: Foundation & Structure**: Path aliases, moving components/views/composables/utils to `@presentation` and `@shared`, verifying zero regressions with `vue-tsc` and `build`.
- **Phase 2: Auth & User Migration**: `useAuth` refactor to DI, Auth views update, delete `auth.service.ts`.
- **Phase 3: Catalog, Products & Providers Migration**: `useProducts`, `useCategories`, `useProviders` refactor to DI, Views and modals migration, delete legacy catalog services.
- **Phase 4: Cart, Checkout & Orders Migration**: `useCart`, `useOrders` refactor to DI, Checkout/Orders views and CartDrawer migration, delete legacy cart/orders services.
- **Phase 5: Addresses, Content & Cleanup**: AddressesView, HomeView, ProfileView, Policy views migration, complete removal of `src/services/`.
