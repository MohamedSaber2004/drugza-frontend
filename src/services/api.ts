import type {
  Product,
  Category,
  Supplier,
  ProductSupplierPrice,
  Brand,
  ActiveIngredient,
  BalanceAccount,
  BalanceTransaction,
  ReturnOrderDto,
  Invoice
} from '@/types';

import { defaultContainer, TOKENS } from '@/core/di';
import { API_BASE_URL, getImageUrl, apiClient } from './client';
export { API_BASE_URL, getImageUrl, apiClient };

/**
 * DrugzaService - Unified adapter delegating to the Clean Architecture DI Container
 */
export const DrugzaService = {
  // Categories
  async getCategories(lang = 1): Promise<Category[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetCategoriesUseCase);
    const res = await useCase.execute(lang);
    return res as unknown as Category[];
  },

  async getCategoryById(id: string, lang = 1): Promise<Category | null> {
    const useCase = defaultContainer.resolve(TOKENS.GetCategoryByIdUseCase);
    const res = await useCase.execute(id, lang);
    return res as unknown as Category | null;
  },

  // Suppliers & Providers
  async getTopSuppliers(): Promise<Supplier[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetProvidersUseCase);
    const res = await useCase.execute();
    return res as unknown as Supplier[];
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetProvidersUseCase);
    const res = await useCase.execute();
    return res as unknown as Supplier[];
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    const useCase = defaultContainer.resolve(TOKENS.GetProviderByIdUseCase);
    const res = await useCase.execute(id);
    return res as unknown as Supplier | null;
  },

  async getSuppliersByCategory(categoryId: string): Promise<Supplier[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetCategoryProvidersUseCase);
    const res = await useCase.execute(categoryId);
    return res as unknown as Supplier[];
  },

  // Products
  async getProducts(params?: { lang?: number; search?: string; page?: number; size?: number }): Promise<Product[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetProductsUseCase);
    const res = await useCase.execute(params);
    return res as unknown as Product[];
  },

  async getProductById(id: string): Promise<Product | null> {
    const useCase = defaultContainer.resolve(TOKENS.GetProductDetailUseCase);
    const res = await useCase.execute(id);
    return res as unknown as Product | null;
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetProductsByCategoryUseCase);
    const res = await useCase.execute(categoryId);
    return res as unknown as Product[];
  },

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetProductsByProviderUseCase);
    const res = await useCase.execute(supplierId);
    return res as unknown as Product[];
  },

  async getProductSupplierPrices(productId: string): Promise<ProductSupplierPrice[]> {
    const repo = defaultContainer.resolve(TOKENS.ProductRepository);
    const res = await repo.getSupplierPrices(productId);
    return res as unknown as ProductSupplierPrice[];
  },

  async getPopularProducts(): Promise<Product[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetPopularProductsUseCase);
    const res = await useCase.execute();
    return res as unknown as Product[];
  },

  async getFlashSaleProducts(): Promise<Product[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetFlashSaleProductsUseCase);
    const res = await useCase.execute();
    return res as unknown as Product[];
  },

  async searchProducts(query: string): Promise<Product[]> {
    const useCase = defaultContainer.resolve(TOKENS.SearchProductsUseCase);
    const res = await useCase.execute(query);
    return res as unknown as Product[];
  },

  async getProductsByBrand(brandId: number): Promise<Product[]> {
    const repo = defaultContainer.resolve(TOKENS.ProductRepository);
    const res = await repo.getProductsByBrand(brandId);
    return res as unknown as Product[];
  },

  // Brands
  async getAllBrands(): Promise<Brand[]> {
    const repo = defaultContainer.resolve(TOKENS.ProductRepository);
    return repo.getAllBrands();
  },

  async getPopularBrands(): Promise<Brand[]> {
    const repo = defaultContainer.resolve(TOKENS.ProductRepository);
    return repo.getPopularBrands();
  },

  // Active Ingredients
  async getActiveIngredients(search?: string): Promise<ActiveIngredient[]> {
    const repo = defaultContainer.resolve(TOKENS.ProductRepository);
    return repo.getActiveIngredients({ search });
  },

  async getActiveIngredientById(id: string): Promise<ActiveIngredient | null> {
    const repo = defaultContainer.resolve(TOKENS.ProductRepository);
    return repo.getActiveIngredientById(id);
  },

  // Balances
  async getUserBalance(userId: string): Promise<BalanceAccount | null> {
    const useCase = defaultContainer.resolve(TOKENS.GetBalancesUseCase);
    const res = await useCase.execute(userId);
    return res.account as unknown as BalanceAccount | null;
  },

  async getUserTransactions(userId: string): Promise<BalanceTransaction[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetBalancesUseCase);
    const res = await useCase.execute(userId);
    return res.transactions as unknown as BalanceTransaction[];
  },

  // Invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    const useCase = defaultContainer.resolve(TOKENS.GetInvoicesUseCase);
    const res = await useCase.execute(userId);
    return res as unknown as Invoice[];
  },

  // Returns
  async getPharmacyReturns(): Promise<ReturnOrderDto[]> {
    const orderRepo = defaultContainer.resolve(TOKENS.OrderRepository);
    const res = await orderRepo.getPharmacyReturns();
    return res as unknown as ReturnOrderDto[];
  },

  async getBanners() {
    const useCase = defaultContainer.resolve(TOKENS.GetBannersUseCase);
    return useCase.execute();
  },

  async getSpecialOffers() {
    const useCase = defaultContainer.resolve(TOKENS.GetSpecialOffersUseCase);
    return useCase.execute();
  },

  async getHome() {
    const useCase = defaultContainer.resolve(TOKENS.GetHomeDataUseCase);
    return useCase.execute();
  }
};
