import { apiClient, getImageUrl } from './client';
import type {
  CartItem,
  Product,
  AddToCartRequestDto,
  UpdateCartQuantityRequestDto,
  RemoveFromCartRequestDto
} from '@/types';
import { ceilPrice } from '@/utils/price';

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
    priceBeforeFlashSale?: number;
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
  const rawEffective = price?.effectiveSalesPrice ?? price?.salesPrice ?? 0;
  const effectivePrice = ceilPrice(rawEffective);
  // purchasePrice is the warehouse cost, not the customer-facing pre-discount price.
  const rawOriginal = price?.priceBeforeFlashSale ?? price?.salesPrice ?? rawEffective;
  const originalPrice = ceilPrice(rawOriginal);

  const productObj: Product = {
    id: item.productId,
    name: prod?.name || '',
    arabicName: prod?.arabicName?.trim() || undefined,
    strength: prod?.preef || '',
    form: '',
    packSize: prod?.preef || '',
    price: effectivePrice,
    originalPrice,
    discountRate: originalPrice > effectivePrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0,
    image: getImageUrl(prod?.productImage),
    inStock: (price?.stockQuantity ?? 0) > 0,
    stockQuantity: price?.stockQuantity ?? 0,
    description: prod?.description || ''
  };

  return {
    id: String(item.id),
    productId: item.productId,
    product: productObj,
    priceId: item.productPriceId,
    inventoryId: item.inventoryUserId,
    inventoryName: item.inventoryUser?.bussinesName?.trim() || item.inventoryUser?.userName || '',
    quantity: item.quantity,
    effectivePrice,
    originalPrice
  };
}

export function isValidGuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export const cartService = {
  /**
   * GET /api/Carts/{userId}
   */
  async getCart(userId: string): Promise<CartItem[]> {
    const res = await apiClient.get<BackendCartDto>(`/api/Carts/${encodeURIComponent(userId)}`, {
      headers: { 'X-Silent-Loading': 'true' }
    });
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
    const rawInv = payload.inventoryId || payload.productPriceId || '';
    if (!isValidGuid(rawInv)) {
      console.warn('[cartService.addToCart] Aborted: inventoryId must be a valid Guid. Received:', rawInv);
      return null;
    }
    const body: AddToCartRequestDto = {
      userId: payload.userId,
      inventoryId: rawInv,
      productId: payload.productId,
      quantity: payload.quantity
    };
    const res = await apiClient.post('/api/Carts/AddToCart', body, {
      headers: { 'X-Silent-Loading': 'true' }
    });
    return res.data;
  },

  /**
   * PUT /api/Carts/UpdateCartQuantity
   * Matches Swagger UpdateCartQuantityRequestDto: { userId, productId, inventoryId, quantity }
   */
  async updateCartQuantity(payload: UpdateCartQuantityPayload) {
    const rawInv = payload.inventoryId || '';
    if (!isValidGuid(rawInv)) {
      console.warn('[cartService.updateCartQuantity] Aborted: inventoryId must be a valid Guid. Received:', rawInv);
      return null;
    }
    const body: UpdateCartQuantityRequestDto = {
      userId: payload.userId,
      productId: payload.productId || String(payload.cartItemId || ''),
      inventoryId: rawInv,
      quantity: payload.quantity
    };
    const res = await apiClient.put('/api/Carts/UpdateCartQuantity', body, {
      headers: { 'X-Silent-Loading': 'true' }
    });
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
    const res = await apiClient.post('/api/Carts/RemoveFromCart', body, {
      headers: { 'X-Silent-Loading': 'true' }
    });
    return res.data;
  }
};
