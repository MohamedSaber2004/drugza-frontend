import type { IOrderRepository, CheckoutPayload } from '@/core/domain/repositories';
import type { Order, ReturnOrder } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { OrderApiDto } from '../dto';
import { EntityMapper } from '../mappers';

export class OrderRepositoryImpl implements IOrderRepository {
  constructor(private http: IHttpClient) {}

  async createOrder(payload: CheckoutPayload): Promise<Order> {
    const res = await this.http.post<OrderApiDto>('/api/Orders', {
      addressId: payload.addressId,
      notes: payload.notes,
      paymentMethod: payload.paymentMethod === 'CashOnDelivery' ? 1 : 2,
      couponCode: payload.couponCode
    });
    return EntityMapper.toOrder(res);
  }

  async getOrders(): Promise<Order[]> {
    const raw = await this.http.get<any[]>('/api/Orders');
    const list: OrderApiDto[] = Array.isArray(raw) ? raw : (raw?.items || []);
    return list.map(EntityMapper.toOrder);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const res = await this.http.get<OrderApiDto>(`/api/Orders/${id}`);
    return res ? EntityMapper.toOrder(res) : null;
  }

  async cancelOrder(id: string, reason?: string): Promise<boolean> {
    await this.http.post(`/api/Orders/${id}/cancel`, { reason });
    return true;
  }

  async getPharmacyReturns(): Promise<ReturnOrder[]> {
    const raw = await this.http.get<any[]>('/api/Returns');
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => ({
      id: item.id || `ret-${Date.now()}`,
      orderId: item.orderId || '',
      orderNumber: item.orderNumber,
      reason: item.reason || 'General Return',
      status: item.status || 'Pending',
      createdAt: item.createdAt || new Date().toISOString(),
      itemsCount: item.itemsCount || 1,
      refundAmount: item.refundAmount
    }));
  }

  async createReturnOrder(orderId: string, reason: string): Promise<ReturnOrder> {
    const res = await this.http.post<any>('/api/Returns', { orderId, reason });
    return {
      id: res.id || `ret-${Date.now()}`,
      orderId: res.orderId || orderId,
      orderNumber: res.orderNumber,
      reason: res.reason || reason,
      status: res.status || 'Pending',
      createdAt: res.createdAt || new Date().toISOString(),
      itemsCount: res.itemsCount || 1,
      refundAmount: res.refundAmount
    };
  }
}
