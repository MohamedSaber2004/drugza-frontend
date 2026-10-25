import { apiClient } from './client';
import { useI18n } from '@/composables/useI18n';
import {
  type Order,
  type OrderItem,
  type CreateOrderDto,
  type DeliveryTimeSlotDto,
  OrderStatus
} from '@/types';

export {
  type Order,
  type OrderItem,
  type CreateOrderDto,
  type DeliveryTimeSlotDto,
  OrderStatus
};

export interface BackendOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  inventoryName?: string;
  productPriceId: string;
  quantity: number;
  unitPrice: number;
  inventoryUserId?: string;
  status?: number;
}

export interface BackendSubOrderDto {
  id: string;
  inventoryUserId: string;
  inventoryName?: string;
  address?: string;
  orderDate?: string;
  status: number;
  totalAmount: number;
  deliveryName?: string;
  orderNote?: string;
  deliveryOptionName?: string;
  items?: BackendOrderItemDto[];
}

export interface BackendOrderGroupDto {
  orderNumber: string;
  doctorName?: string;
  phoneNumber?: string;
  status: number;
  totalAmountOrder: number;
  totalAmountOrderAfter?: number;
  coupon?: number;
  shippingFees?: number;
  orders?: BackendSubOrderDto[];
  items?: BackendOrderItemDto[];
}

/**
 * Returns localized status label, badge variant, and canonical status name
 */
export function getOrderStatusMeta(status: number | OrderStatus | undefined | string, customLocale?: string) {
  const { t } = useI18n();
  let code = 0;
  if (typeof status === 'number') {
    code = status;
  } else if (typeof status === 'string') {
    const num = parseInt(status, 10);
    if (!isNaN(num)) {
      code = num;
    } else {
      const lower = status.toLowerCase();
      if (lower.includes('partially')) code = OrderStatus.PartiallyRefunded;
      else if (lower.includes('refund')) code = OrderStatus.Refund;
      else if (lower.includes('deliver')) code = OrderStatus.Delivered;
      else if (lower.includes('complete')) code = OrderStatus.Completed;
      else if (lower.includes('ship')) code = OrderStatus.Shipped;
      else if (lower.includes('prepar')) code = OrderStatus.Prepared;
      else if (lower.includes('approv')) code = OrderStatus.Approved;
      else if (lower.includes('reject')) code = OrderStatus.Rejected;
      else if (lower.includes('reassign')) code = OrderStatus.ReAssignTo;
      else if (lower.includes('cancel')) code = OrderStatus.Cancel;
      else code = OrderStatus.Pending;
    }
  }

  switch (code) {
    case OrderStatus.Pending: // 0
      return {
        code,
        label: t('orders.status.pending'),
        variant: 'warning' as const,
        name: 'Pending'
      };
    case OrderStatus.Approved: // 1
      return {
        code,
        label: t('orders.status.approved'),
        variant: 'info' as const,
        name: 'Approved'
      };
    case OrderStatus.Rejected: // 2
      return {
        code,
        label: t('orders.status.rejected'),
        variant: 'danger' as const,
        name: 'Rejected'
      };
    case OrderStatus.Prepared: // 3
      return {
        code,
        label: t('orders.status.prepared'),
        variant: 'info' as const,
        name: 'Prepared'
      };
    case OrderStatus.Shipped: // 4
      return {
        code,
        label: t('orders.status.shipped'),
        variant: 'info' as const,
        name: 'Shipped'
      };
    case OrderStatus.Delivered: // 5
      return {
        code,
        label: t('orders.status.delivered'),
        variant: 'success' as const,
        name: 'Delivered'
      };
    case OrderStatus.Completed: // 6
      return {
        code,
        label: t('orders.status.completed'),
        variant: 'success' as const,
        name: 'Completed'
      };
    case OrderStatus.ReAssignTo: // 7
      return {
        code,
        label: t('orders.status.reassigned'),
        variant: 'warning' as const,
        name: 'ReAssignTo'
      };
    case OrderStatus.Refund: // 8
      return {
        code,
        label: t('orders.status.refunded'),
        variant: 'danger' as const,
        name: 'Refund'
      };
    case OrderStatus.Cancel: // 9
      return {
        code,
        label: t('orders.status.cancelled'),
        variant: 'neutral' as const,
        name: 'Cancel'
      };
    case OrderStatus.PartiallyRefunded: // 10
      return {
        code,
        label: t('orders.status.partiallyRefunded'),
        variant: 'warning' as const,
        name: 'PartiallyRefunded'
      };
    default:
      return {
        code,
        label: t('orders.status.pending'),
        variant: 'neutral' as const,
        name: 'Pending'
      };
  }
}

