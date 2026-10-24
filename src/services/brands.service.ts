import { apiClient, getImageUrl } from './client';
import type { Brand } from '@/types';
import { cachedRequest } from '@/utils/cache';

export interface BackendBrandDto {
  id: number;
  name?: string;
  brandName?: string;
  brandArName?: string;
  arName?: string;
  imagePath?: string;
  isPopular?: boolean;
}

function mapBackendBrand(b: BackendBrandDto): Brand {
  return {
    id: b.id,
    name: b.name || b.brandName || 'Brand',
    arName: b.arName || b.brandArName?.trim() || undefined,
    imagePath: getImageUrl(b.imagePath),
    isPopular: b.isPopular ?? false
  };
}

export const brandsService = {
  /**
   * GET /api/Brands/all-brands (Cached 5 minutes)
   */
  async getAllBrands(force = false): Promise<Brand[]> {
    return cachedRequest(
      'all_brands_list',
      async () => {
        const res = await apiClient.get<BackendBrandDto[]>('/api/Brands/all-brands');
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map(mapBackendBrand);
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  },

  /**
   * GET /api/Brands/get-popular (Cached 5 minutes)
   */
  async getPopularBrands(force = false): Promise<Brand[]> {
    return cachedRequest(
      'popular_brands_list',
      async () => {
        const res = await apiClient.get<BackendBrandDto[]>('/api/Brands/get-popular');
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map(mapBackendBrand);
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  },

  /**
   * GET /api/Brands/brnadbyId/{id}
   * Note backend route typo: 'brnadbyId'
   */
  async getBrandById(id: number, force = false): Promise<Brand | null> {
    return cachedRequest(
      `brand_by_id_${id}`,
      async () => {
        const res = await apiClient.get<BackendBrandDto>(`/api/Brands/brnadbyId/${id}`);
        if (!res.data) return null;
        return mapBackendBrand(res.data);
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  }
};

