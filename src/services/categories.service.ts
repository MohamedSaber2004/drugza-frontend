import { apiClient, getImageUrl } from './client';
import type { Category, Supplier } from '@/types';
import { getCategoryProductCount } from '@/data/catalogStats';
import { cachedRequest } from '@/utils/cache';

export interface BackendCategoryDto {
  id: string;
  name: string;
  pref?: string;
  description?: string;
  companyPercentage?: number;
  orderNum?: number;
  arabicName?: string;
  imageName?: string;
}

export interface BackendCategoryProviderDto {
  inventoryId: string;
  bussinesName?: string;
  email?: string;
  addresses?: string;
  phoneNumber?: string;
  isAvailableNow?: boolean;
}

export const categoriesService = {
  /**
   * GET /api/Categories?lang=1 (Cached 5 minutes + in-flight deduplicated)
   */
  async getCategories(lang = 1, force = false): Promise<Category[]> {
    return cachedRequest(
      `categories_lang_${lang}`,
      async () => {
        const res = await apiClient.get<BackendCategoryDto[]>('/api/Categories', {
          params: { lang }
        });
        const items = Array.isArray(res.data) ? res.data : [];
        return items.map((c) => ({
          id: c.id,
          name: c.name || '',
          arabicName: c.arabicName?.trim() || undefined,
          description: c.description || c.pref || '',
          imageName: getImageUrl(c.imageName, 'category'),
          itemCount: (c as any).itemCount || (c as any).productsCount || getCategoryProductCount(c.id)
        }));
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  },

  /**
   * GET /api/Categories/inventory/{inventoryUserId}/available-product-categories
   * Categories actually stocked by one provider. (Cached 5 minutes)
   */
  async getProviderAvailableCategories(inventoryUserId: string, force = false): Promise<Category[]> {
    return cachedRequest(
      `prov_avail_cats_${inventoryUserId}`,
      async () => {
        const res = await apiClient.get<BackendCategoryDto[]>(
          `/api/Categories/inventory/${inventoryUserId}/available-product-categories`
        );
        const items = Array.isArray(res.data) ? res.data : [];
        return items.map((c) => ({
          id: c.id,
          name: c.name || '',
          arabicName: c.arabicName?.trim() || undefined,
          description: c.description || c.pref || ''
        }));
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  },

  /**
   * GET /api/Categories/{id}?lang=1 (Cached 5 minutes)
   */
  async getCategoryById(id: string, lang = 1, force = false): Promise<Category | null> {
    return cachedRequest(
      `category_by_id_${id}_${lang}`,
      async () => {
        const res = await apiClient.get<BackendCategoryDto>(`/api/Categories/${id}`, {
          params: { lang }
        });
        if (!res.data) return null;
        const c = res.data;
        return {
          id: c.id,
          name: c.name,
          arabicName: c.arabicName?.trim() || undefined,
          description: c.description || c.pref || '',
          imageName: getImageUrl(c.imageName, 'category')
        };
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  },

  /**
   * GET /api/Categories/inventories-bycategory/{catId} (Cached 3 minutes)
   */
  async getCategoryProviders(catId: string, force = false): Promise<Supplier[]> {
    return cachedRequest(
      `cat_providers_${catId}`,
      async () => {
        const res = await apiClient.get<BackendCategoryProviderDto[]>(`/api/Categories/inventories-bycategory/${catId}`);
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map((p) => ({
          id: p.inventoryId,
          businessName: p.bussinesName?.trim() || '',
          email: p.email || '',
          phoneNumber: p.phoneNumber || '',
          isAvailableNow: p.isAvailableNow ?? false,
          location: p.addresses || '',
          profileImage: undefined
        }));
      },
      { ttlMs: 3 * 60 * 1000, force }
    );
  }
};
