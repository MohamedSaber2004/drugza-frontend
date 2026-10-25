import { apiClient, getImageUrl } from './client';
import type { Product, ProductSupplierPrice } from '@/types';
import { ceilPrice } from '@/utils/price';
import { cachedRequest } from '@/utils/cache';

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

const STRENGTH_RE =
  /(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*(?:mg|mcg|µg|ug|iu|%))(?:\s*\/\s*\d*\s*ml)?/i;
const PACK_RE =
  /(\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+)?\s*(?:tabs?|tablets?|caps?|capsules?|amp(?:oules?)?|sachets?|sticks?|pieces?|pcs|supp(?:ositories)?|gm|grams?|g|kg|ml|l))\b/i;
const PACK_AR_RE =
  /(\d+\s*(?:جم|جرام|مل|لتر|قرص|أقراص|اقراص|كبسولة|كبسولات|أمبول|امبول|أمبولة|امبولة|شريط|أشرطة|اكياس|أكياس|كيس|قطعة|قطع))/;

/** Strength lives in the product name (the API has no dedicated field). */
export function extractStrength(...names: (string | undefined)[]): string {
  for (const n of names) {
    const m = n?.match(STRENGTH_RE);
    if (m) return m[0].trim();
  }
  return '';
}

/** Pack size lives in the product name as a trailing quantity + unit. */
export function extractPackSize(...names: (string | undefined)[]): string {
  for (const n of names) {
    if (!n) continue;
    const strength = extractStrength(n);
    const rest = strength ? n.replace(strength, ' ') : n;
    const m = rest.match(PACK_RE) || rest.match(PACK_AR_RE);
    if (m) return m[0].trim();
  }
  return '';
}

