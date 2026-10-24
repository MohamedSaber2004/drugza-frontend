import { ref, computed } from 'vue';
import type { CartItem, Product, ProductSupplierPrice } from '@/types';
import { cartService, isValidGuid } from '@/services/cart.service';
import { productsService } from '@/services/products.service';
import { useToast } from './useToast';
import { useI18n } from './useI18n';

const CART_STORAGE_KEY = 'drugza_cart_items';
const CART_OWNER_KEY = 'drugza_cart_owner';
const QUANTITY_SYNC_DELAY = 450;

const items = ref<CartItem[]>(
  localStorage.getItem(CART_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)
    : []
);

const isCartDrawerOpen = ref(false);
const isLoading = ref(false);

// Fired by the API client when a session is rejected, so account-scoped cart
// rows do not leak into whichever account signs in next.
if (typeof window !== 'undefined') {
  window.addEventListener('drugza:cart-reset', () => {
    items.value = [];
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_OWNER_KEY);
  });
}

function getStored(key: string): string | null {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function getUserId(): string | null {
  try {
    const raw = getStored('drugza_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.id && !u.id.startsWith('usr-')) {
        return u.id;
      }
    }

    const token = getStored('drugza_token');
    if (token) {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const id =
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          payload.nameid ||
          payload.sub;
        if (id) return id;
      }
    }

    if (raw) {
      const u = JSON.parse(raw);
      return u.id || null;
    }
  } catch {
    //
  }
  return null;
}

