import { apiClient, getImageUrl } from './client';
import type { Product, ProductSupplierPrice } from '@/types';

export interface BackendProductDto {
  id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  arabicName?: string;
  preef?: string;
  arabicPreef?: string;
  description?: string;
  arabicDescription?: string;
  price?: number;
  salesPrice?: number;
  effectiveSalesPrice?: number;
  discountRate?: number;
  stockQuantity?: number;
  categoryId?: string;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  imageName?: string;
  images?: string[];
  productImageUrl?: string;
  isPopular?: boolean;
  isPupolar?: boolean;
  isFlashSaleActive?: boolean;
  inventoryId?: string;
  inventoryName?: string;
  productPriceId?: string;
  priceId?: string;
  isFavorite?: boolean;
}

export interface BackendBestPriceDto {
  productId: string;
  priceId: string;
  productName: string;
  productArabicName?: string;
  productDescription?: string;
  productArabicDescription?: string;
  productPreef?: string;
  productArabicPreef?: string;
  productImageUrl?: string;
  bestSalesPrice: number;
  inventoryUser?: string;
  quantity?: number;
  discount?: number;
}

export function mapBackendProduct(p: BackendProductDto): Product {
  const id = p.productId || p.id || `prod-${Date.now()}`;
  const name = p.productName || p.name || 'Pharmaceutical Item';
  const effectivePrice = p.effectiveSalesPrice ?? p.salesPrice ?? p.price ?? 25;
  const originalPrice = p.salesPrice ?? (effectivePrice ? +(effectivePrice * 1.15).toFixed(2) : 30);
  const discountRate = p.discountRate ?? (originalPrice > effectivePrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0);

  const rawImg = p.productImageUrl || (p.images && p.images[0]) || p.imageName;
  const image = getImageUrl(rawImg);

  return {
    id,
    name,
    arabicName: p.arabicName?.trim() || undefined,
    strength: p.preef || p.arabicPreef || 'Standard Dosage',
    form: 'Tablet',
    packSize: p.preef || 'Box',
    price: effectivePrice,
    originalPrice,
    discountRate,
    brandId: p.brandId,
    brandName: p.brandName || 'Authorized Manufacturer',
    categoryId: p.categoryId,
    categoryName: p.categoryName || 'Medical Category',
    activeIngredient: p.preef || 'Active Pharmaceutical Ingredient',
    image,
    inStock: (p.stockQuantity ?? 1) > 0,
    stockQuantity: p.stockQuantity ?? 50,
    minOrder: 1,
    description: p.description || p.arabicDescription || p.preef || '',
    suppliersCount: 3,
    isPopular: p.isPopular ?? p.isPupolar ?? true,
    isFlashSale: p.isFlashSaleActive ?? false
  };
}

