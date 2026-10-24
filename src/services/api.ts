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
import { categoriesService } from './categories.service';
import { providersService } from './providers.service';
import { productsService } from './products.service';
import { bannersService } from './banners.service';
import { homeService } from './home.service';
import { brandsService } from './brands.service';
import { activeIngredientsService } from './active-ingredients.service';
import { balancesService } from './balances.service';
import { returnsService } from './returns.service';
import { invoicesService } from './invoices.service';

import { API_BASE_URL, getImageUrl, apiClient } from './client';
export { API_BASE_URL, getImageUrl, apiClient };

/**
 * DrugzaService - Unified adapter delegating to modular services
 */
export const DrugzaService = {
  // Categories
  async getCategories(lang = 1): Promise<Category[]> {
    return categoriesService.getCategories(lang);
  },

  async getCategoryById(id: string, lang = 1): Promise<Category | null> {
    return categoriesService.getCategoryById(id, lang);
  },

  // Suppliers & Providers
  async getTopSuppliers(): Promise<Supplier[]> {
    return providersService.getTopProviders();
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    return providersService.getProviders();
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    return providersService.getProviderById(id);
  },

  async getSuppliersByCategory(categoryId: string): Promise<Supplier[]> {
    const list = await categoriesService.getCategoryProviders(categoryId);
    return list.length > 0 ? list : providersService.getProviders();
  },

  // Products
  async getProducts(params?: { lang?: number; search?: string; page?: number; size?: number }): Promise<Product[]> {
    return productsService.getProducts(params);
  },

  async getProductById(id: string): Promise<Product | null> {
    return productsService.getProductById(id);
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return productsService.getProductsByCategory(categoryId);
  },

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    return productsService.getProductsByProvider(supplierId);
  },

  async getProductSupplierPrices(productId: string): Promise<ProductSupplierPrice[]> {
    return productsService.getSupplierPricesForProduct(productId);
  },

  async getPopularProducts(): Promise<Product[]> {
    return productsService.getPopularProducts();
  },

  async getFlashSaleProducts(): Promise<Product[]> {
    return productsService.getFlashSaleProducts();
  },

  async searchProducts(query: string): Promise<Product[]> {
    return productsService.searchProducts(query);
  },

  async getProductsByBrand(brandId: number): Promise<Product[]> {
    return productsService.getProductsByBrand(brandId);
  },

  // Brands
  async getAllBrands(): Promise<Brand[]> {
    return brandsService.getAllBrands();
  },

  async getPopularBrands(): Promise<Brand[]> {
    return brandsService.getPopularBrands();
  },

  // Active Ingredients
  async getActiveIngredients(search?: string): Promise<ActiveIngredient[]> {
    return activeIngredientsService.getActiveIngredients({ search });
  },

  async getActiveIngredientById(id: string): Promise<ActiveIngredient | null> {
    return activeIngredientsService.getActiveIngredientById(id);
  },

  // Balances
  async getUserBalance(userId: string): Promise<BalanceAccount | null> {
    return balancesService.getUserBalance(userId);
  },

  async getUserTransactions(userId: string): Promise<BalanceTransaction[]> {
    return balancesService.getUserTransactions(userId);
  },

  // Invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return invoicesService.getUserInvoices(userId);
  },

  // Returns
  async getPharmacyReturns(): Promise<ReturnOrderDto[]> {
    return returnsService.getPharmacyReturns();
  },

  async getBanners() {
    return bannersService.getBanners();
  },

  async getSpecialOffers() {
    return bannersService.getSpecialOffers();
  },

  async getHome() {
    return homeService.getHome();
  }
};