export function useCart() {
  const toast = useToast();
  const { locale } = useI18n();

  function persist() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value));
    localStorage.setItem(CART_OWNER_KEY, getUserId() || 'guest');
  }

  let latestCartRequestId = 0;

  async function fetchServerCart() {
    const userId = getUserId();
    if (!userId) return;

    const requestId = ++latestCartRequestId;
    try {
      isLoading.value = true;
      const serverItems = await cartService.getCart(userId);
      if (requestId !== latestCartRequestId) return;
      // Server is the source of truth; keep locally-only rows the API cannot represent.
      const localOnly = items.value.filter(i => !isValidGuid(i.inventoryId));
      items.value = [...serverItems, ...localOnly];
      persist();
    } catch {
      // Keep local items if server fails
    } finally {
      if (requestId === latestCartRequestId) isLoading.value = false;
    }
  }

  async function pushItemsToServer(userId: string, list: CartItem[]) {
    let existing: CartItem[] = [];
    try {
      existing = await cartService.getCart(userId);
    } catch {
      // Proceed without the dedupe guard if the read fails
    }
    const rowKey = (row: { productId: string; inventoryId: string }) =>
      `${row.productId}::${row.inventoryId}`;
    const existingKeys = new Set(existing.map(rowKey));

    for (const item of list) {
      if (!isValidGuid(item.inventoryId)) continue;
      // AddToCart increments quantities, so skip rows the server already tracks
      if (existingKeys.has(rowKey(item))) continue;
      try {
        await cartService.addToCart({
          userId,
          productId: item.productId,
          inventoryId: item.inventoryId,
          productPriceId: item.priceId,
          quantity: item.quantity
        });
      } catch (e) {
        console.warn('[useCart] Failed to sync item to server:', e);
      }
    }
  }

  /**
   * Loads the backend cart on app boot. If the stored cart still belongs to a
   * guest (or another account), its rows are pushed to the current user's cart
   * before the server snapshot replaces the local state.
   */
  async function hydrateCart() {
    const userId = getUserId();
    if (!userId) return;

    const owner = localStorage.getItem(CART_OWNER_KEY);
    if ((!owner || owner === 'guest') && items.value.length > 0) {
      await pushItemsToServer(userId, items.value);
    }
    await fetchServerCart();
  }

  /**
   * Group items by supplier / provider inventory
   */
  const suppliersGroups = computed(() => {
    const groups: Record<string, {
      inventoryId: string;
      inventoryName: string;
      items: CartItem[];
      subtotal: number;
      distinctItemsCount: number;
      totalPiecesCount: number;
    }> = {};

    for (const item of items.value) {
      const key = item.inventoryId || 'default-supplier';
      if (!groups[key]) {
        const defaultName = locale.value === 'ar' ? 'مستودع دراجزا المركزي' : 'Drugza Central Warehouse';
        groups[key] = {
          inventoryId: key,
          inventoryName: item.inventoryName || defaultName,
          items: [],
          subtotal: 0,
          distinctItemsCount: 0,
          totalPiecesCount: 0
        };
      }
      const group = groups[key]!;
      group.items.push(item);
      group.subtotal += item.effectivePrice * item.quantity;
      group.totalPiecesCount += item.quantity;
    }

    for (const id in groups) {
      groups[id]!.distinctItemsCount = groups[id]!.items.length;
    }

    return Object.values(groups);
  });

  /**
   * Cart count is calculated based on number of DIFFERENT products (distinct items),
   * not total piece quantity, as explicitly requested.
   */
  const totalItemsCount = computed(() => {
    return items.value.length;
  });

  /**
   * Total pieces across all items (if total units count is needed)
   */
  const totalPiecesCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  const totalCartAmount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.effectivePrice * item.quantity, 0);
  });

  const totalOriginalAmount = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.originalPrice || item.effectivePrice) * item.quantity, 0);
  });

  const totalSavings = computed(() => {
    return Math.max(0, totalOriginalAmount.value - totalCartAmount.value);
  });

  function getItemQuantity(productId: string): number {
    const it = items.value.find(i => i.productId === productId);
    return it ? it.quantity : 0;
  }

  /**
   * Adds product piece by piece (1 by 1)
   */
  async function addItem(product: Product, quantity = 1, supplierPrice?: ProductSupplierPrice) {
    let resolvedSupplierPrice = supplierPrice;

    // If no supplier price provided and product lacks a valid GUID inventoryId, fetch available supplier prices
    if (!resolvedSupplierPrice && (!product.inventoryId || !isValidGuid(product.inventoryId))) {
      try {
        const prices = await productsService.getSupplierPricesForProduct(product.id);
        if (prices && prices.length > 0) {
          resolvedSupplierPrice = prices[0];
        }
      } catch {
        // Fallback handled below
      }
    }

    const defaultName = locale.value === 'ar' ? 'مستودع دراجزا المعتمد' : 'Drugza Authorized Hub';
    const serverInvId = resolvedSupplierPrice?.inventoryUserId
      || (isValidGuid(product.inventoryId) ? product.inventoryId : null);
    const invId = serverInvId || product.inventoryId || (product.manufacturer ? `sup-${product.manufacturer}` : 'default-supplier');
    const invName = resolvedSupplierPrice?.inventoryName || product.inventoryName || defaultName;
    const effPrice = resolvedSupplierPrice?.effectiveSalesPrice || product.price;
    const origPrice = resolvedSupplierPrice?.salesPrice || product.originalPrice || effPrice;

    const existingIndex = items.value.findIndex(
      it => it.productId === product.id && it.inventoryId === invId
    );

    if (existingIndex > -1) {
      items.value[existingIndex]!.quantity += quantity;
    } else {
      items.value.push({
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        product,
        priceId: resolvedSupplierPrice?.id || product.productPriceId,
        inventoryId: invId,
        inventoryName: invName,
        quantity,
        effectivePrice: effPrice,
        originalPrice: origPrice
      });
    }

    persist();

    const prodName = locale.value === 'ar' ? (product.arabicName || product.name) : product.name;
    if (locale.value === 'ar') {
      toast.success(
        quantity === 1
          ? `تمت إضافة قطعة واحدة من (${prodName}) إلى السلة.`
          : `تمت إضافة ${quantity} قطع من (${prodName}) إلى السلة.`,
        'تمت الإضافة للسلة'
      );
    } else {
      toast.success(`Added ${quantity}x ${product.name} to cart.`, 'Item Added');
    }

    // Sync with the backend cart whenever the item can be expressed as a server row
    const userId = getUserId();
    if (userId && serverInvId && isValidGuid(serverInvId)) {
      try {
        await cartService.addToCart({
          userId,
          productId: product.id,
          inventoryId: serverInvId,
          productPriceId: resolvedSupplierPrice?.id || product.productPriceId,
          quantity
        });
        await fetchServerCart();
      } catch (err) {
        console.warn('[useCart] Failed to sync item with server cart:', err);
      }
    }
  }

  const quantitySyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function syncKey(item: CartItem): string {
    return `${item.productId}::${item.inventoryId}`;
  }

  function clearQuantitySync(item: CartItem) {
    const key = syncKey(item);
    const timer = quantitySyncTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      quantitySyncTimers.delete(key);
    }
  }

  function scheduleQuantitySync(item: CartItem) {
    const userId = getUserId();
    if (!userId || !isValidGuid(item.inventoryId)) return;

    const key = syncKey(item);
    const pending = quantitySyncTimers.get(key);
    if (pending) clearTimeout(pending);

    quantitySyncTimers.set(key, setTimeout(async () => {
      quantitySyncTimers.delete(key);
      try {
        await cartService.updateCartQuantity({
          userId,
          productId: item.productId,
          inventoryId: item.inventoryId,
          quantity: item.quantity
        });
      } catch (err) {
        console.warn('[useCart] Failed to sync quantity with server:', err);
        await fetchServerCart();
      }
    }, QUANTITY_SYNC_DELAY));
  }

  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }
    const item = items.value.find(i => i.id === itemId);
    if (item) {
      item.quantity = newQty;
      persist();
      scheduleQuantitySync(item);
    }
  }

  async function removeItem(itemId: string) {
    const item = items.value.find(i => i.id === itemId);
    const prodName = item ? (locale.value === 'ar' ? (item.product.arabicName || item.product.name) : item.product.name) : 'Item';
    const prodId = item?.productId;
    if (item) clearQuantitySync(item);
    items.value = items.value.filter(i => i.id !== itemId);
    persist();
    toast.info(
      locale.value === 'ar'
        ? `تمت إزالة (${prodName}) من سلة المشتريات.`
        : `${prodName} removed from your cart.`
    );

    const userId = getUserId();
    if (userId && prodId) {
      try {
        await cartService.removeFromCart({
          userId,
          productId: prodId,
          cartItemId: itemId
        });
        await fetchServerCart();
      } catch (err) {
        console.warn('[useCart] Failed to remove item from server cart:', err);
      }
    }
  }

  async function syncGuestCartToServer(userId: string) {
    if (!userId) return;
    await pushItemsToServer(userId, items.value);
    await fetchServerCart();
  }

  async function clearCart() {
    const snapshot = items.value;
    items.value = [];
    persist();

    const userId = getUserId();
    if (!userId) return;
    for (const item of snapshot) {
      clearQuantitySync(item);
      try {
        await cartService.removeFromCart({ userId, productId: item.productId });
      } catch (err) {
        console.warn('[useCart] Failed to clear server cart item:', err);
      }
    }
  }

  function resetLocalCart() {
    items.value = [];
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_OWNER_KEY);
  }

  function openCartDrawer() {
    isCartDrawerOpen.value = true;
  }

  function closeCartDrawer() {
    isCartDrawerOpen.value = false;
  }

  return {
    items,
    isLoading,
    suppliersGroups,
    totalItemsCount,
    totalPiecesCount,
    totalCartAmount,
    totalOriginalAmount,
    totalSavings,
    isCartDrawerOpen,
    getItemQuantity,
    fetchServerCart,
    hydrateCart,
    syncGuestCartToServer,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    resetLocalCart,
    openCartDrawer,
    closeCartDrawer
  };
}
