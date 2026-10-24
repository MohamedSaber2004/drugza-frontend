import type { CartItem, CartSummary, Coupon } from '../entities';

export interface ICartRepository {
  getCart(): Promise<CartSummary>;
  addItem(productId: string, supplierId: string, quantity: number): Promise<CartSummary>;
  updateQuantity(itemId: string, quantity: number): Promise<CartSummary>;
  removeItem(itemId: string): Promise<CartSummary>;
  clearCart(): Promise<void>;
  applyCoupon(code: string): Promise<Coupon | null>;
  removeCoupon(): Promise<void>;
}
