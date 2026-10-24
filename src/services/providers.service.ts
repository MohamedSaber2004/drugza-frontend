import { apiClient } from './client';
import type { Supplier } from '@/types';
import { mapBackendProviderToSupplier, type BackendHomeProviderDto } from './home.service';
import { cachedRequest } from '@/utils/cache';

async function fetchPublicProviders(force = false): Promise<Supplier[]> {
  return cachedRequest(
    'public_providers_list',
    async () => {
      const res = await apiClient.get<{ providers?: BackendHomeProviderDto[] | null }>('/api/Home/GetHome', {
        headers: { 'X-Silent-Loading': 'true' }
      });
      const list = Array.isArray(res.data?.providers) ? res.data.providers : [];
      return list.map(mapBackendProviderToSupplier);
    },
    { ttlMs: 5 * 60 * 1000, force }
  );
}

export const providersService = {
  /**
   * GET /api/Home/GetHome — public distributors list (Cached 5 minutes + deduplicated)
   */
  async getProviders(force = false): Promise<Supplier[]> {
    return fetchPublicProviders(force);
  },

  /**
   * Public distributors, available warehouses first
   */
  async getTopProviders(force = false): Promise<Supplier[]> {
    const list = await fetchPublicProviders(force);
    return [...list].sort((a, b) => Number(b.isAvailableNow) - Number(a.isAvailableNow));
  },

  /**
   * Provider profile resolved from the public distributors list
   */
  async getProviderById(id: string, force = false): Promise<Supplier | null> {
    const list = await fetchPublicProviders(force);
    return list.find(p => p.id === id) || null;
  }
};

