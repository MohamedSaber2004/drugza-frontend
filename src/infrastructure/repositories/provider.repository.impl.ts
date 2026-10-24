import type { IProviderRepository } from '@/core/domain/repositories';
import type { Provider } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { ProviderApiDto } from '../dto';
import { EntityMapper } from '../mappers';

export class ProviderRepositoryImpl implements IProviderRepository {
  constructor(private http: IHttpClient) {}

  async getProviders(): Promise<Provider[]> {
    const raw = await this.http.get<any[]>('/api/Providers');
    const list: ProviderApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProvider);
  }

  async getTopProviders(): Promise<Provider[]> {
    const raw = await this.http.get<any[]>('/api/Providers/top');
    const list: ProviderApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toProvider);
  }

  async getProviderById(id: string): Promise<Provider | null> {
    const res = await this.http.get<ProviderApiDto>(`/api/Providers/${id}`);
    return res ? EntityMapper.toProvider(res) : null;
  }
}
