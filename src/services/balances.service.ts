import { apiClient } from './client';
import type {
  BalanceAccount,
  BalanceTransaction,
  BalanceSummaryDto,
  UpdateBalanceRequestDto,
  UpdateCreditLimitDto
} from '@/types';

export const balancesService = {
  /**
   * GET /api/Balances/user/{userId}
   */
  async getUserBalance(userId: string): Promise<BalanceAccount | null> {
    const res = await apiClient.get<BalanceAccount>(`/api/Balances/user/${userId}`);
    return res.data || null;
  },

  /**
   * GET /api/Balances/user-transactions/{userId}
   */
  async getUserTransactions(userId: string): Promise<BalanceTransaction[]> {
    const res = await apiClient.get<BalanceTransaction[]>(`/api/Balances/user-transactions/${userId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Balances/transactions/{accountId}
   */
  async getAccountTransactions(accountId: string): Promise<BalanceTransaction[]> {
    const res = await apiClient.get<BalanceTransaction[]>(`/api/Balances/transactions/${accountId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * POST /api/Balances/deposit/cash
   */
  async depositCash(payload: UpdateBalanceRequestDto) {
    const res = await apiClient.post('/api/Balances/deposit/cash', payload);
    return res.data;
  },

  /**
   * POST /api/Balances/withdraw/cash
   */
  async withdrawCash(payload: UpdateBalanceRequestDto) {
    const res = await apiClient.post('/api/Balances/withdraw/cash', payload);
    return res.data;
  },

  /**
   * PUT /api/Balances/credit-limit
   */
  async updateCreditLimit(payload: UpdateCreditLimitDto) {
    const res = await apiClient.put('/api/Balances/credit-limit', payload);
    return res.data;
  },

  /**
   * GET /api/reports/balance/summary
   */
  async getBalanceSummary(params?: {
    StartDate?: string;
    EndDate?: string;
    UserId?: string;
    AccountType?: number;
    TransactionType?: number;
    OrderId?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Promise<BalanceSummaryDto | null> {
    const res = await apiClient.get<BalanceSummaryDto>('/api/reports/balance/summary', {
      params
    });
    return res.data || null;
  }
};
