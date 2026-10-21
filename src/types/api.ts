/**
 * Drugza API v1 - Swagger OpenAPI 3.0.4 Type Definitions
 * Exact mapping for DTOs, Request/Response payloads
 */

// ----------------------------------------------------
// Common Enums & Primitives
// ----------------------------------------------------
export enum DeliveryOption {
  Standard = 1,
  Urgent = 2
}

export enum PaymentMethod {
  Cash = 1,
  Credit = 2,
  Online = 3
}

export enum ReturnOrderStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Completed = 3
}

// ----------------------------------------------------
// Active Ingredients
// ----------------------------------------------------
export interface ActiveIngredientDto {
  id?: string;
  name?: string;
  arabicName?: string;
  description?: string;
  arabicDescription?: string;
  preef?: string;
  arabicPreef?: string;
}

export interface ActiveIngredient {
  id: string;
  name: string;
  arabicName?: string;
  description?: string;
  arabicDescription?: string;
  preef?: string;
  arabicPreef?: string;
}

// ----------------------------------------------------
// Brands
// ----------------------------------------------------
export interface Brand {
  id: number;
  name: string;
  arName?: string;
  imagePath?: string;
  isPopular?: boolean;
}

// ----------------------------------------------------
// Balances & Wallet
// ----------------------------------------------------
export interface BalanceAccount {
  id: string;
  userId: string;
  accountType?: number;
  balance: number;
  creditLimit: number;
  isActive: boolean;
}

export interface BalanceTransaction {
  id: string;
  balanceAccountId: string;
  amount: number;
  transactionDate: string;
  description?: string;
  transactionType: number; // 1: Deposit, 2: Withdrawal, 3: Order Payment, etc.
  orderId?: string;
  orderNumber?: string;
  userId?: string;
  userName?: string;
}

export interface BalanceSummaryDto {
  totalBalance: number;
  totalCreditLimit: number;
  totalAccounts: number;
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface BalanceAccountReportDto {
  id: string;
  userId: string;
  userName?: string;
  accountType: number;
  balance: number;
  creditLimit: number;
  isActive: boolean;
}

export interface UpdateBalanceRequestDto {
  userId: string;
  amount: number;
  description?: string;
}

export interface UpdateCreditLimitDto {
  accountId: string;
  newLimit: number;
}

// ----------------------------------------------------
// Cart DTOs (Strictly aligned with Swagger)
// ----------------------------------------------------
export interface AddToCartRequestDto {
  userId?: string;
  inventoryId: string;
  productId: string;
  quantity: number;
}

export interface UpdateCartQuantityRequestDto {
  userId?: string;
  productId: string;
  inventoryId: string;
  quantity: number;
}

export interface RemoveFromCartRequestDto {
  userId?: string;
  productId: string;
}

// ----------------------------------------------------
// Coupons DTOs
// ----------------------------------------------------
export interface ApplyCouponDto {
  code: string;
  amount: number;
}

export interface CouponApplicabilityDto {
  applicableType: number;
  applicableId: string;
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: number;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive: boolean;
  applicabilities?: CouponApplicabilityDto[];
}

export interface CouponUsageDto {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
}

// ----------------------------------------------------
// Orders & Delivery Slots
// ----------------------------------------------------
export interface CreateOrderDto {
  couponId?: string | null;
  userId: string;
  totalAmount: number;
  items?: OrderItemDto[];
  paymentMethod: PaymentMethod;
  creditAmount?: number | null;
}

export interface OrderItemDto {
  id?: string;
  productId: string;
  productName?: string;
  inventoryName?: string;
  productPriceId: string;
  quantity: number;
  unitPrice: number;
  inventoryUserId?: string;
  status?: number;
}

export interface DeliveryTimeSlotDto {
  id: string;
  name?: string;
  from: string;
  to: string;
  isActive?: boolean;
  isNow?: boolean;
}

export interface CreateDeliveryTimeSlotDto {
  from: string;
  to: string;
}

export interface UpdateDeliveryTimeSlotDto {
  from: string;
  to: string;
  isActive: boolean;
}

// ----------------------------------------------------
// Invoices
// ----------------------------------------------------
export interface Invoice {
  id: string;
  orderId: string;
  invoiceDate: string;
  totalAmount: number;
  orderNumber: string;
  userId: string;
  invoiceTypeId?: number;
}

export interface InvoiceReportDto {
  id: string;
  invoiceNumber?: string;
  invoiceDate: string;
  totalAmount: number;
  invoiceType?: number;
  orderId: string;
  userId: string;
  inventoryName?: string;
  inventoryId?: string;
  userName?: string;
  bussinesName?: string;
  creditUsed?: number;
  cashPaid?: number;
  paymentMethod?: string;
  orderNumber?: string;
  coupon?: number;
  shippingFees?: number;
}

export interface InvoiceType {
  id: number;
  name: string;
  description?: string;
}

// ----------------------------------------------------
// Returns
// ----------------------------------------------------
export interface ReturnedItemDto {
  productId: string;
  productPriceId: string;
  quantityReturned: number;
  itemPrice: number;
  reasonId: string;
  otherReason?: string;
}

export interface CreateReturnOrderDto {
  orderNumber: string;
  items: ReturnedItemDto[];
}

export interface ReturnOrderDto {
  id: string;
  orderId: string;
  pharmacyUserId: string;
  pharmacyName?: string;
  requestDate: string;
  status: number;
  totalReturnValue: number;
  returnOrderNumber: string;
  inventoryUserId: string;
  inventoryUser?: string;
  items?: ReturnedItemDto[];
}

export interface ReturnReasonDto {
  id: string;
  reason: string;
}

export interface UpdateReturnStatusDto {
  status: number;
}

// ----------------------------------------------------
// Addresses & Geo Hierarchy
// ----------------------------------------------------
export interface CreateAddressDto {
  userId?: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  floorNum?: number;
  apartmentNum?: number;
  areaId: number;
}

export interface UpdateAddressDto {
  addressLine: string;
}

export interface CountryDto {
  id: number;
  name: string;
}

export interface CityDto {
  id: number;
  name: string;
  countryId: number;
}

export interface AreaDto {
  id: number;
  name: string;
  cityId: number;
}

export interface ZoneDto {
  id: number;
  name: string;
}
