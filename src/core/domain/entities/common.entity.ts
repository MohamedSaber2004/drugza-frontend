export interface Banner {
  id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  type?: 'hero' | 'promo' | 'category';
}

export interface PolicyDocument {
  id: string;
  type: 'privacy' | 'terms';
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  lastUpdated: string;
}

export interface BalanceAccount {
  userId: string;
  currentBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface BalanceTransaction {
  id: string;
  transactionNumber: string;
  amount: number;
  type: 'Credit' | 'Debit';
  description: string;
  date: string;
  balanceAfter: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  issuedAt: string;
  totalAmount: number;
  taxAmount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  downloadUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
