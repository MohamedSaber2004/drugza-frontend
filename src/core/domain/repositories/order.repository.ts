import type { Order, ReturnOrder } from '../entities';

export interface CheckoutPayload {
  addressId: string;
  notes?: string;
  paymentMethod: 'CashOnDelivery' | 'Balance' | 'OnlineCard';
  couponCode?: string;
}

export interface IOrderRepository {
  createOrder(payload: CheckoutPayload): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  cancelOrder(id: string, reason?: string): Promise<boolean>;
  getPharmacyReturns(): Promise<ReturnOrder[]>;
  createReturnOrder(orderId: string, reason: string): Promise<ReturnOrder>;
}
