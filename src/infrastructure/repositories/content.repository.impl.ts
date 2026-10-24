import type { IContentRepository } from '@/core/domain/repositories';
import type { PolicyDocument, BalanceAccount, BalanceTransaction, Invoice, NotificationItem } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { BalanceAccountDto, BalanceTransactionDto, InvoiceApiDto } from '../dto';
import { EntityMapper } from '../mappers';

export class ContentRepositoryImpl implements IContentRepository {
  constructor(private http: IHttpClient) {}

  async getTermsAndConditions(): Promise<PolicyDocument | string> {
    try {
      const res = await this.http.get<any>('/api/Policy/terms');
      return res;
    } catch {
      return 'Terms and conditions placeholder content';
    }
  }

  async getPrivacyPolicy(): Promise<PolicyDocument | string> {
    try {
      const res = await this.http.get<any>('/api/Policy/privacy');
      return res;
    } catch {
      return 'Privacy policy placeholder content';
    }
  }

  async getUserBalance(userId: string): Promise<BalanceAccount | null> {
    try {
      const res = await this.http.get<BalanceAccountDto>(`/api/Balances/${userId}`);
      return res ? EntityMapper.toBalanceAccount(res) : null;
    } catch {
      return null;
    }
  }

  async getUserTransactions(userId: string): Promise<BalanceTransaction[]> {
    try {
      const raw = await this.http.get<BalanceTransactionDto[]>(`/api/Balances/${userId}/transactions`);
      const list = Array.isArray(raw) ? raw : [];
      return list.map(EntityMapper.toBalanceTransaction);
    } catch {
      return [];
    }
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    try {
      const raw = await this.http.get<InvoiceApiDto[]>(`/api/Invoices/user/${userId}`);
      const list = Array.isArray(raw) ? raw : [];
      return list.map(EntityMapper.toInvoice);
    } catch {
      return [];
    }
  }

  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const raw = await this.http.get<any[]>('/api/Notifications');
      const list = Array.isArray(raw) ? raw : [];
      return list.map((n: any) => ({
        id: n.id || `notif-${Date.now()}`,
        title: n.title || 'Notification',
        message: n.message || '',
        createdAt: n.createdAt || new Date().toISOString(),
        isRead: Boolean(n.isRead),
        actionUrl: n.actionUrl
      }));
    } catch {
      return [];
    }
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      await this.http.post(`/api/Notifications/${id}/read`);
      return true;
    } catch {
      return false;
    }
  }
}
