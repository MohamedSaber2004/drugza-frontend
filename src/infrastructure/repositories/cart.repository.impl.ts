import type { ICartRepository } from '@/core/domain/repositories';
import type { CartItem, CartSummary, Coupon } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { IStorageService } from '../storage/storage.service';

export class CartRepositoryImpl implements ICartRepository {
  private readonly CART_STORAGE_KEY = 'drugza_cart';
  private readonly COUPON_STORAGE_KEY = 'drugza_coupon';

  constructor(
    private http: IHttpClient,
    private storage: IStorageService
  ) {}

  private getStoredItems(): CartItem[] {
    const raw = this.storage.getItem<CartItem[]>(this.CART_STORAGE_KEY);
    return Array.isArray(raw) ? raw : [];
  }

  private saveStoredItems(items: CartItem[]): void {
    this.storage.setItem(this.CART_STORAGE_KEY, items, true);
  }

  private calculateSummary(items: CartItem[], coupon?: Coupon | null): CartSummary {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    let discountAmount = 0;
    if (coupon) {
      if (coupon.discountAmount) {
        discountAmount = coupon.discountAmount;
      } else if (coupon.discountPercentage) {
        discountAmount = (subtotal * coupon.discountPercentage) / 100;
      }
    }

    const shippingFee = subtotal > 1000 || subtotal === 0 ? 0 : 50;
    const total = Math.max(0, subtotal - discountAmount + shippingFee);

    return {
      items,
      subtotal,
      discountAmount,
      shippingFee,
      total,
      totalItemsCount,
      appliedCoupon: coupon || null
    };
  }

  async getCart(): Promise<CartSummary> {
    const items = this.getStoredItems();
    const coupon = this.storage.getItem<Coupon>(this.COUPON_STORAGE_KEY);
    return this.calculateSummary(items, coupon);
  }

  async addItem(productId: string, supplierId: string, quantity: number): Promise<CartSummary> {
    const items = this.getStoredItems();
    const existingIndex = items.findIndex(
      i => i.productId === productId && i.supplierId === supplierId
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      // Fetch product detail to construct CartItem if needed
      let productData: any = null;
      try {
        productData = await this.http.get(`/api/Products/${productId}`);
      } catch {
        // Fallback
      }

      items.push({
        id: `cart-${productId}-${supplierId}-${Date.now()}`,
        productId,
        product: productData || { id: productId, name: 'Product', price: 0, imageUrl: '' },
        supplierId,
        supplierName: 'Supplier Hub',
        price: productData?.price || 0,
        quantity,
        maxStock: 999
      });
    }

    this.saveStoredItems(items);
    return this.getCart();
  }

  async updateQuantity(itemId: string, quantity: number): Promise<CartSummary> {
    let items = this.getStoredItems();
    if (quantity <= 0) {
      items = items.filter(i => i.id !== itemId);
    } else {
      const target = items.find(i => i.id === itemId);
      if (target) {
        target.quantity = quantity;
      }
    }

    this.saveStoredItems(items);
    return this.getCart();
  }

  async removeItem(itemId: string): Promise<CartSummary> {
    const items = this.getStoredItems().filter(i => i.id !== itemId);
    this.saveStoredItems(items);
    return this.getCart();
  }

  async clearCart(): Promise<void> {
    this.storage.removeItem(this.CART_STORAGE_KEY);
    this.storage.removeItem(this.COUPON_STORAGE_KEY);
  }

  async applyCoupon(code: string): Promise<Coupon | null> {
    try {
      const res = await this.http.post<any>('/api/Coupons/validate', { code });
      const coupon: Coupon = {
        code,
        discountPercentage: res?.discountPercentage || 10,
        discountAmount: res?.discountAmount,
        minOrderValue: res?.minOrder
      };
      this.storage.setItem(this.COUPON_STORAGE_KEY, coupon, true);
      return coupon;
    } catch {
      // Fallback for valid demo coupon
      if (code.toUpperCase() === 'DRUGZA10') {
        const coupon: Coupon = { code: 'DRUGZA10', discountPercentage: 10 };
        this.storage.setItem(this.COUPON_STORAGE_KEY, coupon, true);
        return coupon;
      }
      return null;
    }
  }

  async removeCoupon(): Promise<void> {
    this.storage.removeItem(this.COUPON_STORAGE_KEY);
  }
}
