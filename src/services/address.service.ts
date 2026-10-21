import { apiClient } from './client';
import type { Address } from '@/types';

export interface BackendAddressDto {
  id: string;
  userId: string;
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
  addressLine: string;
  areaId: number;
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
  return {
    id: a.id,
    title: idx === 0 ? 'Main Pharmacy Branch' : `Pharmacy Branch #${idx + 1}`,
    recipientName: 'Community Pharmacist',
    phoneNumber: '+20 100 000 0000',
    cityName: a.area?.city?.arabicName || a.area?.city?.name || 'Cairo',
    areaName: a.area?.arabicName || a.area?.name || '',
    streetAddress: a.addressLine,
    buildingNumber: '',
    floor: a.floorNum ? String(a.floorNum) : '',
    landmark: a.apartmentNum ? `Apt ${a.apartmentNum}` : '',
    deliveryInstructions: 'Official pharmacy receiving desk - 24/7 cold-chain inspection',
    isDefault: idx === 0
  };
}

export const addressService = {
  /**
   * GET /api/Address/get-user-Addresses
   */
  async getUserAddresses(): Promise<Address[]> {
    const res = await apiClient.get<BackendAddressDto[]>('/api/Address/get-user-Addresses');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((a, idx) => mapBackendAddress(a, idx));
  },

  /**
   * POST /api/Address/insert-address
   */
  async createAddress(data: CreateAddressDto) {
    const res = await apiClient.post('/api/Address/insert-address', {
      addressLine: data.addressLine,
      areaId: data.areaId || 1,
      latitude: data.latitude || 30.0444,
      longitude: data.longitude || 31.2357,
      floorNum: data.floorNum || 1,
      apartmentNum: data.apartmentNum || 1
    });
    return res.data;
  },

  /**
   * PUT /api/Address/update-address/{id}
   */
  async updateAddress(id: string, data: CreateAddressDto) {
    const res = await apiClient.put(`/api/Address/update-address/${id}`, {
      addressLine: data.addressLine,
      areaId: data.areaId || 1,
      latitude: data.latitude || 30.0444,
      longitude: data.longitude || 31.2357,
      floorNum: data.floorNum || 1,
      apartmentNum: data.apartmentNum || 1
    });
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
      if (res.data?.shippingFees) return res.data.shippingFees;
    } catch {
      // Fallback standard fee
    }
    return 0;
  },

  /**
   * GET /api/Countries/all-countries
   */
  async getAllCountries(): Promise<CountryDto[]> {
    const res = await apiClient.get('/api/Countries/all-countries');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Cities/all-city or /api/Cities/GetByCountryId/{countryId}
   */
  async getCities(countryId?: number): Promise<CityDto[]> {
    const url = countryId
      ? `/api/Cities/GetByCountryId/${countryId}`
      : '/api/Cities/all-city';
    const res = await apiClient.get(url);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Area/all-areies or /api/Area/GetByCityId/{cityId}
   */
  async getAreas(cityId?: number): Promise<AreaDto[]> {
    const url = cityId
      ? `/api/Area/GetByCityId/${cityId}`
      : '/api/Area/all-areies';
    const res = await apiClient.get(url);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Zones/all-zones
   */
  async getAllZones(): Promise<Array<{ id: number; name: string }>> {
    const res = await apiClient.get('/api/Zones/all-zones');
    return Array.isArray(res.data) ? res.data : [];
  }
};
