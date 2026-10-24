import { getImageUrl } from '@/services/client';
import type {
  Product,
  ProductSupplierPrice,
  Category,
  Provider,
  Address,
  Order,
  OrderItem,
  Banner,
  BalanceAccount,
  BalanceTransaction,
  Invoice,
  UserProfile
} from '@/core/domain/entities';

import type {
  ProductApiDto,
  ProductSupplierPriceDto,
  CategoryApiDto,
  ProviderApiDto,
  AddressApiDto,
  OrderApiDto,
  OrderItemApiDto,
  BannerApiDto,
  BalanceAccountDto,
  BalanceTransactionDto,
  InvoiceApiDto,
  LoginResponseDto
} from '../dto';

export class EntityMapper {
  static toUserProfile(dto: LoginResponseDto): UserProfile {
    return {
      id: dto.id || '',
      fullName: dto.fullName || dto.email.split('@')[0],
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      businessName: dto.bussinesName || 'Community Pharmacy',
      role: (dto.role as any) || 'Pharmacy',
      verified: true
    };
  }

  static toProductSupplierPrice(dto: ProductSupplierPriceDto): ProductSupplierPrice {
    const rawPrice = dto.effectiveSalesPrice ?? dto.salesPrice ?? dto.price ?? 0;
    return {
      id: dto.id,
      supplierId: dto.inventoryUserId || dto.supplierId || '',
      supplierName: dto.inventoryName || dto.supplierName || 'Drugza Primary Hub',
      price: rawPrice,
      discountPercentage: dto.discountRate || 0,
      stock: dto.stockQuantity || 0,
      isAvailable: (dto.stockQuantity || 0) > 0,
      minOrderQuantity: dto.minOrder || 1,
      maxOrderQuantity: dto.maxQuantity,
      isColdChain: false
    };
  }

  static toProduct(dto: ProductApiDto): Product {
    const suppliers = (dto.supplierPrices || []).map(EntityMapper.toProductSupplierPrice);
    const effectivePrice = dto.price ?? (suppliers[0]?.price ?? 0);
    const stock = dto.stockQuantity ?? (dto.inStock ? 50 : 0);

    return {
      id: dto.id,
      name: dto.name || 'Pharmaceutical Product',
      nameAr: dto.arabicName || dto.name,
      nameEn: dto.name,
      scientificName: dto.activeIngredient,
      description: dto.description || dto.arabicDescription,
      imageUrl: getImageUrl(dto.image, 'product'),
      images: (dto.productImages || []).map(img => getImageUrl(img, 'product')),
      price: effectivePrice,
      oldPrice: dto.originalPrice,
      discountPercentage: dto.discountRate,
      stock: stock,
      isAvailable: stock > 0,
      isFlashSale: Boolean(dto.isFlashSale),
      categoryId: dto.categoryId || '',
      categoryName: dto.categoryName,
      brandId: dto.brandId,
      brandName: dto.brandName || dto.manufacturer,
      supplierPrices: suppliers
    };
  }

  static toCategory(dto: CategoryApiDto): Category {
    return {
      id: dto.id,
      name: dto.name || 'Category',
      nameAr: dto.arabicName || dto.name,
      nameEn: dto.name,
      imageUrl: getImageUrl(dto.imageName || dto.iconName, 'category'),
      productCount: dto.itemCount || 0,
      description: dto.description
    };
  }

  static toProvider(dto: ProviderApiDto): Provider {
    return {
      id: dto.id,
      name: dto.name || 'Supplier Hub',
      nameAr: dto.arabicName || dto.name,
      nameEn: dto.name,
      logoUrl: getImageUrl(dto.logo || dto.imagePath, 'provider'),
      rating: dto.rating || 4.8,
      deliveryTime: dto.deliveryTime || '24-48 Hours',
      minOrder: dto.minOrder || 0,
      productCount: dto.productCount || 0,
      city: dto.city || 'Cairo, Egypt'
    };
  }

  static toAddress(dto: AddressApiDto): Address {
    return {
      id: dto.id || '',
      name: dto.name || 'Pharmacy Dispensary',
      city: dto.city || dto.governorate || 'Cairo',
      region: dto.region || 'Central',
      street: dto.street || '',
      building: dto.building,
      floor: dto.floor,
      notes: dto.notes,
      phoneNumber: dto.phoneNumber,
      isDefault: Boolean(dto.isDefault),
      location: dto.latitude && dto.longitude ? {
        latitude: dto.latitude,
        longitude: dto.longitude
      } : undefined
    };
  }

  static toOrderItem(dto: OrderItemApiDto): OrderItem {
    const unitPrice = dto.unitPrice ?? dto.price ?? 0;
    const qty = dto.quantity || 1;
    return {
      id: dto.id,
      productId: dto.productId,
      productName: dto.productName || 'Product',
      productImage: getImageUrl(dto.productImage, 'product'),
      supplierId: dto.supplierId || '',
      supplierName: dto.supplierName || 'Drugza Hub',
      unitPrice,
      quantity: qty,
      totalPrice: dto.totalPrice ?? (unitPrice * qty)
    };
  }

  static toOrder(dto: OrderApiDto): Order {
    const rawItems = dto.orderItems || dto.items || [];
    const items = rawItems.map(EntityMapper.toOrderItem);
    const total = dto.totalAmount ?? dto.total ?? 0;

    let parsedStatus: any = 'Pending';
    if (typeof dto.status === 'string') {
      parsedStatus = dto.status;
    }

    return {
      id: dto.id,
      orderNumber: dto.orderNumber || `ORD-${dto.id.slice(0, 8)}`,
      createdAt: dto.createdAt || dto.createdOn || new Date().toISOString(),
      status: parsedStatus,
      items,
      subtotal: dto.subTotal ?? total,
      shippingFee: dto.shippingFee ?? dto.shipping ?? 0,
      discount: dto.discount ?? 0,
      totalAmount: total,
      deliveryAddressId: dto.addressId || '',
      deliveryAddressSummary: dto.deliveryAddress,
      paymentMethod: 'CashOnDelivery'
    };
  }

  static toBanner(dto: BannerApiDto): Banner {
    return {
      id: dto.id,
      title: dto.title,
      imageUrl: getImageUrl(dto.image || dto.imagePath, 'banner'),
      linkUrl: dto.url,
      isActive: dto.isActive !== false
    };
  }

  static toBalanceAccount(dto: BalanceAccountDto): BalanceAccount {
    return {
      userId: dto.userId || '',
      currentBalance: dto.balance || 0,
      currency: dto.currency || 'EGP',
      lastUpdated: dto.lastUpdated || new Date().toISOString()
    };
  }

  static toBalanceTransaction(dto: BalanceTransactionDto): BalanceTransaction {
    return {
      id: dto.id,
      transactionNumber: dto.transactionNumber || dto.id,
      amount: dto.amount || 0,
      type: (dto.type as any) || 'Credit',
      description: dto.description || '',
      date: dto.date || new Date().toISOString(),
      balanceAfter: dto.balanceAfter || 0
    };
  }

  static toInvoice(dto: InvoiceApiDto): Invoice {
    return {
      id: dto.id,
      invoiceNumber: dto.invoiceNumber || `INV-${dto.id.slice(0, 8)}`,
      orderId: dto.orderId || '',
      issuedAt: dto.issuedAt || new Date().toISOString(),
      totalAmount: dto.totalAmount || 0,
      taxAmount: dto.taxAmount || 0,
      status: (dto.status as any) || 'Paid',
      downloadUrl: dto.downloadUrl
    };
  }
}
