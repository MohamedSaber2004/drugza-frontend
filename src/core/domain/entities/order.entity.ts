export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  productImage?: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isColdChain?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  deliveryAddressId: string;
  deliveryAddressSummary?: string;
  paymentMethod: 'CashOnDelivery' | 'Balance' | 'OnlineCard';
  invoiceId?: string;
}

export interface ReturnOrder {
  id: string;
  orderId: string;
  orderNumber?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  createdAt: string;
  itemsCount: number;
  refundAmount?: number;
}
