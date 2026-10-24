export interface ProductSupplierPrice {
  id?: string;
  supplierId: string;
  supplierName: string;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  stock: number;
  isAvailable: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  deliveryEstimate?: string;
  isColdChain?: boolean;
}

export interface Brand {
  id: number;
  name: string;
  nameAr?: string;
  nameEn?: string;
  logoUrl?: string;
  productCount?: number;
}

export interface ActiveIngredient {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  scientificName?: string;
  description?: string;
  imageUrl: string;
  images?: string[];
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  stock: number;
  isAvailable: boolean;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string;
  isColdChain?: boolean;
  requiresPrescription?: boolean;
  categoryId: string;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  supplierPrices?: ProductSupplierPrice[];
  activeIngredients?: ActiveIngredient[];
  barcode?: string;
  sku?: string;
  unit?: string;
}

export interface ProductQueryParams {
  lang?: number;
  search?: string;
  page?: number;
  size?: number;
  categoryId?: string;
  providerId?: string;
  brandId?: number;
  isFlashSale?: boolean;
}
