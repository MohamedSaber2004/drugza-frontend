import type { IAddressRepository } from '@/core/domain/repositories';
import type { Address } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { AddressApiDto } from '../dto';
import { EntityMapper } from '../mappers';

export class AddressRepositoryImpl implements IAddressRepository {
  constructor(private http: IHttpClient) {}

  async getAddresses(): Promise<Address[]> {
    const raw = await this.http.get<any>('/api/Addresses');
    const list: AddressApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toAddress);
  }

  async getAddressById(id: string): Promise<Address | null> {
    const res = await this.http.get<AddressApiDto>(`/api/Addresses/${id}`);
    return res ? EntityMapper.toAddress(res) : null;
  }

  async createAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const res = await this.http.post<AddressApiDto>('/api/Addresses', {
      name: address.name,
      city: address.city,
      region: address.region,
      street: address.street,
      building: address.building,
      floor: address.floor,
      notes: address.notes,
      phoneNumber: address.phoneNumber,
      isDefault: address.isDefault,
      latitude: address.location?.latitude,
      longitude: address.location?.longitude
    });
    return EntityMapper.toAddress(res);
  }

  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    const res = await this.http.put<AddressApiDto>(`/api/Addresses/${id}`, {
      ...address,
      latitude: address.location?.latitude,
      longitude: address.location?.longitude
    });
    return EntityMapper.toAddress(res);
  }

  async deleteAddress(id: string): Promise<boolean> {
    await this.http.delete(`/api/Addresses/${id}`);
    return true;
  }

  async setDefaultAddress(id: string): Promise<boolean> {
    await this.http.post(`/api/Addresses/${id}/default`);
    return true;
  }
}
