import type { Address } from '../entities';

export interface IAddressRepository {
  getAddresses(): Promise<Address[]>;
  getAddressById(id: string): Promise<Address | null>;
  createAddress(address: Omit<Address, 'id'>): Promise<Address>;
  updateAddress(id: string, address: Partial<Address>): Promise<Address>;
  deleteAddress(id: string): Promise<boolean>;
  setDefaultAddress(id: string): Promise<boolean>;
}
