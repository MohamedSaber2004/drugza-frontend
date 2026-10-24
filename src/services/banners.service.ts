import { apiClient, getImageUrl } from './client';
import { cachedRequest } from '@/utils/cache';

export interface BannerDto {
  id: string;
  imageName?: string;
  link?: string;
  order?: number;
}

export interface SpecialOfferDto {
  id: number;
  imagePath?: string;
  sectionNum?: number;
  link?: string;
}

export const bannersService = {
  /**
   * GET /api/Banners (Cached 5 minutes)
   */
  async getBanners(force = false): Promise<BannerDto[]> {
    return cachedRequest(
      'banners_list',
      async () => {
        const res = await apiClient.get<BannerDto[]>('/api/Banners');
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map(b => ({
          ...b,
          imageName: getImageUrl(b.imageName, 'banner')
        }));
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  },

  /**
   * GET /api/SpecialOffers/get-offers (Cached 5 minutes)
   */
  async getSpecialOffers(force = false): Promise<SpecialOfferDto[]> {
    return cachedRequest(
      'special_offers_list',
      async () => {
        const res = await apiClient.get<SpecialOfferDto[]>('/api/SpecialOffers/get-offers');
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map(o => ({
          ...o,
          imagePath: getImageUrl(o.imagePath)
        }));
      },
      { ttlMs: 5 * 60 * 1000, force }
    );
  }
};

