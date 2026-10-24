export interface Provider {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  logoUrl?: string;
  rating?: number;
  deliveryTime?: string;
  minOrder?: number;
  productCount?: number;
  isColdChainCertified?: boolean;
  city?: string;
}

// Supplier is an alias for Provider in domain terms
export type Supplier = Provider;
