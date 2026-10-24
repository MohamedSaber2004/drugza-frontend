/**
 * High-definition SVG data URIs for robust, offline-capable placeholders.
 * These will NEVER fail to load, regardless of network or corrupt backend URLs.
 */

// 1. Medicine / Product Placeholder (Teal/Navy Theme with Pharmaceutical Capsules & Cross)
export const PRODUCT_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0F9FF"/>
      <stop offset="100%" stop-color="#E0F2FE"/>
    </linearGradient>
    <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14B8A6"/>
      <stop offset="100%" stop-color="#0F766E"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3CE79"/>
      <stop offset="100%" stop-color="#EAB308"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="24" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="110" fill="#FFFFFF" opacity="0.8"/>
  <!-- Bottle Shape -->
  <path d="M165 140 H235 V155 H165 Z" fill="#94A3B8"/>
  <rect x="175" y="125" width="50" height="15" rx="4" fill="#64748B"/>
  <rect x="150" y="155" width="100" height="130" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
  <!-- Label with Medical Cross -->
  <rect x="165" y="185" width="70" height="70" rx="8" fill="#F0FDFA"/>
  <path d="M195 200 H205 V240 H195 Z" fill="url(#primary)"/>
  <path d="M180 215 H220 V225 H180 Z" fill="url(#primary)"/>
  <!-- Floating Capsule -->
  <g transform="translate(240, 240) rotate(35)">
    <rect x="-24" y="-12" width="24" height="24" rx="12" fill="url(#primary)"/>
    <rect x="0" y="-12" width="24" height="24" rx="12" fill="url(#accent)"/>
    <rect x="-24" y="-12" width="48" height="24" rx="12" fill="none" stroke="#FFFFFF" stroke-width="2"/>
  </g>
</svg>
`)}`;

// 2. Provider / Distributor Warehouse Placeholder
export const PROVIDER_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#pbg)"/>
  <!-- Building -->
  <path d="M50 160 V75 L100 45 L150 75 V160 H50 Z" fill="#0B2B4D"/>
  <rect x="70" y="90" width="20" height="20" rx="3" fill="#14B8A6"/>
  <rect x="110" y="90" width="20" height="20" rx="3" fill="#14B8A6"/>
  <rect x="70" y="125" width="20" height="20" rx="3" fill="#F3CE79"/>
  <rect x="110" y="125" width="20" height="20" rx="3" fill="#F3CE79"/>
  <path d="M85 160 V140 H115 V160 Z" fill="#38BDF8"/>
</svg>
`)}`;

// 3. Category Placeholder
export const CATEGORY_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#F0FDFA"/>
  <circle cx="50" cy="50" r="40" fill="#CCFBF1"/>
  <path d="M47 30 H53 V70 H47 Z" fill="#0F766E"/>
  <path d="M30 47 H70 V53 H30 Z" fill="#0F766E"/>
</svg>
`)}`;

// 4. Banner Placeholder
export const BANNER_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 450" width="100%" height="100%">
  <defs>
    <linearGradient id="bbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2B4D"/>
      <stop offset="100%" stop-color="#07192C"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="450" fill="url(#bbg)"/>
  <circle cx="950" cy="225" r="280" fill="#14B8A6" opacity="0.12"/>
  <circle cx="200" cy="225" r="160" fill="#F3CE79" opacity="0.08"/>
  <text x="120" y="210" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800">Drugza Wholesale</text>
  <text x="120" y="265" fill="#14B8A6" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600">Your Trusted Egyptian Pharmacy Marketplace</text>
</svg>
`)}`;

// 5. User / Pharmacist Avatar Placeholder
export const USER_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="userBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EBF4F9"/>
      <stop offset="100%" stop-color="#D5EBF6"/>
    </linearGradient>
    <linearGradient id="userShape" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12496B"/>
      <stop offset="100%" stop-color="#0A2D42"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#userBg)"/>
  <circle cx="100" cy="74" r="32" fill="url(#userShape)"/>
  <path d="M48 166 C48 128, 70 118, 100 118 C130 118, 152 128, 152 166 C152 188, 136 196, 100 196 C64 196, 48 188, 48 166 Z" fill="url(#userShape)"/>
  <path d="M92 118 L100 134 L108 118" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
</svg>
`)}`;

export function getPlaceholder(type: 'product' | 'category' | 'provider' | 'banner' | 'user' = 'product'): string {
  switch (type) {
    case 'category':
      return CATEGORY_PLACEHOLDER;
    case 'provider':
      return PROVIDER_PLACEHOLDER;
    case 'banner':
      return BANNER_PLACEHOLDER;
    case 'user':
      return USER_PLACEHOLDER;
    case 'product':
    default:
      return PRODUCT_PLACEHOLDER;
  }
}

const failedImageUrls = new Set<string>();

export function markImageFailed(url?: string | null) {
  if (url) failedImageUrls.add(url);
}

export function isImageFailed(url?: string | null): boolean {
  if (!url) return false;
  return failedImageUrls.has(url);
}

/**
 * Global image error event handler
 */
export function onImageError(event: Event, type: 'product' | 'category' | 'provider' | 'banner' | 'user' = 'product') {
  const target = event.target as HTMLImageElement;
  if (!target) return;
  if (target.src) {
    failedImageUrls.add(target.src);
  }
  const fallback = getPlaceholder(type);
  if (target.src !== fallback) {
    // Avoid triggering error loops if fallback itself ever has an issue
    target.onerror = null;
    target.src = fallback;
  }
}

