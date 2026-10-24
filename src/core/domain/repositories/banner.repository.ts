import type { Banner } from '../entities';

export interface IBannerRepository {
  getBanners(): Promise<Banner[]>;
  getSpecialOffers(): Promise<Banner[]>;
  getHomeData(): Promise<any>;
}