export function mapBackendProduct(p: any): Product {
  const id = p.productId || p.id || '';
  const name = p.productName || p.name || '';
  const arabicName = (p.productArabicName || p.arabicName || p.arabicProductName || '').trim() || undefined;
  // Public API exposes the company under `preef`; `brandName` is a separate (usually empty) field.
  const manufacturer = (p.preef || p.arabicPreef || p.manufacturer || p.companyName || '').trim() || undefined;
  const brandName = (p.brandName || p.brand?.name || '').trim() || undefined;
  const activeIngredient = (
    p.activeIngredientName || p.activeIngerdient?.name || p.activeIngredient || ''
  ).trim();

  const priceRows = Array.isArray(p.prices) ? p.prices : [];
  const pricedRows = priceRows.filter((pr: any) => (pr.effectiveSalesPrice ?? pr.salesPrice ?? 0) > 0);
  const stockedRows = pricedRows.filter((pr: any) => (pr.stockQuantity ?? pr.quantity ?? 0) > 0);
  const pickCheapest = (rows: any[]) =>
    rows.reduce((best: any, pr: any) => {
      if (!best) return pr;
      const value = pr.effectiveSalesPrice ?? pr.salesPrice ?? 0;
      const bestValue = best.effectiveSalesPrice ?? best.salesPrice ?? 0;
      return value < bestValue ? pr : best;
    }, null);
  const bestPriceRow = pickCheapest(stockedRows) || pickCheapest(pricedRows);

  // Prices: `salesPrice` is the pre-discount list price; the effective price is what the buyer pays.
  const rawEffective =
    (p.effectiveSalesPrice && p.effectiveSalesPrice > 0 ? p.effectiveSalesPrice : null) ??
    (p.salesPrice && p.salesPrice > 0 ? p.salesPrice : null) ??
    (p.price && p.price > 0 ? p.price : null) ??
    bestPriceRow?.effectiveSalesPrice ??
    bestPriceRow?.salesPrice ??
    0;

  const effectivePrice = ceilPrice(rawEffective);
  const rowDiscount = p.discountRate ?? bestPriceRow?.discountRate ?? 0;
  let rawOriginal =
    p.priceBeforeFlashSale ?? bestPriceRow?.priceBeforeFlashSale ??
    p.salesPrice ?? bestPriceRow?.salesPrice ?? rawEffective;
  if (rowDiscount > 0 && rawOriginal <= rawEffective) {
    rawOriginal = rawEffective / (1 - rowDiscount / 100);
  }
  const originalPrice = ceilPrice(rawOriginal);
  const discountRate = rowDiscount || (originalPrice > effectivePrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0);

  // Images
  const rawImgs: string[] = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    rawImgs.push(...p.images);
  }
  if (p.productImageUrl) rawImgs.push(p.productImageUrl);
  if (p.imageName) rawImgs.push(p.imageName);
  if (p.image) rawImgs.push(p.image);

  const productImages = rawImgs.map(img => getImageUrl(img, 'product')).filter(Boolean);
  const image = productImages[0] || getImageUrl(null, 'product');

  // Dosage Form, Category & Route
  const categoryName = p.category?.name || p.categoryName || '';
  const categoryArabicName = p.category?.arabicName?.trim() || undefined;
  const form = (p.category?.description || p.category?.name || p.form || '').trim();
  const route = p.category?.pref || '';

  // Stock
  let stockQuantity = p.stockQuantity ?? 0;
  if (stockQuantity === 0 && Array.isArray(p.prices) && p.prices.length > 0) {
    stockQuantity = p.prices.reduce((sum: number, pr: any) => sum + (pr.stockQuantity ?? pr.quantity ?? 0), 0);
  }

  // Suppliers Count — ignore placeholder rows (0 stock, 0 price) some inventories return
  const suppliersCount =
    p.suppliersCount ||
    (priceRows.length > 0
      ? (stockedRows.length > 0 ? stockedRows.length : priceRows.length)
      : (Array.isArray(p.inventories) ? p.inventories.length : 0)) ||
    undefined;

  // Primary price row: cheapest stocked supplier so the shown provider is actually available
  const primaryPrice = bestPriceRow || priceRows[0];

  // Barcode / SKU
  const productCode = p.productCode || p.prices?.[0]?.productCode || undefined;

  // Description
  const description = p.description || p.arabicDescription || p.preef || '';
  const arabicDescription = (p.arabicDescription || p.arabicPreef || p.description || '').trim() || undefined;

  return {
    id,
    name,
    arabicName,
    strength: extractStrength(name, arabicName),
    form,
    route,
    packSize: extractPackSize(name, arabicName) || (productCode ? `SKU: ${productCode}` : ''),
    price: effectivePrice,
    originalPrice,
    discountRate,
    brandId: p.brandId ?? p.brand?.id,
    brandName,
    manufacturer,
    categoryId: p.categoryId || p.category?.id,
    categoryName,
    categoryArabicName,
    activeIngredient,
    image,
    productImages: productImages.length > 0 ? productImages : [image],
    inStock: stockQuantity > 0,
    stockQuantity,
    minOrder: p.minOrder || 1,
    description,
    arabicDescription,
    suppliersCount,
    isPopular: p.isPopular ?? p.isPupolar ?? false,
    isFlashSale: p.isFlashSaleActive ?? p.isFlashSale ?? bestPriceRow?.isFlashSaleActive ?? false,
    productPriceId: p.productPriceId || p.priceId || p.prices?.[0]?.id,
    inventoryId: p.inventoryId || p.inventoryUserId || primaryPrice?.inventoryUserId,
    inventoryName: p.inventoryName || p.inventoryUserName || primaryPrice?.inventoryUserName,
    isFavorite: p.isFavorite ?? false,
    productCode
  };
}

export interface PaginatedProducts {
  items: Product[];
  totalItems: number;
  totalPages: number;
  page: number;
  size: number;
}

function mapBestPriceProduct(item: BackendBestPriceDto): Product {
  return {
    id: item.productId,
    productPriceId: item.priceId,
    name: item.productName || '',
    arabicName: item.productArabicName?.trim() || undefined,
    strength: extractStrength(item.productName),
    form: '',
    packSize: extractPackSize(item.productName),
    price: ceilPrice(item.bestSalesPrice),
    originalPrice: item.discount ? ceilPrice(item.bestSalesPrice / (1 - item.discount / 100)) : ceilPrice(item.bestSalesPrice),
    discountRate: item.discount || 0,
    image: getImageUrl(item.productImageUrl),
    inStock: (item.quantity ?? 0) > 0,
    stockQuantity: item.quantity || 0,
    description: item.productDescription || item.productArabicDescription || '',
    manufacturer: (item.productPreef || '').trim() || undefined
  };
}

