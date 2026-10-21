# Swagger API Alignment & TypeScript Services Synchronization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize the frontend TypeScript API services and type definitions with the full Drugza API OpenAPI 3.0.4 specification, correcting payload mismatches and implementing missing services for Active Ingredients, Balances/Wallet, Return Orders, Invoices, and Brands.

**Architecture:** Maintain the existing modular service architecture under `src/services/` powered by Axios (`src/services/client.ts`), ensuring strong typing via `src/types/index.ts` and `src/types/api.ts`. Provide a clean unified facade through `src/services/api.ts` and barrel exports in `src/services/index.ts`, preserving backwards compatibility with all existing Vue views and components.

**Tech Stack:** Vue 3 (Composition API), Vite, TypeScript, Axios.

---

### Task 1: TypeScript Types Synchronization & Additions

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/types/api.ts`

- [x] **Step 1: Create `src/types/api.ts` with Swagger DTOs**
Write `src/types/api.ts` containing DTO definitions directly matching the OpenAPI components:
  - `ActiveIngredientDto`, `ActiveIngredient`
  - `BalanceAccount`, `BalanceTransaction`, `BalanceSummaryDto`, `UpdateBalanceRequestDto`
  - `ReturnOrderDto`, `ReturnReasonDto`, `ReturnedItemDto`, `CreateReturnOrderDto`, `UpdateReturnStatusDto`
  - `InvoiceReportDto`, `InvoiceType`
  - `Brand`
  - `AddToCartRequestDto`, `UpdateCartQuantityRequestDto`, `RemoveFromCartRequestDto`
  - `ApplyCouponDto`
  - `DeliveryOption`, `DeliveryTimeSlotDto`

- [x] **Step 2: Update `src/types/index.ts` to export new entities and harmonize Order/OrderItem**
Harmonize `OrderItem` and `Order` properties in `src/types/index.ts` to support both camelCase and Swagger variants (`subtotal`, `shippingFee`, `total`, `price`/`unitPrice`) so no view breaks. Export new domain interfaces for ActiveIngredient, Brand, ReturnOrder, and Balance.

- [x] **Step 3: Verify TypeScript compilation**
Run: `npm run build`
Expected: PASS with 0 errors.

- [x] **Step 4: Commit**
```bash
git add src/types/api.ts src/types/index.ts
git commit -m "feat(types): add Swagger DTOs and harmonize domain types"
```

---

### Task 2: Align Core Existing Services (`cart`, `coupons`, `orders`, `address`)

**Files:**
- Modify: `src/services/cart.service.ts`
- Modify: `src/services/coupons.service.ts`
- Modify: `src/services/orders.service.ts`
- Modify: `src/services/address.service.ts`

- [x] **Step 1: Update `src/services/cart.service.ts`**
Align cart payload shapes with Swagger:
  - `addToCart(payload: { userId: string; inventoryId: string; productId: string; quantity: number })`
  - `updateCartQuantity(payload: { userId: string; productId: string; inventoryId: string; quantity: number })`
  - `removeFromCart(payload: { userId: string; productId: string })`
  - Maintain overloaded/convenience signatures for existing callers.

- [x] **Step 2: Update `src/services/coupons.service.ts`**
  - Update `applyCoupon(code: string, amount: number)` to send `{ code, amount }` per `ApplyCouponDto`.
  - Add `getCouponUsages(couponId: string)` and `getCouponRedemptions(couponId: string)`.

- [x] **Step 3: Update `src/services/orders.service.ts`**
  - Fix query parameters and add missing methods:
    - `getOrderDetails(orderNumber: string, status?: number)` (`GET /api/Orders/details`)
    - `getOrderStatus(orderId: string)` (`GET /api/Orders/get-status-order`)
    - `getRelatedOrders(orderNumber: string)` (`GET /api/Orders/related-orders`)
    - `createManualOrder(params, body: CreateOrderDto)` (`POST /api/Orders/add-order-manual`)

- [x] **Step 4: Update `src/services/address.service.ts`**
  - Add `getShippingFees(addressId: string)` (`GET /api/Address/GetShippingFess/{addressId}`)
  - Add `getAllAreas()` (`GET /api/Area/all-areies`)
  - Add `getAllZones()` (`GET /api/Zones/all-zones`)

- [x] **Step 5: Verify build**
Run: `npm run build`
Expected: PASS with 0 errors.

- [x] **Step 6: Commit**
```bash
git add src/services/cart.service.ts src/services/coupons.service.ts src/services/orders.service.ts src/services/address.service.ts
git commit -m "fix(services): align cart, coupons, orders, and address services with Swagger schema"
```

---

### Task 3: Implement Missing New Services (`active-ingredients`, `balances`, `returns`, `invoices`, `brands`)

**Files:**
- Create: `src/services/active-ingredients.service.ts`
- Create: `src/services/balances.service.ts`
- Create: `src/services/returns.service.ts`
- Create: `src/services/invoices.service.ts`
- Create: `src/services/brands.service.ts`

- [x] **Step 1: Create `src/services/active-ingredients.service.ts`**
Implement:
  - `getActiveIngredients(params?: { pageNumber?: number; pageSize?: number; search?: string })` (`GET /api/ActiveIngerients`)
  - `getActiveIngredientById(id: string)` (`GET /api/ActiveIngerients/{id}`)

- [x] **Step 2: Create `src/services/balances.service.ts`**
Implement:
  - `getUserBalance(userId: string)` (`GET /api/Balances/user/{userId}`)
  - `getUserTransactions(userId: string)` (`GET /api/Balances/user-transactions/{userId}`)
  - `depositCash(payload: UpdateBalanceRequestDto)` (`POST /api/Balances/deposit/cash`)
  - `withdrawCash(payload: UpdateBalanceRequestDto)` (`POST /api/Balances/withdraw/cash`)
  - `updateCreditLimit(payload: { accountId: string; newLimit: number })` (`PUT /api/Balances/credit-limit`)
  - `getBalanceSummary(params)` (`GET /api/reports/balance/summary`)

- [x] **Step 3: Create `src/services/returns.service.ts`**
Implement:
  - `createReturnOrder(payload: CreateReturnOrderDto)` (`POST /api/returns`)
  - `getReturnById(id: string)` (`GET /api/returns/{id}`)
  - `getPharmacyReturns()` (`GET /api/returns/pharmacy`)
  - `getReturnReasons()` (`GET /api/ReturnReasons` & `GET /api/returns/reasons`)
  - `getRelatedReturns(returnNumber: string)` (`GET /api/returns/related-returns`)

- [x] **Step 4: Create `src/services/invoices.service.ts`**
Implement:
  - `getInvoiceById(id: string)` (`GET /api/Invoices/{id}`)
  - `getInvoiceByOrderNumber(orderNumber: string)` (`GET /api/Invoices/{orderNumber}`)
  - `getInvoiceByOrderId(orderId: string)` (`GET /api/Invoices/order/{orderId}`)
  - `getUserInvoices(userId: string)` (`GET /api/Invoices/user/{userId}`)
  - `generateInvoice(orderNumber: string)` (`POST /api/Invoices/generate/{OrderNumber}`)
  - `getInvoicesReport(params)` (`GET /api/reports/invoices`)

- [x] **Step 5: Create `src/services/brands.service.ts`**
Implement:
  - `getAllBrands()` (`GET /api/Brands/all-brands`)
  - `getPopularBrands()` (`GET /api/Brands/get-popular`)
  - `getBrandById(id: number)` (`GET /api/Brands/brnadbyId/{id}`)

- [x] **Step 6: Verify build**
Run: `npm run build`
Expected: PASS with 0 errors.

- [x] **Step 7: Commit**
```bash
git add src/services/active-ingredients.service.ts src/services/balances.service.ts src/services/returns.service.ts src/services/invoices.service.ts src/services/brands.service.ts
git commit -m "feat(services): implement active ingredients, balances, returns, invoices, and brands services"
```

---

### Task 4: Integrate All Services into Central Barrel & Unified Facade

**Files:**
- Modify: `src/services/index.ts`
- Modify: `src/services/api.ts`

- [x] **Step 1: Update `src/services/index.ts`**
Export all new services:
  - `export * from './active-ingredients.service';`
  - `export * from './balances.service';`
  - `export * from './returns.service';`
  - `export * from './invoices.service';`
  - `export * from './brands.service';`

- [x] **Step 2: Update `src/services/api.ts`**
Add delegated methods to `DrugzaService` for:
  - Active Ingredients search and lookup
  - Brands fetching
  - User Balance & Transactions
  - Invoices lookup
  - Return Orders management

- [x] **Step 3: Verify build**
Run: `npm run build`
Expected: PASS with 0 errors.

- [x] **Step 4: Commit**
```bash
git add src/services/index.ts src/services/api.ts
git commit -m "feat(services): expose all Swagger-aligned services in barrel and DrugzaService facade"
```

---

### Task 5: Final Validation & Health Check

- [x] **Step 1: Run comprehensive TypeScript and build validation**
Run: `npm run build`
Expected: Clean build with 0 errors, all chunks generated properly.

- [x] **Step 2: Verify git status and clean working tree**
Run: `git status`
Expected: All modifications committed and consistent.
