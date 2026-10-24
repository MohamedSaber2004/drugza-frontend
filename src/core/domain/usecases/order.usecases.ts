import type { IOrderRepository, CheckoutPayload } from '../repositories';
import type { Order, ReturnOrder } from '../entities';

export class CheckoutOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(payload: CheckoutPayload): Promise<Order> {
    if (!payload.addressId) {
      throw new Error('Delivery address is required for checkout');
    }
    return this.orderRepo.createOrder(payload);
  }
}

export class GetUserOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepo.getOrders();
  }
}

export class GetOrderDetailUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string): Promise<Order | null> {
    return this.orderRepo.getOrderById(id);
  }
}

export class CancelOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string, reason?: string): Promise<boolean> {
    return this.orderRepo.cancelOrder(id, reason);
  }
}

export class GetPharmacyReturnsUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(): Promise<ReturnOrder[]> {
    return this.orderRepo.getPharmacyReturns();
  }
}

export class CreateReturnOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string, reason: string): Promise<ReturnOrder> {
    return this.orderRepo.createReturnOrder(orderId, reason);
  }
}
