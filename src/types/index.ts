export interface Product {
  id: string;
  name: string;
  arabicName?: string;
  strength?: string;
  form?: string; // Tablet, Capsule, Syrup, Ampoule, Cream
  packSize?: string; // e.g. "Pack: 20 Tablets", "Bottle 100ml"
  price: number; // Effective selling price (in EGP)
  originalPrice?: number;
  discountRate?: number; // e.g. 15%
  brandId?: number;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  activeIngredient?: string;
  activeIngredientId?: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  minOrder?: number;
  description?: string;
  suppliersCount?: number;
  isPopular?: boolean;
  isFlashSale?: boolean;
}

export interface ProductSupplierPrice {
  id: string;
  inventoryUserId: string;
  inventoryName: string;
  salesPrice: number;
  discountRate: number;
  effectiveSalesPrice: number;
  stockQuantity: number;
  maxQuantity: number;
  minOrder: number;
  isFlashActive: boolean;
  rating?: number;
  deliveryTime?: string;
}

export interface Category {
  id: string;
  name: string;
  arabicName?: string;
  description?: string;
  imageName?: string;
  iconName?: string;
  itemCount?: number;
  slug?: string;
}

export interface Supplier {
  id: string;
  businessName: string;
  arabicName?: string;
  email: string;
  profileImage?: string;
  isAvailableNow: boolean;
  minOrder?: number;
  rating?: number;
  deliverySpeed?: string;
  location?: string;
  itemsCount?: number;
  categoriesSupplied?: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  priceId?: string;
  inventoryId: string;
  inventoryName: string;
  quantity: number;
  effectivePrice: number;
  originalPrice: number;
  minOrder: number;
}

export interface UserProfile {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  countryId?: number;
  countryName?: string;
  cityId?: number;
  cityName?: string;
  areaId?: number;
  areaName?: string;
  addressLines?: string;
  profileImage?: string;
  verified: boolean;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  strength?: string;
  quantity: number;
  price?: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Preparing' | 'Shipped' | 'Delivered' | 'Completed' | 'Cancelled' | 'processing' | 'confirmed' | 'delivered' | 'shipped' | 'cancelled';
  totalAmount?: number;
  subtotal?: number;
  shippingFee?: number;
  total: number;
  supplierId?: string;
  supplierName: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliverySlot?: string;
  estimatedDelivery?: string;
  paymentMethod?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export interface Address {
  id: string;
  title: string; // e.g. "Main Pharmacy Branch", "Warehouse Hub"
  recipientName: string;
  phoneNumber: string;
  cityName: string;
  areaName: string;
  streetAddress: string;
  buildingNumber?: string;
  floor?: string;
  landmark?: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'discount' | 'stock' | 'system';
  isRead: boolean;
  link?: string;
}

// Re-export full Swagger OpenAPI DTOs and Enums
export * from './api';

