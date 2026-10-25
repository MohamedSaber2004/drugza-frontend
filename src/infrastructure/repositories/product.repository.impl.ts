import type { IProductRepository } from '@/core/domain/repositories';
import type { Product, ProductSupplierPrice, ProductQueryParams, Brand, ActiveIngredient } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { ProductApiDto, ProductSupplierPriceDto } from '../dto';
import { EntityMapper } from '../mappers';

export class ProductRepositoryImpl implements IProductRepository {
  constructor(private http: IHttpClient) {}

  async getProducts(params?: ProductQueryParams): Promise<Product[]> {
    const raw = await this.http.get<any>('/api/Products', {
      params: {
        lang: params?.lang ?? 1,
        search: params?.search,
        page: params?.page,
        size: params?.size,
        categoryId: params?.categoryId,
        providerId: params?.providerId
      }
    });

    const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
    return list.map(EntityMapper.toProduct);
  }

  async getProductById(id: string): Promise<Product | null> {
    const res = await this.http.get<ProductApiDto>(`/api/Products/${id}`);
    if (!res) return null;
    return EntityMapper.toProduct(res);
  }

  async getPopularProducts(): Promise<Product[]> {
    const raw = await this.http.get<any>('/api/Products/popular');
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProduct);
  }

  async getFlashSaleProducts(): Promise<Product[]> {
    const raw = await this.http.get<any>('/api/Products/flash-sales');
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProduct);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const raw = await this.http.get<any>('/api/Products/search', {
      params: { q: query }
    });
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProduct);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const raw = await this.http.get<any>(`/api/Products/by-category/${categoryId}`);
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProduct);
  }

  async getProductsByProvider(providerId: string): Promise<Product[]> {
    const raw = await this.http.get<any>(`/api/Products/by-provider/${providerId}`);
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProduct);
  }

  async getProductsByBrand(brandId: number): Promise<Product[]> {
    const raw = await this.http.get<any>(`/api/Products/by-brand/${brandId}`);
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProduct);
  }

  async getSupplierPrices(productId: string): Promise<ProductSupplierPrice[]> {
    const raw = await this.http.get<ProductSupplierPriceDto[]>(`/api/Products/${productId}/suppliers`);
    const list = Array.isArray(raw) ? raw : [];
    return list.map(EntityMapper.toProductSupplierPrice);
  }

  async getAllBrands(): Promise<Brand[]> {
    const raw = await this.http.get<any[]>('/api/Brands');
    return Array.isArray(raw) ? raw : [];
  }

  async getPopularBrands(): Promise<Brand[]> {
    const raw = await this.http.get<any[]>('/api/Brands/popular');
    return Array.isArray(raw) ? raw : [];
  }

  async getActiveIngredients(params?: { search?: string }): Promise<ActiveIngredient[]> {
    const raw = await this.http.get<any[]>('/api/ActiveIngredients', { params });
    return Array.isArray(raw) ? raw : [];
  }

  async getActiveIngredientById(id: string): Promise<ActiveIngredient | null> {
    const res = await this.http.get<any>(`/api/ActiveIngredients/${id}`);
    return res || null;
  }
}
