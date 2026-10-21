import { apiClient } from './client';
import type {
  ReturnOrderDto,
  ReturnReasonDto,
  CreateReturnOrderDto,
  UpdateReturnStatusDto
} from '@/types';

export const returnsService = {
  /**
   * POST /api/returns
   */
  async createReturnOrder(payload: CreateReturnOrderDto) {
    const res = await apiClient.post('/api/returns', payload);
    return res.data;
  },

  /**
   * GET /api/returns/{id}
   */
  async getReturnById(id: string): Promise<ReturnOrderDto | null> {
    const res = await apiClient.get<ReturnOrderDto>(`/api/returns/${id}`);
    return res.data || null;
  },

  /**
   * GET /api/returns/pharmacy
   */
  async getPharmacyReturns(): Promise<ReturnOrderDto[]> {
    const res = await apiClient.get<ReturnOrderDto[]>('/api/returns/pharmacy');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/returns/vendor
   */
  async getVendorReturns(): Promise<ReturnOrderDto[]> {
    const res = await apiClient.get<ReturnOrderDto[]>('/api/returns/vendor');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/ReturnReasons or /api/returns/reasons
   */
  async getReturnReasons(): Promise<ReturnReasonDto[]> {
    try {
      const res = await apiClient.get<ReturnReasonDto[]>('/api/ReturnReasons');
      if (Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }

    const res2 = await apiClient.get<ReturnReasonDto[]>('/api/returns/reasons');
    return Array.isArray(res2.data) ? res2.data : [];
  },

  /**
   * GET /api/returns/GetWithDetailsById?id=...
   */
  async getReturnWithDetails(id: string): Promise<ReturnOrderDto | null> {
    const res = await apiClient.get<ReturnOrderDto>('/api/returns/GetWithDetailsById', {
      params: { id }
    });
    return res.data || null;
  },

  /**
   * GET /api/returns/related-returns?returnNumber=...
   */
  async getRelatedReturns(returnNumber: string): Promise<ReturnOrderDto[]> {
    const res = await apiClient.get<ReturnOrderDto[]>('/api/returns/related-returns', {
      params: { returnNumber }
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * PUT /api/returns/{id}/status
   */
  async updateReturnStatus(id: string, payload: UpdateReturnStatusDto) {
    const res = await apiClient.put(`/api/returns/${id}/status`, payload);
    return res.data;
  }
};
