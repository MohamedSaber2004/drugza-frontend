import type { IProductRepository } from '../repositories';
import type { Product, ProductSupplierPrice, ProductQueryParams, Brand, ActiveIngredient } from '../entities';

export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(params?: ProductQueryParams): Promise<Product[]> {
    return this.productRepo.getProducts(params);
  }
}

export class GetProductDetailUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string): Promise<Product | null> {
    return this.productRepo.getProductById(id);
  }
}

export class GetFlashSaleProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepo.getFlashSaleProducts();
  }
}

export class SearchProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(query: string): Promise<Product[]> {
    if (!query.trim()) return [];
    return this.productRepo.searchProducts(query.trim());
  }
}

export class GetPopularProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepo.getPopularProducts();
  }
}

export class GetProductsByCategoryUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(categoryId: string): Promise<Product[]> {
    return this.productRepo.getProductsByCategory(categoryId);
  }
}

export class GetProductsByProviderUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(providerId: string): Promise<Product[]> {
    return this.productRepo.getProductsByProvider(providerId);
  }
}

export class GetProductSupplierPricesUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(productId: string): Promise<ProductSupplierPrice[]> {
    return this.productRepo.getSupplierPrices(productId);
  }
}

export class GetBrandsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<Brand[]> {
    return this.productRepo.getAllBrands();
  }
}

export class GetActiveIngredientsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(params?: { search?: string }): Promise<ActiveIngredient[]> {
    return this.productRepo.getActiveIngredients(params);
  }
}
