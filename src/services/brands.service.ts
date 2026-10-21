import { apiClient, getImageUrl } from './client';
import type { Brand } from '@/types';

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
   * GET /api/Brands/all-brands
   */
  async getAllBrands(): Promise<Brand[]> {
    const res = await apiClient.get<BackendBrandDto[]>('/api/Brands/all-brands');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapBackendBrand);
  },

  /**
   * GET /api/Brands/get-popular
   */
  async getPopularBrands(): Promise<Brand[]> {
    const res = await apiClient.get<BackendBrandDto[]>('/api/Brands/get-popular');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapBackendBrand);
  },

  /**
   * GET /api/Brands/brnadbyId/{id}
   * Note backend route typo: 'brnadbyId'
   */
  async getBrandById(id: number): Promise<Brand | null> {
    const res = await apiClient.get<BackendBrandDto>(`/api/Brands/brnadbyId/${id}`);
    if (!res.data) return null;
    return mapBackendBrand(res.data);
  }
};
