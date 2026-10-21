import { apiClient } from './client';
import type { ApplyCouponDto, CreateCouponDto, CouponUsageDto } from '@/types';

export interface AvailableCouponDto {
  id: string;
  code: string;
  discountPercentage?: number;
  discountAmount?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  description?: string;
  validUntil?: string;
  isActive?: boolean;
}

export const couponsService = {
  /**
   * GET /api/Coupons/available?orderTotal=...
   */
  async getAvailableCoupons(orderTotal: number): Promise<AvailableCouponDto[]> {
    const res = await apiClient.get<AvailableCouponDto[]>('/api/Coupons/available', {
      params: { orderTotal }
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Coupons?activeOnly=false
   */
  async getCoupons(activeOnly = false): Promise<AvailableCouponDto[]> {
    const res = await apiClient.get<AvailableCouponDto[]>('/api/Coupons', {
      params: { activeOnly }
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Coupons/{id}
   */
  async getCouponById(id: string): Promise<AvailableCouponDto | null> {
    const res = await apiClient.get<AvailableCouponDto>(`/api/Coupons/${id}`);
    return res.data || null;
  },

  /**
   * POST /api/Coupons/apply
   * Matches Swagger ApplyCouponDto: { code, amount }
   */
  async applyCoupon(code: string, amount: number) {
    const payload: ApplyCouponDto = {
      code,
      amount
    };
    const res = await apiClient.post('/api/Coupons/apply', payload);
    return res.data;
  },

  /**
   * GET /api/Coupons/{id}/usages
   */
  async getCouponUsages(id: string): Promise<CouponUsageDto[]> {
    const res = await apiClient.get<CouponUsageDto[]>(`/api/Coupons/${id}/usages`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * GET /api/Coupons/{id}/redemptions
   */
  async getCouponRedemptions(id: string) {
    const res = await apiClient.get(`/api/Coupons/${id}/redemptions`);
    return res.data;
  },

  /**
   * POST /api/Coupons
   */
  async createCoupon(data: CreateCouponDto) {
    const res = await apiClient.post('/api/Coupons', data);
    return res.data;
  }
};
