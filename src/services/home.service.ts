import { apiClient, getImageUrl } from './client';
import type { Product, Category, Supplier } from '@/types';
import { productsService, mapBackendProduct } from './products.service';
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

function hasAuthToken(): boolean {
  return Boolean(localStorage.getItem('drugza_token') || sessionStorage.getItem('drugza_token'));
}

function extractHomeProducts(payload: Record<string, unknown> | null): Product[] {
  if (!payload) return [];
  for (const key of ['products', 'homeProducts', 'bestSellers', 'productList', 'items']) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.map(mapBackendProduct).filter(p => Boolean(p.id && p.name));
    }
  }
  return [];
}

async function fetchHomeComposite(): Promise<HomeData> {
  const [homeRes, productsRes, flashRes] = await Promise.allSettled([
    apiClient.get<Pick<BackendHomeDataResponse, 'banners' | 'categories' | 'providers'>>('/api/Home/GetHome', {
      headers: { 'X-Silent-Loading': 'true' }
    }),
    productsService.getProductsPage({ page: 1, size: 10 }),
    productsService.getFlashSaleProducts()
  ]);

  const home = homeRes.status === 'fulfilled' ? homeRes.value.data : null;
  const products = productsRes.status === 'fulfilled' ? productsRes.value.items : [];
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

    brands: null,

    specialOffersone: null,
    specialOfferstwo: null,

    flashSales: flashSales.length > 0 ? flashSales : null,

    businessName: null
  };
}

async function fetchHomeProductData(): Promise<HomeData | null> {
  if (!hasAuthToken()) return null;

  try {
    const res = await apiClient.get<Record<string, any>>('/api/Home/GetHomeProduct', {
      headers: { 'X-Silent-Loading': 'true' }
    });
    const payload = res.data;
    if (!payload || typeof payload !== 'object') return null;

    const banners = Array.isArray(payload.banners) ? payload.banners.map(mapBanner) : [];
    const categories = Array.isArray(payload.categories) ? payload.categories.map(mapCategory) : [];
    const providers = Array.isArray(payload.providers)
      ? payload.providers.map(mapBackendProviderToSupplier)
      : [];
    const products = extractHomeProducts(payload);
    const flashSales = Array.isArray(payload.flashSales)
      ? payload.flashSales.map((p: any) => {
          const mapped = mapBackendProduct(p);
          mapped.isFlashSale = true;
          return mapped;
        }).filter((p: Product) => Boolean(p.id && p.name))
      : [];

    if (
      banners.length === 0 &&
      categories.length === 0 &&
      providers.length === 0 &&
      products.length === 0 &&
      flashSales.length === 0
    ) {
      return null;
    }

    return {
      banners: banners.length > 0 ? banners : null,
      categories: categories.length > 0 ? categories : null,
      products: products.length > 0 ? products : null,
      providers: providers.length > 0 ? providers : null,
      brands: null,
      specialOffersone: null,
      specialOfferstwo: null,
      flashSales: flashSales.length > 0 ? flashSales : null,
      businessName: null
    };
  } catch {
    return null;
  }
}

function mergeHomeData(primary: HomeData, fallback: HomeData): HomeData {
  return {
    banners: primary.banners ?? fallback.banners,
    categories: primary.categories ?? fallback.categories,
    products: primary.products ?? fallback.products,
    providers: primary.providers ?? fallback.providers,
    brands: primary.brands ?? fallback.brands,
    specialOffersone: primary.specialOffersone ?? fallback.specialOffersone,
    specialOfferstwo: primary.specialOfferstwo ?? fallback.specialOfferstwo,
    flashSales: primary.flashSales ?? fallback.flashSales,
    businessName: primary.businessName ?? fallback.businessName
  };
}

export const homeService = {
  /**
   * Home payload. Authenticated visitors get /api/Home/GetHomeProduct as the
   * primary source (complete home payload); guests and any missing sections
   * fall back to the public composite endpoints.
   * Cached 2 minutes with in-flight deduplication.
   */
  async getHome(force = false): Promise<HomeData> {
    return cachedRequest(
      'home_composite_data',
      async () => {
        const primary = await fetchHomeProductData();
        if (primary) {
          const hasEverything =
            primary.banners && primary.categories && primary.providers && primary.products;
          if (hasEverything) {
            if (!primary.flashSales) {
              primary.flashSales = await productsService.getFlashSaleProducts();
            }
            return primary.flashSales && primary.flashSales.length > 0
              ? primary
              : { ...primary, flashSales: null };
          }

          const fallback = await fetchHomeComposite();
          return mergeHomeData(primary, fallback);
        }

        return fetchHomeComposite();
      },
      { ttlMs: 2 * 60 * 1000, force }
    );
  }
};
