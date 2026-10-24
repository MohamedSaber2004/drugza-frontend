import type { Category, Provider } from '../entities';

export interface ICategoryRepository {
  getCategories(lang?: number): Promise<Category[]>;
  getCategoryById(id: string, lang?: number): Promise<Category | null>;
  getCategoryProviders(categoryId: string): Promise<Provider[]>;
}
