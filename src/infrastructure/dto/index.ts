/**
 * Drugza API Data Transfer Objects (DTOs)
 * Strict typing directly matching the Swagger Backend OpenAPI contracts
 */

export interface LoginRequestDto {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  id: string;
  email: string;
  fullName?: string;
  bussinesName?: string;
  phoneNumber?: string;
  role?: string;
  expiresIn?: number;
}

export interface RegisterUserDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  bussinesName: string;
  role?: string;
}

export interface VerifyOtpResponseDto {
  success?: boolean;
  message?: string;
}

export interface ForgotPasswordResponseDto {
  success?: boolean;
  message?: string;
}

export interface ProductApiDto {
  id: string;
  name?: string;
  arabicName?: string;
  strength?: string;
  form?: string;
  packSize?: string;
  price?: number;
  originalPrice?: number;
  discountRate?: number;
  brandId?: number;
  brandName?: string;
  manufacturer?: string;
  categoryId?: string;
  categoryName?: string;
  activeIngredient?: string;
  activeIngredientId?: string;
  image?: string;
  inStock?: boolean;
  stockQuantity?: number;
  minOrder?: number;
  description?: string;
  arabicDescription?: string;
  productImages?: string[];
  isPopular?: boolean;
  isFlashSale?: boolean;
  productPriceId?: string;
  inventoryId?: string;
  inventoryName?: string;
  supplierPrices?: ProductSupplierPriceDto[];
}

export interface ProductSupplierPriceDto {
  id?: string;
  inventoryUserId?: string;
  supplierId?: string;
  inventoryName?: string;
  supplierName?: string;
  salesPrice?: number;
  price?: number;
  discountRate?: number;
  effectiveSalesPrice?: number;
  stockQuantity?: number;
  maxQuantity?: number;
  minOrder?: number;
  isFlashActive?: boolean;
}

export interface CategoryApiDto {
  id: string;
  name?: string;
  arabicName?: string;
  description?: string;
  imageName?: string;
  iconName?: string;
  itemCount?: number;
}

export interface ProviderApiDto {
  id: string;
  name?: string;
  arabicName?: string;
  logo?: string;
  imagePath?: string;
  rating?: number;
  deliveryTime?: string;
  minOrder?: number;
  productCount?: number;
  city?: string;
}

export interface AddressApiDto {
  id?: string;
  name?: string;
  governorate?: string;
  city?: string;
  region?: string;
  street?: string;
  building?: string;
  floor?: string;
  notes?: string;
  phoneNumber?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface OrderApiDto {
  id: string;
  orderNumber?: string;
  createdAt?: string;
  createdOn?: string;
  status?: string | number;
  orderItems?: OrderItemApiDto[];
  items?: OrderItemApiDto[];
  total?: number;
  totalAmount?: number;
  subTotal?: number;
  shipping?: number;
  shippingFee?: number;
  discount?: number;
  addressId?: string;
  deliveryAddress?: string;
  paymentMethod?: string | number;
}

export interface OrderItemApiDto {
  id?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  supplierId?: string;
  supplierName?: string;
  unitPrice?: number;
  price?: number;
  quantity?: number;
  totalPrice?: number;
}

export interface BannerApiDto {
  id: string;
  title?: string;
  image?: string;
  imagePath?: string;
  url?: string;
  isActive?: boolean;
}

export interface BalanceAccountDto {
  userId?: string;
  balance?: number;
  currency?: string;
  lastUpdated?: string;
}

export interface BalanceTransactionDto {
  id: string;
  transactionNumber?: string;
  amount?: number;
  type?: string;
  description?: string;
  date?: string;
  balanceAfter?: number;
}

export interface InvoiceApiDto {
  id: string;
  invoiceNumber?: string;
  orderId?: string;
  issuedAt?: string;
  totalAmount?: number;
  taxAmount?: number;
  status?: string;
  downloadUrl?: string;
}
