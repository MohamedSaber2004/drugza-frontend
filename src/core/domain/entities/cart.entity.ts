import type { Product } from './product.entity';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  supplierId: string;
  supplierName: string;
  price: number;
  quantity: number;
  maxStock: number;
  isColdChain?: boolean;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  discountAmount?: number;
  minOrderValue?: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  totalItemsCount: number;
  appliedCoupon?: Coupon | null;
}
