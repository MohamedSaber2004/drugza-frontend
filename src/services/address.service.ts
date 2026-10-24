import { apiClient } from './client';
import type { Address } from '@/types';

export interface BackendAddressDto {
  id: string;
  userId?: string;
  addressLine: string;
  latitude?: number | null;
  longitude?: number | null;
  floorNum?: number | null;
  apartmentNum?: number | null;
  areaId?: number | null;
  area?: {
    id: number;
    name?: string;
    arabicName?: string;
    cityId?: number;
    city?: {
      id: number;
      name?: string;
      arabicName?: string;
    };
  };
}

export interface CreateAddressDto {
  userId?: string;
  addressLine: string;
  areaId: number;
  latitude?: number;
  longitude?: number;
  floorNum?: number;
  apartmentNum?: number;
}

export interface UpdateAddressDto {
  addressLine: string;
  areaId?: number;
  latitude?: number;
  longitude?: number;
  floorNum?: number;
  apartmentNum?: number;
}

export interface CityDto {
  id: number;
  name: string;
  arabicName?: string;
  countryId: number;
}

export interface AreaDto {
  id: number;
  name: string;
  arabicName?: string;
  cityId: number;
}

export interface CountryDto {
  id: number;
  name: string;
  arabicName?: string;
}

export function mapBackendAddress(a: BackendAddressDto, idx: number): Address {
  const cityObj = a.area?.city;
  const cityName = cityObj?.arabicName || cityObj?.name || '';
  const areaName = a.area?.arabicName || a.area?.name || '';
  const cityId = a.area?.cityId || cityObj?.id;
  const areaId = a.areaId || a.area?.id;

  return {
    id: a.id,
    title: idx === 0 ? 'الفرع الرئيسي' : `فرع الصيدلية #${idx + 1}`,
    cityId,
    cityName,
    areaId,
    areaName,
    streetAddress: a.addressLine || '',
    buildingNumber: '',
    floor: a.floorNum ? String(a.floorNum) : '',
    apartment: a.apartmentNum ? String(a.apartmentNum) : '',
    landmark: '',
    deliveryInstructions: '',
    latitude: a.latitude != null ? a.latitude : null,
    longitude: a.longitude != null ? a.longitude : null,
    isDefault: idx === 0
  };
}

export const addressService = {
  /**
   * GET /api/Address/get-user-Addresses
   */
  async getUserAddresses(): Promise<Address[]> {
    try {
      const res = await apiClient.get<any>('/api/Address/get-user-Addresses');
      const raw = res.data;
      const list: BackendAddressDto[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.result)
            ? raw.result
            : [];
      return list.map((a, idx) => mapBackendAddress(a, idx));
    } catch (err) {
      console.warn('[addressService] Failed to fetch user addresses:', err);
      return [];
    }
  },

  /**
   * GET /api/Address
   */
  async getAllAddresses(): Promise<Address[]> {
    try {
      const res = await apiClient.get<any>('/api/Address');
      const raw = res.data;
      const list: BackendAddressDto[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.result)
            ? raw.result
            : [];
      return list.map((a, idx) => mapBackendAddress(a, idx));
    } catch (err) {
      console.warn('[addressService] Failed to fetch all addresses:', err);
      return [];
    }
  },

  /**
   * GET /api/Address/{id}
   */
  async getAddressById(id: string): Promise<Address | null> {
    try {
      const res = await apiClient.get<BackendAddressDto>(`/api/Address/${id}`);
      if (!res.data) return null;
      return mapBackendAddress(res.data, 0);
    } catch (err) {
      console.warn(`[addressService] Failed to fetch address by id ${id}:`, err);
      return null;
    }
  },

  /**
   * POST /api/Address/insert-address
   */
  async createAddress(data: CreateAddressDto) {
    const res = await apiClient.post('/api/Address/insert-address', {
      addressLine: data.addressLine,
      areaId: data.areaId || 1,
      latitude: data.latitude != null ? data.latitude : undefined,
      longitude: data.longitude != null ? data.longitude : undefined,
      floorNum: data.floorNum || 1,
      apartmentNum: data.apartmentNum || 1
    });
    return res.data;
  },

  /**
   * PUT /api/Address/update-address/{id}
   */
  async updateAddress(id: string, data: Partial<CreateAddressDto> & { addressLine: string }) {
    const payload: Record<string, any> = {
      addressLine: data.addressLine
    };
    if (data.areaId) payload.areaId = data.areaId;
    if (data.latitude != null) payload.latitude = data.latitude;
    if (data.longitude != null) payload.longitude = data.longitude;
    if (data.floorNum != null) payload.floorNum = data.floorNum;
    if (data.apartmentNum != null) payload.apartmentNum = data.apartmentNum;

    const res = await apiClient.put(`/api/Address/update-address/${id}`, payload);
    return res.data;
  },

  /**
   * DELETE /api/Address/delete-address/{id}
   */
  async deleteAddress(id: string) {
    const res = await apiClient.delete(`/api/Address/delete-address/${id}`);
    return res.data;
  },

  /**
   * GET /api/Address/GetShippingFess/{addressId}
   */
  async getShippingFees(addressId: string): Promise<number> {
    try {
      const res = await apiClient.get(`/api/Address/GetShippingFess/${addressId}`);
      if (typeof res.data === 'number') return res.data;
      if (res.data?.shippingFees != null) return Number(res.data.shippingFees);
      if (res.data?.fee != null) return Number(res.data.fee);
    } catch {
      // Fallback
    }
    return 0;
  },

  /**
   * GET /api/Countries/all-countries
   */
  async getAllCountries(): Promise<CountryDto[]> {
    try {
      const res = await apiClient.get('/api/Countries/all-countries');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/Cities/all-city or /api/Cities/GetByCountryId/{countryId}
   */
  async getCities(countryId?: number): Promise<CityDto[]> {
    try {
      const url = countryId
        ? `/api/Cities/GetByCountryId/${countryId}`
        : '/api/Cities/all-city';
      const res = await apiClient.get(url);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/Area/all-areies or /api/Area/GetByCityId/{cityId}
   */
  async getAreas(cityId?: number): Promise<AreaDto[]> {
    try {
      const url = cityId
        ? `/api/Area/GetByCityId/${cityId}`
        : '/api/Area/all-areies';
      const res = await apiClient.get(url);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/Zones/all-zones
   */
  async getAllZones(): Promise<Array<{ id: number; name: string }>> {
    try {
      const res = await apiClient.get('/api/Zones/all-zones');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }
};
