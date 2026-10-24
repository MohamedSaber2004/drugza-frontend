# Delivery Address GPS Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable GPS coordinates (latitude/longitude) capture, storage, and direct Google Maps navigation for delivery addresses.

**Architecture:** Extend the Address type and API service layer to carry lat/lng, wire through useAuth composable, add geolocation button and Google Maps redirect links with modern UI feedback in AddressesView.vue.

**Tech Stack:** Vue 3, TypeScript, Lucide Icons, Browser Geolocation API.

---

### Task 1: Update Address Interface & Service Mapping
**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/address.service.ts`

- [x] **Step 1: Update Address interface in `src/types/index.ts`**
  Add `latitude?: number | null;` and `longitude?: number | null;` to the `Address` interface.

- [x] **Step 2: Update `mapBackendAddress` and methods in `src/services/address.service.ts`**
  Map `latitude` and `longitude` in `mapBackendAddress`. Ensure `createAddress` passes `data.latitude` and `data.longitude` properly, and `updateAddress` supports them.

---

### Task 2: Update useAuth Composable
**Files:**
- Modify: `src/composables/useAuth.ts`

- [x] **Step 1: Update `addAddress` in `src/composables/useAuth.ts`**
  Extract `latitude` and `longitude` from `newAddr`, pass to `addressService.createAddress`, and preserve in fallback objects.

- [x] **Step 2: Update `updateAddress` in `src/composables/useAuth.ts`**
  Pass `latitude` and `longitude` to `addressService.updateAddress` and keep in local state.

---

### Task 3: Localization Keys
**Files:**
- Modify: `src/locales/ar.ts`
- Modify: `src/locales/en.ts`

- [x] **Step 1: Add translation keys for map and GPS actions**
  Add `viewOnMap`, `detectLocation`, `locationDetected`, `detectingLocation`, `locationPermissionDenied`, `previewOnMap` to both Arabic and English dictionaries.

---

### Task 4: UI Updates in AddressesView.vue
**Files:**
- Modify: `src/views/AddressesView.vue`

- [x] **Step 1: Add Map Action to Address Card**
  Add a "View on Map" / "عرض على الخريطة" button that opens `https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`.

- [x] **Step 2: Add GPS Detect Button & State in Add/Edit Modal**
  Add geolocation trigger `navigator.geolocation.getCurrentPosition`, coordinate preview badge, and link to test location on Google Maps before saving.

- [x] **Step 3: Add Styles for Location Actions & Badges**
  Add elegant styles matching the existing Drugza design system.

---

### Task 5: Verification & Quality Check
- [x] **Step 1: Run vue-tsc type checking**
  Execute `npx vue-tsc --noEmit` to ensure zero compilation or type errors.
