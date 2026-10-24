# Clean Architecture & Dependency Injection Refactoring Design

## Overview
This design document defines the complete architectural refactoring of the Drugza frontend application (Vue 3, TypeScript, Vite) to adhere strictly to **Clean Architecture** principles and implement an explicit, type-safe **Dependency Injection (DI) Container**.

## Motivation & Goals
1. **Decoupling Business Logic**: Decouple domain entities and business use cases from UI components, Vue reactivity primitives, and external HTTP libraries (Axios).
2. **Inversion of Control (IoC)**: Utilize a lightweight, high-performance TypeScript DI Container supporting Singleton and Transient lifecycles, explicit tokens, and composable injection (`useInjection`).
3. **Data Integrity & Mapping**: Formalize DTOs (Data Transfer Objects) matching backend contracts, Domain Entities representing pure application state, and Mappers bridging the two.
4. **Resilience & Zero Regressions**: Maintain compatibility bridges during migration to guarantee zero breaking changes to existing views, modals, cart, and authentication flows, while fixing the missing `RegisterView` route in `router/index.ts`.

---

## Architectural Layers (Layer-First Architecture)

```
src/
├── core/
│   ├── domain/                         # Enterprise & Application Domain (Pure TypeScript)
│   │   ├── entities/                   # Pure business models (User, Product, Order, CartItem, ...)
│   │   ├── repositories/               # Repository interfaces / contracts (IAuthRepository, ...)
│   │   └── usecases/                   # Single-responsibility interactors (LoginUseCase, GetProductsUseCase, ...)
│   └── di/                             # Dependency Injection Subsystem
│       ├── container.ts                # DI container core (register, resolve, lifecycle management)
│       ├── tokens.ts                   # Strongly-typed InjectionToken definitions
│       ├── registry.ts                 # Application DI composition root (service bindings)
│       └── useInjection.ts             # Composable for injecting dependencies in Vue components/composables
│
├── infrastructure/                     # Infrastructure & Data Layer
│   ├── http/                           # Axios instance, token & loading interceptors, HTTP abstractions
│   ├── dto/                            # Data Transfer Objects reflecting backend schema
│   ├── mappers/                        # Bi-directional mappers (DTO <-> Domain Entity)
│   ├── repositories/                   # Concrete implementations of domain repository interfaces
│   └── storage/                        # Storage drivers (LocalStorage, SessionStorage adapters)
│
├── presentation/                       # Presentation & UI Layer (Vue 3 Ecosystem)
│   ├── composables/                    # ViewModels injecting Use Cases and exposing reactive states
│   ├── views/                          # Route page views (Catalog, Home, Checkout, Profile, ...)
│   ├── components/                     # Domain, UI, and Layout components
│   └── directives/                     # Vue directives (v-loading, v-reveal)
│
├── router/                             # Vue Router with protected route guards and auth redirects
└── locales/                            # Internationalization resources (ar, en)
```

---

## 1. Core Domain Layer (`src/core/domain`)

### 1.1 Entities
Pure TypeScript types representing domain concepts with no dependencies on external packages:
- `User` & `UserProfile`
- `Product`, `ProductSupplierPrice`, `ActiveIngredient`, `Brand`
- `Category`, `Supplier` (Provider)
- `CartItem`, `CartSummary`
- `Order`, `OrderItem`, `ReturnOrder`
- `Address`, `DeliveryLocation`
- `BalanceAccount`, `BalanceTransaction`, `Invoice`
- `Banner`, `PolicyDocument`, `Notification`

### 1.2 Repository Contracts (Interfaces)
- `IAuthRepository`: login, register, verifyOtp, forgotPassword, resetPassword, logout, getCurrentUser.
- `IProductRepository`: getProducts, getProductById, getPopularProducts, getFlashSaleProducts, searchProducts, getSupplierPrices.
- `ICategoryRepository`: getCategories, getCategoryById, getCategoryProviders.
- `IProviderRepository`: getProviders, getTopProviders, getProviderById.
- `ICartRepository`: getCart, addItem, updateQuantity, removeItem, clearCart, applyCoupon.
- `IOrderRepository`: createOrder, getOrders, getOrderById, cancelOrder.
- `IAddressRepository`: getAddresses, createAddress, updateAddress, deleteAddress.
- `IBannerRepository`: getBanners, getSpecialOffers.
- `IBrandRepository`: getAllBrands, getPopularBrands.
- `IBalanceRepository`: getUserBalance, getUserTransactions.
- `IInvoiceRepository`: getUserInvoices.
- `IReturnRepository`: getPharmacyReturns, createReturn.
- `IPolicyRepository`: getTermsAndConditions, getPrivacyPolicy.
- `INotificationRepository`: getNotifications, markAsRead.

