import type { Product, ProductSupplierPrice, ProductQueryParams, Brand, ActiveIngredient } from '../entities';

export interface IProductRepository {
  getProducts(params?: ProductQueryParams): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getPopularProducts(): Promise<Product[]>;
  getFlashSaleProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProductsByProvider(providerId: string): Promise<Product[]>;
  getProductsByBrand(brandId: number): Promise<Product[]>;
  getSupplierPrices(productId: string): Promise<ProductSupplierPrice[]>;
  getAllBrands(): Promise<Brand[]>;
  getPopularBrands(): Promise<Brand[]>;
  getActiveIngredients(params?: { search?: string }): Promise<ActiveIngredient[]>;
  getActiveIngredientById(id: string): Promise<ActiveIngredient | null>;
}
