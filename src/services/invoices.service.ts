import { apiClient } from './client';
import type { Invoice, InvoiceReportDto } from '@/types';

export const invoicesService = {
  /**
   * GET /api/Invoices/{id}
   */
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const res = await apiClient.get<Invoice>(`/api/Invoices/${id}`);
    return res.data || null;
  },

  /**
   * GET /api/Invoices/{orderNumber}
   */
  async getInvoiceByOrderNumber(orderNumber: string): Promise<Invoice | null> {
    const res = await apiClient.get<Invoice>(`/api/Invoices/${orderNumber}`);
    return res.data || null;
  },

  /**
   * GET /api/Invoices/order/{orderId}
   */
  async getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
    const res = await apiClient.get<Invoice>(`/api/Invoices/order/${orderId}`);
    return res.data || null;
  },

  /**
   * GET /api/Invoices/user/{userId}
   */
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    const res = await apiClient.get<Invoice[]>(`/api/Invoices/user/${userId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Invoices/Inventory/{userId}
   */
  async getInventoryInvoices(userId: string): Promise<Invoice[]> {
    const res = await apiClient.get<Invoice[]>(`/api/Invoices/Inventory/${userId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * POST /api/Invoices/generate/{OrderNumber}
   */
  async generateInvoice(orderNumber: string) {
    const res = await apiClient.post(`/api/Invoices/generate/${orderNumber}`);
    return res.data;
  },

  /**
   * GET /api/reports/invoices
   */
  async getInvoicesReport(params?: {
    StartDate?: string;
    EndDate?: string;
    UserId?: string;
    InventoryUserId?: string;
    RegionId?: string;
    Status?: number;
    PaymentMethod?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Promise<{ items: InvoiceReportDto[]; totalCount: number } | null> {
    const res = await apiClient.get('/api/reports/invoices', { params });
    return res.data || null;
  }
};
