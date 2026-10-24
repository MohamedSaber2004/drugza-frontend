import type { ICartRepository } from '../repositories';
import type { CartSummary, Coupon } from '../entities';

export class GetCartUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(): Promise<CartSummary> {
    return this.cartRepo.getCart();
  }
}

export class AddToCartUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(productId: string, supplierId: string, quantity = 1): Promise<CartSummary> {
    return this.cartRepo.addItem(productId, supplierId, quantity);
  }
}

export class UpdateCartItemUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(itemId: string, quantity: number): Promise<CartSummary> {
    return this.cartRepo.updateQuantity(itemId, quantity);
  }
}

export class RemoveCartItemUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(itemId: string): Promise<CartSummary> {
    return this.cartRepo.removeItem(itemId);
  }
}

export class ClearCartUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(): Promise<void> {
    return this.cartRepo.clearCart();
  }
}

export class ApplyCouponUseCase {
  constructor(private cartRepo: ICartRepository) {}

  async execute(code: string): Promise<Coupon | null> {
    return this.cartRepo.applyCoupon(code);
  }
}
