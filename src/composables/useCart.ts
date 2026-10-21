import { ref, computed } from 'vue';
import type { CartItem, Product, ProductSupplierPrice } from '@/types';
import { cartService } from '@/services/cart.service';
import { useToast } from './useToast';

const CART_STORAGE_KEY = 'drugza_cart_items';

const items = ref<CartItem[]>(
  localStorage.getItem(CART_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)
    : []
);

const isCartDrawerOpen = ref(false);
const isLoading = ref(false);

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem('drugza_user');
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

  function persist() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value));
  }

  async function fetchServerCart() {
    const userId = getUserId();
    if (!userId) return;
    try {
      isLoading.value = true;
      const serverItems = await cartService.getCart(userId);
      if (Array.isArray(serverItems) && serverItems.length > 0) {
        items.value = serverItems;
        persist();
      }
    } catch {
      // Keep local items if server fails
    } finally {
      isLoading.value = false;
    }
  }

  // Group items by supplier / inventory
  const suppliersGroups = computed(() => {
    const groups: Record<string, {
      inventoryId: string;
      inventoryName: string;
      minOrder: number;
      items: CartItem[];
      subtotal: number;
      remainingToMin: number;
      meetsMinOrder: boolean;
    }> = {};

    for (const item of items.value) {
      if (!groups[item.inventoryId]) {
        groups[item.inventoryId] = {
          inventoryId: item.inventoryId,
          inventoryName: item.inventoryName,
          minOrder: item.minOrder || 800,
          items: [],
          subtotal: 0,
          remainingToMin: 0,
          meetsMinOrder: false
        };
      }
      const group = groups[item.inventoryId]!;
      group.items.push(item);
      group.subtotal += item.effectivePrice * item.quantity;
    }

    // Calculate remaining amounts
    for (const id in groups) {
      const g = groups[id]!;
      g.remainingToMin = Math.max(0, g.minOrder - g.subtotal);
      g.meetsMinOrder = g.subtotal >= g.minOrder;
    }

    return Object.values(groups);
  });

  const totalItemsCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  const totalCartAmount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.effectivePrice * item.quantity, 0);
  });

  const totalOriginalAmount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  });

  const totalSavings = computed(() => {
    return Math.max(0, totalOriginalAmount.value - totalCartAmount.value);
  });

  const canProceedToCheckout = computed(() => {
    if (items.value.length === 0) return false;
    return suppliersGroups.value.every(g => g.meetsMinOrder);
  });

  async function addItem(product: Product, quantity = 1, supplierPrice?: ProductSupplierPrice) {
    const invId = supplierPrice?.inventoryUserId || 'warehouse';
    const invName = supplierPrice?.inventoryName || 'Authorized Distributor';
    const effPrice = supplierPrice?.effectiveSalesPrice || product.price;
    const origPrice = supplierPrice?.salesPrice || product.originalPrice || product.price;
    const minOrd = supplierPrice?.minOrder || 800;

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
        priceId: supplierPrice?.id,
        inventoryId: invId,
        inventoryName: invName,
        quantity,
        effectivePrice: effPrice,
        originalPrice: origPrice,
        minOrder: minOrd
      });
    }

    persist();
    toast.success(`Added ${quantity}x ${product.name} to cart.`, 'Item Added');

    // Call server API in background if authenticated
    const userId = getUserId();
    if (userId) {
      try {
        await cartService.addToCart({
          userId,
          productId: product.id,
          inventoryId: invId,
          productPriceId: supplierPrice?.id,
          quantity
        });
      } catch {
        // Fallback handled
      }
    }
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

      const userId = getUserId();
      if (userId) {
        try {
          await cartService.updateCartQuantity({
            userId,
            productId: item.productId,
            inventoryId: item.inventoryId,
            cartItemId: itemId,
            quantity: newQty
          });
        } catch {
          //
        }
      }
    }
  }

  async function removeItem(itemId: string) {
    const item = items.value.find(i => i.id === itemId);
    const name = item?.product.name || 'Item';
    const prodId = item?.productId;
    items.value = items.value.filter(i => i.id !== itemId);
    persist();
    toast.info(`${name} removed from your cart.`);

    const userId = getUserId();
    if (userId && prodId) {
      try {
        await cartService.removeFromCart({
          userId,
          productId: prodId,
          cartItemId: itemId
        });
      } catch {
        //
      }
    }
  }

  function clearCart() {
    items.value = [];
    persist();
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
    totalCartAmount,
    totalOriginalAmount,
    totalSavings,
    canProceedToCheckout,
    isCartDrawerOpen,
    fetchServerCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCartDrawer,
    closeCartDrawer
  };
}
