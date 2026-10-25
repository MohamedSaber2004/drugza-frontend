import { ref, computed } from 'vue';
import type { Product } from '@/types';
import { productsService } from '@/services/products.service';
import { useToast } from './useToast';
import { useI18n } from './useI18n';

const FAVORITES_KEY = 'drugza_fav_ids';

const favoriteIds = ref<string[]>(
  localStorage.getItem(FAVORITES_KEY)
    ? JSON.parse(localStorage.getItem(FAVORITES_KEY)!)
    : []
);

const favoriteProducts = ref<Product[]>([]);
const isLoading = ref(false);
const hasFetchedOnce = ref(false);

/**
 * Extracts the user's authentic GUID from stored profile or JWT payload.
 */
export function getUserId(): string | null {
  try {
    const raw = localStorage.getItem('drugza_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.id && !u.id.startsWith('usr-')) {
        return u.id;
      }
    }

    const token = localStorage.getItem('drugza_token');
    if (token) {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const id =
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          payload.nameid ||
          payload.sub;
        if (id) return id;
      }
    }

    if (raw) {
      const u = JSON.parse(raw);
      return u.id || null;
    }
  } catch {
    //
  }
  return null;
}

export function useFavorites() {
  const toast = useToast();
  const { t } = useI18n();

  const favoritesCount = computed(() => favoriteIds.value.length);

  function persist() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds.value));
  }

  function isFavorite(productId: string): boolean {
    return favoriteIds.value.includes(productId);
  }

  /**
   * Fetches the user's real favorite list from GET /api/Products/get-myFav-products
   */
  async function fetchFavorites(force = false): Promise<Product[]> {
    const token = localStorage.getItem('drugza_token');
    if (!token) {
      favoriteProducts.value = [];
      favoriteIds.value = [];
      persist();
      return [];
    }

    if (hasFetchedOnce.value && !force && favoriteProducts.value.length > 0) {
      return favoriteProducts.value;
    }

    isLoading.value = true;
    try {
      const list = await productsService.getMyFavorites();
      favoriteProducts.value = list;
      favoriteIds.value = list.map(p => p.id).filter(Boolean);
      persist();
      hasFetchedOnce.value = true;
      return list;
    } catch (err) {
      console.warn('[useFavorites] Error fetching favorites from server:', err);
      return favoriteProducts.value;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Toggles product favorite state via POST /api/Products/toggle-Favorite
   * Query params: userId, productId, productPriceId
   */
  async function toggleFavorite(productId: string, productName?: string, productPriceId?: string): Promise<boolean> {
    const token = localStorage.getItem('drugza_token');
    const userId = getUserId();

    if (!token || !userId) {
      toast.error(t('favorites.loginRequired'));
      return false;
    }

    const wasFav = favoriteIds.value.includes(productId);
    const existingProduct = favoriteProducts.value.find(p => p.id === productId);

    // Optimistic UI update
    if (wasFav) {
      favoriteIds.value = favoriteIds.value.filter(id => id !== productId);
      favoriteProducts.value = favoriteProducts.value.filter(p => p.id !== productId);
    } else {
      if (!favoriteIds.value.includes(productId)) {
        favoriteIds.value.push(productId);
      }
    }
    persist();

    try {
      await productsService.toggleFavorite(userId, productId, productPriceId);

      if (wasFav) {
        toast.info(t('favorites.removedSuccess', { name: productName || t('favorites.defaultMedicine') }));
      } else {
        toast.success(t('favorites.addedSuccess', { name: productName || t('favorites.defaultMedicine') }));
      }

      return true;
    } catch (err: any) {
      // Rollback optimistic update
      if (wasFav) {
        if (!favoriteIds.value.includes(productId)) {
          favoriteIds.value.push(productId);
        }
        if (existingProduct && !favoriteProducts.value.some(p => p.id === productId)) {
          favoriteProducts.value.push(existingProduct);
        }
      } else {
        favoriteIds.value = favoriteIds.value.filter(id => id !== productId);
      }
      persist();

      const errMsg = err?.response?.data?.message || err?.message || t('favorites.tryAgain');
      toast.error(t('favorites.updateFailed', { error: errMsg }));
      return false;
    }
  }

  return {
    favoriteIds,
    favoriteProducts,
    favoritesCount,
    isLoading,
    isFavorite,
    fetchFavorites,
    toggleFavorite
  };
}
