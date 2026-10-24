import type { Provider } from '../entities';

export interface IProviderRepository {
  getProviders(): Promise<Provider[]>;
  getTopProviders(): Promise<Provider[]>;
  getProviderById(id: string): Promise<Provider | null>;
}
