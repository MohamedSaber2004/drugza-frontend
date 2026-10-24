import type { ICategoryRepository } from '@/core/domain/repositories';
import type { Category, Provider } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { CategoryApiDto, ProviderApiDto } from '../dto';
import { EntityMapper } from '../mappers';

export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(private http: IHttpClient) {}

  async getCategories(lang = 1): Promise<Category[]> {
    const raw = await this.http.get<any[]>('/api/Categories', {
      params: { lang }
    });
    const list: CategoryApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toCategory);
  }

  async getCategoryById(id: string, lang = 1): Promise<Category | null> {
    const res = await this.http.get<CategoryApiDto>(`/api/Categories/${id}`, {
      params: { lang }
    });
    return res ? EntityMapper.toCategory(res) : null;
  }

  async getCategoryProviders(categoryId: string): Promise<Provider[]> {
    const raw = await this.http.get<any[]>(`/api/Categories/${categoryId}/providers`);
    const list: ProviderApiDto[] = Array.isArray(raw) ? raw : [];
    return list.map(EntityMapper.toProvider);
  }
}