export const productsService = {
  /**
   * GET /api/Products/GetProducts
   */
  async getProducts(params?: { lang?: number; search?: string; page?: number; size?: number }): Promise<Product[]> {
    const res = await apiClient.get('/api/Products/GetProducts', {
      params: {
        lang: params?.lang ?? 1,
        page: params?.page ?? 0,
        size: params?.size ?? 50,
        search: params?.search
      }
    });
    const list = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/{id}
   */
  async getProductById(id: string, lang = 1): Promise<Product | null> {
    const res = await apiClient.get(`/api/Products/${id}`, { params: { lang } });
    if (!res.data) return null;
    return mapBackendProduct(res.data);
  },

  /**
   * GET /api/Products/popularproducts or /api/Products/popularproducts/{categoryId}
   */
  async getPopularProducts(categoryId?: string): Promise<Product[]> {
    const url = categoryId
      ? `/api/Products/popularproducts/${categoryId}`
      : '/api/Products/popularproducts';
    const res = await apiClient.get<BackendProductDto[]>(url);
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/by-category/{categoryId}
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const res = await apiClient.get(`/api/Products/by-category/${categoryId}`);
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/ProductPrices/by-inventory-user/{inventoryId}
   */
  async getProductsByProvider(inventoryId: string, search?: string): Promise<Product[]> {
    try {
      const res = await apiClient.get(`/api/ProductPrices/by-inventory-user/${inventoryId}`, {
        params: { search, pageSize: 50 }
      });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.items || []);
      if (list.length > 0) {
        return list.map(mapBackendProduct);
      }
    } catch {
      // Fallback to secondary endpoint
    }

    const res2 = await apiClient.get('/api/Products/GetProducts-byProvider', {
      params: { inventoryId, search }
    });
    const list2 = Array.isArray(res2.data) ? res2.data : (res2.data?.data || []);
    return list2.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/search-product
   */
  async searchProducts(search: string, page = 0, pageSize = 30): Promise<Product[]> {
    const res = await apiClient.get('/api/Products/search-product', {
      params: { search, page, pageSize }
    });
    const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/ProductPrices/best-prices
   */
  async getBestPrices(page = 1, size = 20): Promise<Product[]> {
    const res = await apiClient.get<BackendBestPriceDto[]>('/api/ProductPrices/best-prices', {
      params: { page, size }
    });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((item) => {
      const invName = typeof item.inventoryUser === 'object' && item.inventoryUser !== null
        ? ((item.inventoryUser as any).bussinesName || (item.inventoryUser as any).fullName || 'Authorized Supplier')
        : (item.inventoryUser || 'Authorized Supplier');

      return {
        id: item.productId,
        name: item.productName,
        arabicName: item.productArabicName?.trim() || undefined,
        strength: item.productPreef || 'Standard Dosage',
        form: 'Tablet',
        packSize: item.productPreef || 'Box',
        price: item.bestSalesPrice,
        originalPrice: item.discount ? +(item.bestSalesPrice / (1 - item.discount / 100)).toFixed(2) : item.bestSalesPrice,
        discountRate: item.discount || 0,
        image: getImageUrl(item.productImageUrl),
        inStock: (item.quantity ?? 1) > 0,
        stockQuantity: item.quantity || 100,
        description: item.productDescription || item.productArabicDescription || '',
        brandName: invName
      };
    });
  },

  /**
   * GET /api/ProductPrices/available-by-product/{productId}
   */
  async getSupplierPricesForProduct(productId: string): Promise<ProductSupplierPrice[]> {
    try {
      const res = await apiClient.get(`/api/ProductPrices/available-by-product/${productId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        return list.map((p: any) => {
          const invName = typeof p.inventoryUser === 'object' && p.inventoryUser !== null
            ? (p.inventoryUser.bussinesName || p.inventoryUser.fullName || 'Authorized Distributor')
            : (p.inventoryName || p.inventoryUser || 'Authorized Distributor');

          return {
            id: p.priceId || p.productPriceId || p.id,
            inventoryUserId: p.inventoryUserId || p.inventoryUser?.id || p.inventoryId,
            inventoryName: invName,
            salesPrice: p.salesPrice ?? p.effectiveSalesPrice ?? 35,
            discountRate: p.discountRate ?? p.discount ?? 0,
            effectiveSalesPrice: p.effectiveSalesPrice ?? p.salesPrice ?? 35,
            stockQuantity: p.stockQuantity ?? p.quantity ?? 50,
            maxQuantity: p.maxQuantity ?? 500,
            minOrder: p.minOrder ?? 1,
            isFlashActive: p.isFlashSaleActive || false,
            deliveryTime: 'Same Day'
          };
        });
      }
    } catch {
      // Return empty if endpoint fails
    }
    return [];
  },

  /**
   * GET /api/ProductPrices/flash-sale
   */
  async getFlashSaleProducts(): Promise<Product[]> {
    try {
      const res = await apiClient.get('/api/ProductPrices/flash-sale');
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        return list.map(mapBackendProduct);
      }
    } catch {
      // Fallback
    }

    // Secondary: fetch popular products that have active flash sale
    const popular = await this.getPopularProducts();
    const flash = popular.filter(p => p.isFlashSale);
    return flash.length > 0 ? flash : popular.slice(0, 8);
  },

  /**
   * POST /api/Products/toggle-Favorite
   */
  async toggleFavorite(userId: string, productId: string, productPriceId?: string) {
    const res = await apiClient.post('/api/Products/toggle-Favorite', null, {
      params: { userId, productId, productPriceId }
    });
    return res.data;
  },

  /**
   * GET /api/Products/get-myFav-products
   */
  async getMyFavorites(): Promise<Product[]> {
    const res = await apiClient.get('/api/Products/get-myFav-products');
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/products-bybrand/{brandId}
   */
  async getProductsByBrand(brandId: number, page = 1, size = 20): Promise<Product[]> {
    const res = await apiClient.get(`/api/Products/products-bybrand/${brandId}`, {
      params: { page, size }
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/product-prices-with-data
   */
  async getProductPricesWithData(params?: {
    lang?: number;
    search?: string;
    page?: number;
    size?: number;
  }) {
    const res = await apiClient.get('/api/Products/product-prices-with-data', {
      params: {
        lang: params?.lang ?? 1,
        page: params?.page ?? 1,
        size: params?.size ?? 20,
        search: params?.search
      }
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/product-prices-with-data/{productId}
   */
  async getProductPricesWithDataById(productId: string) {
    const res = await apiClient.get(`/api/Products/product-prices-with-data/${productId}`);
    if (!res.data) return null;
    return mapBackendProduct(res.data);
  }
};
