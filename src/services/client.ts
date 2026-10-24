import axios from 'axios';
import { getPlaceholder, isImageFailed } from '@/utils/placeholders';
import { loadingService } from '@/composables/useLoading';

export const API_BASE_URL = 'https://drugzaapi.runasp.net';

// Known non-existent backend image assets that return 404 from server
const KNOWN_MISSING_ASSETS = [
  '14538b54f074'
];

export function getImageUrl(path?: string | null, type: 'product' | 'category' | 'provider' | 'banner' = 'product'): string {
  if (!path || typeof path !== 'string') {
    return getPlaceholder(type);
  }
  const clean = path.trim();
  if (
    clean === '' ||
    clean.endsWith('/') ||
    clean.endsWith('/categories') ||
    clean.endsWith('/products') ||
    clean.endsWith('/banners') ||
    clean === 'https://drugzaapi.runasp.net/Uploads/categories/' ||
    clean === 'https://drugzaapi.runasp.net/Uploads/products/' ||
    clean === 'https://drugzaapi.runasp.net/Uploads/banners/' ||
    clean === 'null' ||
    clean === 'undefined' ||
    KNOWN_MISSING_ASSETS.some((missing) => clean.includes(missing)) ||
    isImageFailed(clean)
  ) {
    return getPlaceholder(type);
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('/api/files/') || clean.startsWith('api/files/')) {
    return `${API_BASE_URL}/${clean.replace(/^\//, '')}`;
  }
  if (clean.startsWith('/Uploads/') || clean.startsWith('Uploads/')) {
    return `${API_BASE_URL}/${clean.replace(/^\//, '')}`;
  }
  return `${API_BASE_URL}/api/files/${clean.replace(/^\//, '')}`;
}


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Accept': 'application/json',
  }
});

// Attach JWT token from localStorage or sessionStorage if present & trigger loading
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('drugza_token') || sessionStorage.getItem('drugza_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Trigger global API loading indicator unless explicitly marked silent
  const isSilent = config.headers?.['X-Silent-Loading'] === 'true' || config.headers?.['X-Silent-Loading'] === true;
  if (!isSilent) {
    loadingService.startApiRequest();
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auto-handle 401 Unauthorized & complete loading
apiClient.interceptors.response.use(
  (response) => {
    const isSilent = response.config?.headers?.['X-Silent-Loading'] === 'true' || response.config?.headers?.['X-Silent-Loading'] === true;
    if (!isSilent) {
      loadingService.finishApiRequest();
    }
    if (typeof response.data === 'string' && (response.data.startsWith('{') || response.data.startsWith('['))) {
      try {
        response.data = JSON.parse(response.data);
      } catch {
        // keep response as-is
      }
    }
    return response;
  },
  (error) => {
    const isSilent = error.config?.headers?.['X-Silent-Loading'] === 'true' || error.config?.headers?.['X-Silent-Loading'] === true;
    if (!isSilent) {
      loadingService.finishApiRequest();
    }

    const hadAuthorization = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadAuthorization) {
      localStorage.removeItem('drugza_token');
      localStorage.removeItem('drugza_user');
      sessionStorage.removeItem('drugza_token');
      sessionStorage.removeItem('drugza_user');
      window.dispatchEvent(new Event('drugza:cart-reset'));
      
      // Only redirect if the user is on a route that strictly requires authorization
      const protectedPaths = [
        '/checkout',
        '/orders',
        '/profile',
        '/addresses',
        '/favorites'
      ];
      const isProtected = protectedPaths.some(p => window.location.pathname.startsWith(p));
      if (isProtected) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);
