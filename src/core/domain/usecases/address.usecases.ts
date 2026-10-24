import type { IAddressRepository } from '../repositories';
import type { Address } from '../entities';

export class GetAddressesUseCase {
  constructor(private addressRepo: IAddressRepository) {}

  async execute(): Promise<Address[]> {
    return this.addressRepo.getAddresses();
  }
}

export class SaveAddressUseCase {
  constructor(private addressRepo: IAddressRepository) {}

  async execute(address: Partial<Address>): Promise<Address> {
    if (address.id) {
      return this.addressRepo.updateAddress(address.id, address);
    }
    return this.addressRepo.createAddress(address as Omit<Address, 'id'>);
  }
}

export class DeleteAddressUseCase {
  constructor(private addressRepo: IAddressRepository) {}

  async execute(id: string): Promise<boolean> {
    return this.addressRepo.deleteAddress(id);
  }
}

export class SetDefaultAddressUseCase {
  constructor(private addressRepo: IAddressRepository) {}

  async execute(id: string): Promise<boolean> {
    return this.addressRepo.setDefaultAddress(id);
  }
}
