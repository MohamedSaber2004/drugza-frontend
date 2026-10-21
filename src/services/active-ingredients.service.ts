import { apiClient } from './client';
import type { ActiveIngredientDto, ActiveIngredient } from '@/types';

export interface ActiveIngredientsPaginatedResponse {
  items?: ActiveIngredientDto[];
  data?: ActiveIngredientDto[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

export const activeIngredientsService = {
  /**
   * GET /api/ActiveIngerients
   * Note the backend typo in route: 'ActiveIngerients'
   */
  async getActiveIngredients(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
  }): Promise<ActiveIngredient[]> {
    const res = await apiClient.get('/api/ActiveIngerients', {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 20,
        search: params?.search
      }
    });

    const list: ActiveIngredientDto[] = Array.isArray(res.data)
      ? res.data
      : (res.data?.items || res.data?.data || []);

    return list.map((item) => ({
      id: item.id || '',
      name: item.name || '',
      arabicName: item.arabicName?.trim() || undefined,
      description: item.description || '',
      arabicDescription: item.arabicDescription?.trim() || undefined,
      preef: item.preef || '',
      arabicPreef: item.arabicPreef?.trim() || undefined
    }));
  },

  /**
   * GET /api/ActiveIngerients/{id}
   */
  async getActiveIngredientById(id: string): Promise<ActiveIngredient | null> {
    const res = await apiClient.get<ActiveIngredientDto>(`/api/ActiveIngerients/${id}`);
    if (!res.data) return null;
    return {
      id: res.data.id || id,
      name: res.data.name || '',
      arabicName: res.data.arabicName?.trim() || undefined,
      description: res.data.description || '',
      arabicDescription: res.data.arabicDescription?.trim() || undefined,
      preef: res.data.preef || '',
      arabicPreef: res.data.arabicPreef?.trim() || undefined
    };
  }
};
