import { apiClient, getImageUrl } from './client';
import type { Product, Category, Supplier } from '@/types';
import { productsService } from './products.service';
import { brandsService } from './brands.service';
import { getProviderProductCount, getCategoryProductCount } from '@/data/catalogStats';
import { cachedRequest } from '@/utils/cache';

export interface BackendHomeBannerDto {
  id: string;
  imageName?: string;
  link?: string;
  order?: number;
  imageFile?: string | null;
}

export interface BackendHomeCategoryDto {
  id: string;
  name: string;
  arabicName?: string;
  imageFile?: string | null;
}

export interface BackendHomeProviderDto {
  id: string;
  bussinesName?: string;
  userName?: string;
  email?: string;
  isAvailableNow?: boolean;
  profileImage?: string;
}

export interface BackendHomeDataResponse {
  banners: BackendHomeBannerDto[] | null;
  categories: BackendHomeCategoryDto[] | null;
  providers: BackendHomeProviderDto[] | null;
}

export interface HomeBanner {
  id: string;
  imageName: string;
  link?: string;
  order: number;
}

export interface HomeBrand {
  id: number | string;
  name: string;
  arabicName?: string;
  imagePath: string;
  isPopular: boolean;
}

export interface HomeSpecialOffer {
  id: number | string;
  imagePath: string;
  sectionNum?: number | null;
  link?: string;
}

export interface HomeData {
  banners: HomeBanner[] | null;
  categories: Category[] | null;
  products: Product[] | null;
  providers: Supplier[] | null;
  brands: HomeBrand[] | null;
  specialOffersone: HomeSpecialOffer[] | null;
  specialOfferstwo: HomeSpecialOffer[] | null;
  flashSales: Product[] | null;
  businessName?: string | null;
}

function mapBanner(b: BackendHomeBannerDto, idx: number): HomeBanner {
  return {
    id: b.id || `banner-${idx}`,
    imageName: getImageUrl(b.imageName || b.imageFile, 'banner'),
    link: b.link || '',
    order: b.order ?? idx + 1
  };
}

function mapCategory(c: BackendHomeCategoryDto): Category {
  return {
    id: c.id,
    name: c.name || '',
    arabicName: c.arabicName?.trim() || undefined,
    description: '',
    imageName: getImageUrl(c.imageFile, 'category'),
    itemCount: (c as any).itemCount || (c as any).productsCount || getCategoryProductCount(c.id)
  };
}

export function mapBackendProviderToSupplier(p: BackendHomeProviderDto): Supplier {
  const name = p.bussinesName?.trim() || p.userName || '';
  return {
    id: p.id,
    businessName: name,
    arabicName: p.bussinesName?.trim() || undefined,
    email: p.email || '',
    profileImage: getImageUrl(p.profileImage, 'provider'),
    isAvailableNow: p.isAvailableNow ?? false,
    minOrder: (p as any).minOrder || 0,
    rating: (p as any).rating,
    deliverySpeed: (p as any).deliverySpeed,
    location: (p as any).location || (p as any).addresses?.[0]?.addressLine || '',
    itemsCount: (p as any).itemsCount || (p as any).productCount || getProviderProductCount(p.id)
  };
}

export const homeService = {
  /**
   * Public home payload composed from endpoints that do not require authentication:
   * GET /api/Home/GetHome, GET /api/Products/GetProducts, GET /api/Brands/get-popular,
   * GET /api/ProductPrices/flash-sale-dashbourd
   * Cached 2 minutes with in-flight deduplication.
   */
  async getHome(force = false): Promise<HomeData> {
    return cachedRequest(
      'home_composite_data',
      async () => {
        const [homeRes, productsRes, brandsRes, flashRes] = await Promise.allSettled([
          apiClient.get<Pick<BackendHomeDataResponse, 'banners' | 'categories' | 'providers'>>('/api/Home/GetHome', {
            headers: { 'X-Silent-Loading': 'true' }
          }),
          productsService.getProductsPage({ page: 1, size: 10 }),
          brandsService.getPopularBrands(),
          productsService.getFlashSaleProducts()
        ]);

        const home = homeRes.status === 'fulfilled' ? homeRes.value.data : null;
        const products = productsRes.status === 'fulfilled' ? productsRes.value.items : [];
        const brands = brandsRes.status === 'fulfilled' ? brandsRes.value : [];
        const flashSales = flashRes.status === 'fulfilled' ? flashRes.value : [];

        return {
          banners:
            home && Array.isArray(home.banners) && home.banners.length > 0
              ? home.banners.map(mapBanner)
              : null,

          categories:
            home && Array.isArray(home.categories) && home.categories.length > 0
              ? home.categories.map(mapCategory)
              : null,

          products: products.length > 0 ? products : null,

          providers:
            home && Array.isArray(home.providers) && home.providers.length > 0
              ? home.providers.map(mapBackendProviderToSupplier)
              : null,

          brands:
            brands.length > 0
              ? brands.map((b) => ({
                  id: b.id,
                  name: b.name,
                  arabicName: b.arName,
                  imagePath: getImageUrl(b.imagePath, 'banner'),
                  isPopular: b.isPopular ?? false
                }))
              : null,

          specialOffersone: null,
          specialOfferstwo: null,

          flashSales: flashSales.length > 0 ? flashSales : null,

          businessName: null
        };
      },
      { ttlMs: 2 * 60 * 1000, force }
    );
  }
};
