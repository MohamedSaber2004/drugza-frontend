import { apiClient, getImageUrl } from './client';
import type { Supplier } from '@/types';
import { mapBackendProviderToSupplier, type BackendHomeProviderDto } from './home.service';
import { cachedRequest } from '@/utils/cache';

type RawProvider = Record<string, unknown>;

function hasAuthToken(): boolean {
  return Boolean(localStorage.getItem('drugza_token') || sessionStorage.getItem('drugza_token'));
}

function unwrapList(payload: unknown): RawProvider[] {
  if (Array.isArray(payload)) return payload as RawProvider[];
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  for (const key of ['providers', 'data', 'items', 'result', 'value', 'users']) {
    const value = obj[key];
    if (Array.isArray(value)) return value as RawProvider[];
    if (value && typeof value === 'object' && Array.isArray((value as RawProvider).$values)) {
      return (value as RawProvider).$values as RawProvider[];
    }
  }
  if (Array.isArray(obj.$values)) return obj.$values as RawProvider[];
  return [];
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const num = typeof value === 'string' ? Number(value) : value;
    if (typeof num === 'number' && Number.isFinite(num)) return num;
  }
  return undefined;
}

function pickLocation(p: RawProvider): string | undefined {
  const addresses = p.addresses;
  if (typeof addresses === 'string') return addresses.trim() || undefined;
  if (Array.isArray(addresses) && addresses.length > 0) {
    const first = addresses[0] as RawProvider | string;
    if (typeof first === 'string') return first.trim() || undefined;
    return pickString(first?.addressLine, first?.address, first?.city);
  }
  return pickString(p.address, p.location);
}

function mapEndpointProvider(p: RawProvider): Supplier | null {
  const id = pickString(p.id, p.userId, p.inventoryId, p.providerId);
  const name = pickString(p.bussinesName, p.businessName, p.name, p.arabicName, p.userName);
  if (!id || !name) return null;

  const base = mapBackendProviderToSupplier({
    id,
    bussinesName: name,
    userName: pickString(p.userName),
    email: pickString(p.email) || '',
    isAvailableNow: Boolean(p.isAvailableNow ?? p.isAvailable ?? false),
    profileImage: getImageUrl(pickString(p.profileImage, p.image, p.imageUrl), 'provider')
  } as BackendHomeProviderDto);

  return {
    ...base,
    arabicName: pickString(p.arabicName, p.arabicBussinesName, p.arabicBusinessName),
    phoneNumber: pickString(p.phoneNumber, p.phone),
    minOrder: pickNumber(p.minOrder, p.minimumOrder),
    orderNum: pickNumber(p.orderNum, p.ordersCount),
    rating: pickNumber(p.rating, p.averageRating),
    deliverySpeed: pickString(p.deliverySpeed),
    location: pickLocation(p),
    itemsCount: pickNumber(p.itemsCount, p.productCount),
    categoriesSupplied: Array.isArray(p.categoriesSupplied)
      ? (p.categoriesSupplied as unknown[]).map(c =>
          typeof c === 'string' ? c : pickString((c as RawProvider)?.name, (c as RawProvider)?.arabicName) || ''
        ).filter(Boolean)
      : undefined
  };
}

async function fetchEndpointProviders(force = false): Promise<Supplier[]> {
  if (!hasAuthToken()) return [];

  return cachedRequest(
    'providers_endpoint_list',
    async () => {
      try {
        const res = await apiClient.get('/api/Users/get-providers', {
          headers: { 'X-Silent-Loading': 'true' }
        });
        return unwrapList(res.data)
          .map(mapEndpointProvider)
          .filter((p): p is Supplier => p !== null);
      } catch {
        return [];
      }
    },
    { ttlMs: 5 * 60 * 1000, force }
  );
}

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
   * All distributors from GET /api/Users/get-providers when the visitor is
   * authenticated; falls back to the public GetHome subset for guests
   * (get-providers currently answers 401 without a bearer token).
   */
  async getProviders(force = false): Promise<Supplier[]> {
    const endpointList = await fetchEndpointProviders(force);
    if (endpointList.length > 0) return endpointList;
    return fetchPublicProviders(force);
  },

  /**
   * Public distributors, available warehouses first
   */
  async getTopProviders(force = false): Promise<Supplier[]> {
    const list = await this.getProviders(force);
    return [...list].sort((a, b) => Number(b.isAvailableNow) - Number(a.isAvailableNow));
  },

  /**
   * Provider profile resolved from the providers endpoint or the public list
   */
  async getProviderById(id: string, force = false): Promise<Supplier | null> {
    const list = await this.getProviders(force);
    return list.find(p => p.id === id) || null;
  }
};
