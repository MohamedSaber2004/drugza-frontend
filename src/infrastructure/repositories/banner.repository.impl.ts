import type { IBannerRepository } from '@/core/domain/repositories';
import type { Banner } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { BannerApiDto } from '../dto';
import { EntityMapper } from '../mappers';

export class BannerRepositoryImpl implements IBannerRepository {
  constructor(private http: IHttpClient) {}

  async getBanners(): Promise<Banner[]> {
    const raw = await this.http.get<any>('/api/Banners');
    const list: BannerApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toBanner);
  }

  async getSpecialOffers(): Promise<Banner[]> {
    const raw = await this.http.get<any>('/api/Banners/special-offers');
    const list: BannerApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toBanner);
  }

  async getHomeData(): Promise<any> {
    return this.http.get('/api/Home');
  }
}
