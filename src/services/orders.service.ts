import { apiClient } from './client';
import type {
  Order,
  OrderItem,
  CreateOrderDto,
  DeliveryTimeSlotDto
} from '@/types';

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
}

export function mapBackendOrder(group: BackendOrderGroupDto): Order {
  const allItems: OrderItem[] = [];
  let supplierName = 'Direct Warehouse';
  let address = 'Cairo, Egypt';
  let createdAt = new Date().toISOString();

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
            quantity: item.quantity,
            price: item.unitPrice,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          });
        }
      }
    }
  }

  // Map status: 10 is completed, 0-2 is pending/preparing, etc.
  let mappedStatus: Order['status'] = 'processing';
  if (group.status === 10) mappedStatus = 'delivered';
  else if (group.status === 8) mappedStatus = 'shipped';
  else if (group.status === 4 || group.status === 5) mappedStatus = 'confirmed';
  else if (group.status === -1) mappedStatus = 'cancelled';

  return {
    id: group.orderNumber,
    orderNumber: `DRG-${group.orderNumber.toUpperCase()}`,
    createdAt,
    status: mappedStatus,
    items: allItems,
    supplierId: group.orders?.[0]?.inventoryUserId || 'warehouse',
    supplierName,
    subtotal: group.totalAmountOrder || allItems.reduce((acc, i) => acc + i.totalPrice, 0),
    shippingFee: group.shippingFees || 0,
    total: group.totalAmountOrderAfter || group.totalAmountOrder || allItems.reduce((acc, i) => acc + i.totalPrice, 0),
    deliveryAddress: address,
    estimatedDelivery: 'Same Day GDP Cold-Chain'
  };
}

export const ordersService = {
  /**
   * POST /api/Orders?addresssId=...&deliveryDate=1&orderNote=...&deliveryTimeSlotId=...&couponCode=...
   * Note backend query param typo: 'addresssId'
   */
  async createOrder(params: {
    addresssId: string;
    deliveryDate?: number;
    orderNote?: string;
    deliveryTimeSlotId?: string;
    couponCode?: string;
  }) {
    const res = await apiClient.post('/api/Orders', null, {
      params: {
        addresssId: params.addresssId,
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
