import type { PolicyDocument, BalanceAccount, BalanceTransaction, Invoice, NotificationItem } from '../entities';

export interface IContentRepository {
  getTermsAndConditions(): Promise<PolicyDocument | string>;
  getPrivacyPolicy(): Promise<PolicyDocument | string>;
  getUserBalance(userId: string): Promise<BalanceAccount | null>;
  getUserTransactions(userId: string): Promise<BalanceTransaction[]>;
  getUserInvoices(userId: string): Promise<Invoice[]>;
  getNotifications(): Promise<NotificationItem[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
}