export function mapSupplierPriceRow(p: any): ProductSupplierPrice {
  const invName = typeof p.inventoryUser === 'object' && p.inventoryUser !== null
    ? (p.inventoryUser.bussinesName || p.inventoryUser.fullName || '')
    : (p.inventoryName || p.inventoryUser || '');

  const effective = p.effectiveSalesPrice ?? p.salesPrice ?? 0;
  const discount = p.discountRate ?? p.discount ?? 0;
  let original = p.priceBeforeFlashSale ?? p.salesPrice ?? effective;
  if (discount > 0 && original <= effective) {
    original = effective / (1 - discount / 100);
  }

  return {
    id: p.priceId || p.productPriceId || p.id,
    inventoryUserId: p.inventoryUserId || p.inventoryUser?.id || p.inventoryId,
    inventoryName: invName,
    salesPrice: ceilPrice(Math.max(original, effective)),
    discountRate: discount,
    effectiveSalesPrice: ceilPrice(effective),
    stockQuantity: p.stockQuantity ?? p.quantity ?? 0,
    maxQuantity: p.maxQuantity ?? 0,
    minOrder: p.minOrder ?? 1,
    isFlashActive: p.isFlashSaleActive || false,
    deliveryTime: p.deliveryTime || ''
  };
}

/**
 * Uncached live read of sellable supplier rows. Unlike getSupplierPricesForProduct
 * it propagates request failures so checkout can tell "unavailable" apart from
 * "verification failed".
 */
export async function fetchLiveSupplierPrices(productId: string): Promise<ProductSupplierPrice[]> {
  if (!productId) return [];
  const res = await apiClient.get(`/api/ProductPrices/available-by-product/${productId}`);
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(mapSupplierPriceRow);
}

