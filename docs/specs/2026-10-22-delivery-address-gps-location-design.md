# Delivery Address GPS Location & Navigation Specification

## Overview
Enable full support for delivery address coordinates (latitude & longitude) across the Drugza frontend store. Users can view and navigate to any pharmacy delivery branch directly via Google Maps, capture their live GPS location with one click during address creation/editing, and have coordinates persisted seamlessly through the backend API.

## Requirements & Scope

### 1. Data Model & Types
- **Address Type (`src/types/index.ts`)**: Add `latitude?: number | null` and `longitude?: number | null`.
- **Backend Mapping (`src/services/address.service.ts`)**:
  - `mapBackendAddress`: extract `latitude` and `longitude` from backend DTO.
  - `createAddress`: send `latitude` and `longitude` in payload.
  - `updateAddress`: send `latitude` and `longitude` in update payload.

### 2. State & Composable (`src/composables/useAuth.ts`)
- In `addAddress`: accept `latitude` and `longitude`, pass to service, preserve in local storage fallback.
- In `updateAddress`: accept and update `latitude` and `longitude`.

### 3. User Interface (`src/views/AddressesView.vue`)
- **Address Cards**:
  - Add a "View on Map" / "عرض على الخريطة" button on each address card.
  - Clicking opens `https://www.google.com/maps?q=${addr.latitude},${addr.longitude}` in a new tab.
  - Graceful fallback: If lat/long are not present, search by `cityName, areaName, streetAddress`.
- **Add/Edit Address Modal**:
  - GPS detection button "تحديد موقعي الحالي (GPS)" utilizing `navigator.geolocation.getCurrentPosition`.
  - Visual feedback for loading state ("جاري تحديد الإحداثيات...") and success badge with coordinates.
  - Link to preview the detected coordinates on Google Maps before saving.
  - Pre-fill existing coordinates when editing an address.

### 4. Localization (`src/locales/ar.ts` & `src/locales/en.ts`)
- Add keys for map view, GPS detection, permission states, and previews.