export function mapBackendOrder(group: any): Order {
  const allItems: OrderItem[] = [];
  let supplierName = '';
  let address = group.address || '';
  let createdAt = group.orderDate || new Date().toISOString();

  // 1. If orders array is present (multi-suborder structure)
  if (Array.isArray(group.orders)) {
    for (const sub of group.orders) {
      if (sub.inventoryName) supplierName = sub.inventoryName;
      if (sub.address) address = sub.address;
      if (sub.orderDate) createdAt = sub.orderDate;

      if (Array.isArray(sub.items)) {
        for (const item of sub.items) {
          allItems.push({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            inventoryName: item.inventoryName || sub.inventoryName,
            inventoryUserId: item.inventoryUserId || sub.inventoryUserId,
            quantity: item.quantity,
            price: item.unitPrice,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            status: item.status,
            statusCode: item.status
          });
        }
      }
    }
  }

  // 2. If items array is directly on the order group (single order structure as returned by API)
  if (Array.isArray(group.items)) {
    for (const item of group.items) {
      if (item.inventoryName && !supplierName) {
        supplierName = item.inventoryName;
      }
      allItems.push({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        inventoryName: item.inventoryName,
        inventoryUserId: item.inventoryUserId,
        quantity: item.quantity,
        price: item.unitPrice,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        status: item.status,
        statusCode: item.status
      });
    }
  }

  const rawStatusCode = typeof group.status === 'number' ? group.status : 0;
  const statusMeta = getOrderStatusMeta(rawStatusCode, 'en');

  const rawId = group.orderNumber || group.id || 'ORDER';
  const orderNumberStr = String(rawId);
  const formattedOrderNumber = orderNumberStr.toUpperCase().startsWith('DRG-')
    ? orderNumberStr.toUpperCase()
    : `DRG-${orderNumberStr.toUpperCase()}`;

  const calcSubtotal = allItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const subtotal = group.totalAmountOrder != null && group.totalAmountOrder > 0
    ? group.totalAmountOrder
    : (group.totalAmount != null && group.totalAmount > 0 ? group.totalAmount : calcSubtotal);
  const total = group.totalAmountOrderAfter != null && group.totalAmountOrderAfter > 0
    ? group.totalAmountOrderAfter
    : (subtotal + (group.shippingFees || 0));

  return {
    id: orderNumberStr,
    orderNumber: formattedOrderNumber,
    createdAt,
    status: statusMeta.name,
    statusCode: rawStatusCode,
    items: allItems,
    supplierId: group.orders?.[0]?.inventoryUserId || allItems[0]?.inventoryUserId || '',
    supplierName,
    subtotal,
    shippingFee: group.shippingFees || 0,
    total,
    deliveryAddress: address,
    estimatedDelivery: group.deliveryOptionName || ''
  };
}

export const ordersService = {
  /**
   * POST /api/Orders?addresssId=...&deliveryDate=1&orderNote=...&deliveryTimeSlotId=...&couponCode=...
   * Note backend query param typo: 'addresssId'
   */
  async createOrder(params: {
    addresssId?: string;
    deliveryDate?: number;
    orderNote?: string;
    deliveryTimeSlotId?: string;
    couponCode?: string;
  }) {
    const res = await apiClient.post('/api/Orders', null, {
      params: {
        ...(params.addresssId ? { addresssId: params.addresssId } : {}),
        deliveryDate: params.deliveryDate ?? 1,
        orderNote: params.orderNote || '',
        deliveryTimeSlotId: params.deliveryTimeSlotId,
        couponCode: params.couponCode
      }
    });
    return res.data;
  },

  /**
   * POST /api/Orders/add-order-manual
   */
  async createManualOrder(
    params: {
      AreaId?: number;
      deliveryDate?: number;
      orderNote?: string;
      deliveryTimeSlotId?: string;
    },
    body: CreateOrderDto
  ) {
    const res = await apiClient.post('/api/Orders/add-order-manual', body, {
      params
    });
    return res.data;
  },

  /**
   * GET /api/Orders/all-my-orders
   */
  async getAllMyOrders(): Promise<Order[]> {
    const res = await apiClient.get<BackendOrderGroupDto[]>('/api/Orders/all-my-orders');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapBackendOrder);
  },

  /**
   * GET /api/Orders/my-orders?status=...
   */
  async getMyOrders(status?: number): Promise<Order[]> {
    const res = await apiClient.get<BackendOrderGroupDto[]>('/api/Orders/my-orders', {
      params: { status }
    });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapBackendOrder);
  },

  /**
   * GET /api/Orders/orders/{orderId}
   */
  async getOrderById(orderId: string) {
    const res = await apiClient.get(`/api/Orders/orders/${orderId}`);
    return res.data;
  },

  /**
   * GET /api/Orders/details?orderNumber=...&status=...
   */
  async getOrderDetails(orderNumber: string, status?: number) {
    const res = await apiClient.get('/api/Orders/details', {
      params: { orderNumber, status }
    });
    return res.data;
  },

  /**
   * GET /api/Orders/get-status-order?orderId=...
   */
  async getOrderStatus(orderId: string) {
    const res = await apiClient.get('/api/Orders/get-status-order', {
      params: { orderId }
    });
    return res.data;
  },

  /**
   * GET /api/Orders/related-orders?orderNumber=...
   */
  async getRelatedOrders(orderNumber: string) {
    const res = await apiClient.get('/api/Orders/related-orders', {
      params: { orderNumber }
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Orders/recent-orders
   */
  async getRecentOrders() {
    const res = await apiClient.get('/api/Orders/recent-orders');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * PUT /api/Orders/cancel/{orderNumber}
   */
  async cancelOrder(orderNumber: string) {
    const res = await apiClient.put(`/api/Orders/cancel/${orderNumber}`);
    return res.data;
  },

  /**
   * GET /api/DeliveryTimeSlots?day=1
   */
  async getDeliveryTimeSlots(day = 1): Promise<DeliveryTimeSlotDto[]> {
    const res = await apiClient.get<DeliveryTimeSlotDto[]>('/api/DeliveryTimeSlots', {
      params: { day }
    });
    return Array.isArray(res.data) ? res.data : [];
  }
};