### 1.3 Use Cases
Interactors encapsulate single business operations:
- **Auth**: `LoginUseCase`, `RegisterUseCase`, `VerifyOtpUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase`.
- **Products**: `GetProductsUseCase`, `GetProductDetailUseCase`, `SearchProductsUseCase`, `GetFlashSaleProductsUseCase`.
- **Categories & Providers**: `GetCategoriesUseCase`, `GetProvidersUseCase`, `GetProviderDetailUseCase`.
- **Cart**: `GetCartUseCase`, `AddToCartUseCase`, `UpdateCartItemUseCase`, `RemoveCartItemUseCase`, `ApplyCouponUseCase`.
- **Orders**: `CheckoutOrderUseCase`, `GetUserOrdersUseCase`, `GetOrderDetailUseCase`, `CancelOrderUseCase`.
- **Addresses**: `GetAddressesUseCase`, `SaveAddressUseCase`, `DeleteAddressUseCase`.
- **Home & Banners**: `GetHomeDataUseCase`, `GetBannersUseCase`.

---

## 2. Dependency Injection Layer (`src/core/di`)

### 2.1 Container Specification
```typescript
export interface InjectionToken<T> {
  readonly description: string;
}

export function createToken<T>(description: string): InjectionToken<T> {
  return { description };
}

export class DIContainer {
  private instances = new Map<InjectionToken<unknown>, unknown>();
  private factories = new Map<InjectionToken<unknown>, { factory: (c: DIContainer) => unknown; isSingleton: boolean }>();

  registerInstance<T>(token: InjectionToken<T>, instance: T): void;
  registerSingleton<T>(token: InjectionToken<T>, factory: (c: DIContainer) => T): void;
  registerTransient<T>(token: InjectionToken<T>, factory: (c: DIContainer) => T): void;
  resolve<T>(token: InjectionToken<T>): T;
}
```

### 2.2 Global Tokens (`TOKENS`)
- **Infrastructure**: `TOKENS.HttpClient`, `TOKENS.StorageService`
- **Repositories**: `TOKENS.AuthRepository`, `TOKENS.ProductRepository`, `TOKENS.CartRepository`, etc.
- **Use Cases**: `TOKENS.LoginUseCase`, `TOKENS.GetProductsUseCase`, `TOKENS.AddToCartUseCase`, etc.

### 2.3 Vue 3 Integration (`useInjection`)
```typescript
export function useInjection<T>(token: InjectionToken<T>): T {
  return defaultContainer.resolve(token);
}
```

---

## 3. Infrastructure Layer (`src/infrastructure`)

### 3.1 HTTP Client & Interceptors
- `HttpClient`: Encapsulates Axios with base URL `https://drugzaapi.runasp.net`.
- Requests automatically attach the Bearer token from `StorageService`.
- Triggers global `loadingService` notifications.
- Automatically handles 401 Unauthorized responses by clearing auth tokens and redirecting protected routes.

### 3.2 DTOs & Mappers
- DTO interfaces for all backend payloads matching `swagger.json` and `user_endpoints.json`.
- Pure mapper functions transforming raw API responses to clean domain entities.

### 3.3 Concrete Repositories
Implements domain repository interfaces using `IHttpClient`, handling endpoint communications and error translation.

---

## 4. Presentation Layer (`src/presentation`)

### 4.1 Composables as ViewModels
- Composables (`useAuth`, `useCart`, `useFavorites`, etc.) inject Use Cases using `useInjection`.
- Maintain reactive state (`ref`, `computed`) for Vue views.
- Isolate UI components from repository contracts and network details.

### 4.2 Views & Components
- Views consume composables or inject use cases directly where appropriate.
- Fix missing `RegisterView.vue` by providing a dedicated, accessible pharmacy registration view matching design tokens and schema.

---

## 5. Backward Compatibility & Migration Strategy
- `src/services/` is retained as an adapter layer delegating calls to the DI container use cases/repositories so no existing code or view breaks prematurely.
- Incremental verification via `npm run build` at every milestone to ensure 100% build validity.