export const productsService = {
  /**
   * GET /api/Products/GetProducts
   * Note: page=0 disables server paging and returns the whole catalog, so page always starts at 1.
   */
  async getProducts(params?: { lang?: number; search?: string; page?: number; size?: number }): Promise<Product[]> {
    const page = await this.getProductsPage(params);
    return page.items;
  },

  /**
   * GET /api/Products/GetProducts — returns pagination metadata from the backend envelope
   * { success, data, totalItems, totalPages }
   */
  async getProductsPage(params?: { lang?: number; search?: string; page?: number; size?: number }): Promise<PaginatedProducts> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const size = params?.size && params.size > 0 ? params.size : 12;

    const res = await apiClient.get('/api/Products/GetProducts', {
      params: {
        lang: params?.lang ?? 1,
        page,
        size,
        search: params?.search || undefined
      }
    });

    const payload = res.data;
    const list = Array.isArray(payload)
      ? payload
      : (payload?.data || payload?.items || []);
    const totalItems = Array.isArray(payload)
      ? list.length
      : (payload?.totalItems ?? list.length);
    const totalPages = Array.isArray(payload)
      ? Math.max(1, Math.ceil(totalItems / size))
      : (payload?.totalPages ?? Math.max(1, Math.ceil(totalItems / size)));

    return {
      items: list.map(mapBackendProduct),
      totalItems,
      totalPages: Math.max(1, totalPages),
      page,
      size
    };
  },

  /**
   * GET /api/Products/{id} with multi-source fallback (Cached 2 minutes + deduplicated)
   */
  async getProductById(id: string, lang = 1, force = false): Promise<Product | null> {
    if (!id) return null;

    return cachedRequest(
      `product_by_id_${id}_${lang}`,
      async () => {
        // 1. Try public prices-with-data and available-by-product simultaneously
        try {
          const [rPrices, rAvail] = await Promise.allSettled([
            apiClient.get(`/api/Products/product-prices-with-data/${id}`, {
              headers: { 'X-Silent-Loading': 'true' }
            }),
            apiClient.get(`/api/ProductPrices/available-by-product/${id}`, {
              headers: { 'X-Silent-Loading': 'true' }
            })
          ]);

          const priceList = rPrices.status === 'fulfilled' ? (Array.isArray(rPrices.value.data) ? rPrices.value.data : [rPrices.value.data]) : [];
          const availList = rAvail.status === 'fulfilled' ? (Array.isArray(rAvail.value.data) ? rAvail.value.data : [rAvail.value.data]) : [];

          if (priceList.length > 0 || availList.length > 0) {
            const basePrice = priceList[0] || {};
            const baseAvail = availList[0] || {};
            const merged = {
              ...baseAvail,
              ...basePrice,
              prices: priceList.length > 0 ? priceList : availList,
              inventories: availList
            };
            const mapped = mapBackendProduct(merged);

            // Price rows carry no category/image; enrich from the public catalog.
            if (!mapped.categoryId || !mapped.image) {
              try {
                const page = await this.getProductsPage({ search: mapped.name, size: 10 });
                const match = page.items.find(item => item.id === id);
                if (match) {
                  return {
                    ...match,
                    price: mapped.price || match.price,
                    originalPrice: mapped.originalPrice || match.originalPrice,
                    discountRate: mapped.discountRate ?? match.discountRate,
                    stockQuantity: mapped.stockQuantity || match.stockQuantity,
                    inStock: (mapped.stockQuantity || 0) > 0 || match.inStock,
                    productPriceId: mapped.productPriceId || match.productPriceId,
                    inventoryId: mapped.inventoryId || match.inventoryId,
                    inventoryName: mapped.inventoryName || match.inventoryName
                  };
                }
              } catch {
                // keep the price-row data
              }
            }
            return mapped;
          }
        } catch {
          // continue to next strategy
        }

        // 2. Try direct /api/Products/{id}
        try {
          const res = await apiClient.get(`/api/Products/${id}`, {
            params: { lang },
            headers: { 'X-Silent-Loading': 'true' }
          });
          if (res.data) {
            return mapBackendProduct(res.data);
          }
        } catch {
          // Continue to search
        }

        return null;
      },
      { ttlMs: 2 * 60 * 1000, force }
    );
  },

  /**
   * Popular products derived from the public catalog (GET /api/Products/GetProducts)
   */
  async getPopularProducts(): Promise<Product[]> {
    const page = await this.getProductsPage({ page: 1, size: 24 });
    const popular = page.items.filter(p => p.isPopular);
    return popular.length > 0 ? popular : page.items;
  },

  /**
   * GET /api/MainCategories/{categoryId}/products
   * Server-paged category listing. Unlike by-category it does not return the
   * whole category (thousands of rows) at once.
   */
  async getCategoryProductsPage(
    categoryId: string,
    params?: { page?: number; size?: number; search?: string; lang?: number }
  ): Promise<{ items: Product[]; hasMore: boolean }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const size = params?.size && params.size > 0 ? params.size : 12;
    const res = await apiClient.get(`/api/MainCategories/${categoryId}/products`, {
      params: {
        lang: params?.lang ?? 1,
        page,
        pageSize: size,
        search: params?.search || undefined
      }
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return { items: list.map(mapBackendProduct), hasMore: list.length >= size };
  },

  /**
   * GET /api/Products/by-category/{categoryId}
   * The backend responds with best-price rows (productId, bestSalesPrice, ...).
   * Warning: this endpoint ignores paging and can return tens of thousands of rows.
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const res = await apiClient.get(`/api/Products/by-category/${categoryId}`);
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return list.map((row: any) => mapBestPriceProduct({
      productId: row.productId,
      priceId: row.priceId,
      productName: row.productName,
      productArabicName: row.productArabicName,
      productDescription: row.productDescription,
      productArabicDescription: row.productArabicDescription,
      productPreef: row.productPreef,
      productArabicPreef: row.productArabicPreef,
      productImageUrl: row.productImageUrl,
      bestSalesPrice: row.bestSalesPrice,
      inventoryUser: row.inventoryUser,
      quantity: row.quantity,
      discount: row.discount
    }));
  },

  /**
   * GET /api/Products/GetProducts-byProvider?inventoryId=...&search=...
   */
  async getProductsByProvider(inventoryId: string, search?: string): Promise<Product[]> {
    const cacheKey = `prov_${inventoryId}`;
    if (!search && (this as any)._providerCache?.has(cacheKey)) {
      return (this as any)._providerCache.get(cacheKey);
    }
    const res = await apiClient.get('/api/Products/GetProducts-byProvider', {
      params: { inventoryId, search: search || undefined },
      headers: { 'X-Silent-Loading': 'true' }
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    const mapped = list.map(mapBackendProduct);
    if (!search && mapped.length > 0) {
      if (!(this as any)._providerCache) (this as any)._providerCache = new Map<string, Product[]>();
      (this as any)._providerCache.set(cacheKey, mapped);
    }
    return mapped;
  },

  /**
   * GET /api/Products/search-product-category
   * Products a specific provider stocks inside a specific category.
   */
  async getProductsByProviderAndCategory(
    categoryId: string,
    inventoryId: string,
    search?: string
  ): Promise<Product[]> {
    const res = await apiClient.get('/api/Products/search-product-category', {
      params: { catId: categoryId, inventoryId, search: search || undefined },
      headers: { 'X-Silent-Loading': 'true' }
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return list.map(mapBackendProduct);
  },

  /**
   * GET /api/Products/GetProducts?search=... (paginated search)
   */
  async searchProducts(search: string, page = 1, pageSize = 20): Promise<Product[]> {
    const res = await this.getProductsPage({ search, page, size: pageSize });
    return res.items;
  },

  /**
   * GET /api/ProductPrices/best-prices
   */
  async getBestPrices(page = 1, size = 20): Promise<Product[]> {
    const res = await apiClient.get<BackendBestPriceDto[]>('/api/ProductPrices/best-prices', {
      params: { page, size }
    });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapBestPriceProduct);
  },

  /**
   * GET /api/ProductPrices/available-by-product/{productId} (Cached 1 minute + deduplicated)
   */
  async getSupplierPricesForProduct(productId: string, force = false): Promise<ProductSupplierPrice[]> {
    if (!productId) return [];

    return cachedRequest(
      `supplier_prices_${productId}`,
      async () => {
        try {
          const res = await apiClient.get(`/api/ProductPrices/available-by-product/${productId}`);
          const list = Array.isArray(res.data) ? res.data : [];
          if (list.length > 0) {
            return list.map(mapSupplierPriceRow);
          }
        } catch {
          // Return empty if endpoint fails
        }
        return [];
      },
      { ttlMs: 60 * 1000, force }
    );
  },

  /**
   * Retrieves active flash sale items from the backend. (Cached 1 minute + deduplicated)
   * Checks /api/Home/GetHomeProduct (flashSales) and /api/ProductPrices/flash-sale-dashbourd.
   * Returns empty array [] if no flash sales are active on the backend.
   */
  async getFlashSaleProducts(force = false): Promise<Product[]> {
    return cachedRequest(
      'active_flash_sales',
      async () => {
        try {
          // 1. Check authenticated GetHomeProduct endpoint which contains the real flashSales array
          const token = localStorage.getItem('drugza_token') || sessionStorage.getItem('drugza_token');
          if (token) {
            try {
              const res = await apiClient.get<any>('/api/Home/GetHomeProduct', {
                headers: { 'X-Silent-Loading': 'true' }
              });
              const rawList = res.data?.flashSales;
              if (Array.isArray(rawList) && rawList.length > 0) {
                return rawList.map((p: any) => {
                  const mapped = mapBackendProduct(p);
                  mapped.isFlashSale = true;
                  return mapped;
                });
              }
            } catch {
              // If token expired or endpoint failed, fall through to dashboard endpoint
            }
          }

          // 2. Check public flash-sale-dashbourd endpoint
          try {
            const dashRes = await apiClient.get<any>('/api/ProductPrices/flash-sale-dashbourd', {
              headers: { 'X-Silent-Loading': 'true' }
            });
            const list = Array.isArray(dashRes.data) ? dashRes.data : [];
            if (list.length > 0) {
              return list.map((p: any) => {
                const mapped = p.bestSalesPrice != null ? mapBestPriceProduct(p) : mapBackendProduct(p);
                mapped.isFlashSale = true;
                return mapped;
              });
            }
          } catch {
            // Fall through
          }

          // No active flash sales currently on the backend
          return [];
        } catch (e) {
          console.warn('Error loading flash sale products:', e);
          return [];
        }
      },
      { ttlMs: 60 * 1000, force }
    );
  },

  /**
   * POST /api/Products/toggle-Favorite
   * Query params: userId, productId, productPriceId
   */
  async toggleFavorite(userId: string, productId: string, productPriceId?: string) {
    const params: Record<string, string> = { userId, productId };
    if (productPriceId) {
      params.productPriceId = productPriceId;
    }
    const res = await apiClient.post('/api/Products/toggle-Favorite', null, {
      params
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
