import type { ICategoryRepository, IProviderRepository } from '../repositories';
import type { Category, Provider } from '../entities';

export class GetCategoriesUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(lang?: number): Promise<Category[]> {
    return this.categoryRepo.getCategories(lang);
  }
}

export class GetCategoryByIdUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(id: string, lang?: number): Promise<Category | null> {
    return this.categoryRepo.getCategoryById(id, lang);
  }
}

export class GetProvidersUseCase {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(): Promise<Provider[]> {
    return this.providerRepo.getProviders();
  }
}

export class GetTopProvidersUseCase {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(): Promise<Provider[]> {
    return this.providerRepo.getTopProviders();
  }
}

export class GetProviderByIdUseCase {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(id: string): Promise<Provider | null> {
    return this.providerRepo.getProviderById(id);
  }
}

export class GetCategoryProvidersUseCase {
  constructor(
    private categoryRepo: ICategoryRepository,
    private providerRepo: IProviderRepository
  ) {}

  async execute(categoryId: string): Promise<Provider[]> {
    const list = await this.categoryRepo.getCategoryProviders(categoryId);
    if (list.length > 0) return list;
    return this.providerRepo.getProviders();
  }
}
