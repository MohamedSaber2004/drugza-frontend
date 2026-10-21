import { apiClient, getImageUrl } from './client';
import type {
  CartItem,
  Product,
  AddToCartRequestDto,
  UpdateCartQuantityRequestDto,
  RemoveFromCartRequestDto
} from '@/types';

export interface BackendCartItemDto {
  id: number | string;
  productId: string;
  product?: {
    id: string;
    name: string;
    preef?: string;
    description?: string;
    arabicName?: string;
    productImage?: string;
  };
  quantity: number;
  totalAmount?: number;
  productPriceId: string;
  productPrice?: {
    id: string;
    productId: string;
    purchasePrice?: number;
    salesPrice?: number;
    effectiveSalesPrice?: number;
    stockQuantity?: number;
    maxQuantity?: number;
  };
  inventoryUserId: string;
  inventoryUser?: {
    id: string;
    bussinesName?: string;
    photo?: string;
    isActive?: boolean;
    userName?: string;
    minOrder?: number;
  };
}

export interface BackendCartDto {
  id: string;
  userId: string;
  totalAmountCart: number;
  isAvailableNow?: boolean;
  isFlashSale?: boolean;
  items: BackendCartItemDto[];
}

export interface AddToCartPayload {
  userId?: string;
  productId: string;
  inventoryId?: string;
  productPriceId?: string;
  quantity: number;
}

export interface UpdateCartQuantityPayload {
  userId?: string;
  productId?: string;
  inventoryId?: string;
  cartItemId?: number | string;
  quantity: number;
}

export interface RemoveFromCartPayload {
  userId?: string;
  productId?: string;
  cartItemId?: number | string;
}

export function mapBackendCartItem(item: BackendCartItemDto): CartItem {
  const prod = item.product;
  const price = item.productPrice;
  const effectivePrice = price?.effectiveSalesPrice ?? price?.salesPrice ?? 25;
  const originalPrice = price?.purchasePrice ?? (effectivePrice ? +(effectivePrice * 1.15).toFixed(2) : 30);

  const productObj: Product = {
    id: item.productId,
    name: prod?.name || 'Pharmaceutical Item',
    arabicName: prod?.arabicName?.trim() || undefined,
    strength: prod?.preef || 'Standard Dosage',
    form: 'Tablet',
    packSize: prod?.preef || 'Box',
    price: effectivePrice,
    originalPrice,
    discountRate: originalPrice > effectivePrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0,
    image: getImageUrl(prod?.productImage),
    inStock: (price?.stockQuantity ?? 1) > 0,
    stockQuantity: price?.stockQuantity ?? 50,
    minOrder: 1,
    description: prod?.description || ''
  };

  return {
    id: String(item.id),
    productId: item.productId,
    product: productObj,
    priceId: item.productPriceId,
    inventoryId: item.inventoryUserId,
    inventoryName: item.inventoryUser?.bussinesName?.trim() || item.inventoryUser?.userName || 'Authorized Distributor',
    quantity: item.quantity,
    effectivePrice,
    originalPrice,
    minOrder: item.inventoryUser?.minOrder || 800
  };
}

export const cartService = {
  /**
   * GET /api/Carts/{userId}
   */
  async getCart(userId: string): Promise<CartItem[]> {
    const res = await apiClient.get<BackendCartDto>(`/api/Carts/${userId}`);
    if (res.data && Array.isArray(res.data.items)) {
      return res.data.items.map(mapBackendCartItem);
    }
    return [];
  },

  /**
   * POST /api/Carts/AddToCart
   * Matches Swagger AddToCartRequestDto: { userId, inventoryId, productId, quantity }
   */
  async addToCart(payload: AddToCartPayload) {
    const body: AddToCartRequestDto = {
      userId: payload.userId,
      inventoryId: payload.inventoryId || payload.productPriceId || '',
      productId: payload.productId,
      quantity: payload.quantity
    };
    const res = await apiClient.post('/api/Carts/AddToCart', body);
    return res.data;
  },

  /**
   * PUT /api/Carts/UpdateCartQuantity
   * Matches Swagger UpdateCartQuantityRequestDto: { userId, productId, inventoryId, quantity }
   */
  async updateCartQuantity(payload: UpdateCartQuantityPayload) {
    const body: UpdateCartQuantityRequestDto = {
      userId: payload.userId,
      productId: payload.productId || String(payload.cartItemId || ''),
      inventoryId: payload.inventoryId || '',
      quantity: payload.quantity
    };
    const res = await apiClient.put('/api/Carts/UpdateCartQuantity', body);
    return res.data;
  },

  /**
   * POST /api/Carts/RemoveFromCart
   * Matches Swagger RemoveFromCartRequestDto: { userId, productId }
   */
  async removeFromCart(payload: RemoveFromCartPayload) {
    const body: RemoveFromCartRequestDto = {
      userId: payload.userId,
      productId: payload.productId || String(payload.cartItemId || '')
    };
    const res = await apiClient.post('/api/Carts/RemoveFromCart', body);
    return res.data;
  }
};
