import { apiClient } from './client';
import type { NotificationItem } from '@/types';

export interface BackendNotificationDto {
  id: string;
  title?: string;
  message?: string;
  creationDate?: string;
  createdAt?: string;
  isRead?: boolean;
  type?: string;
}

export const notificationsService = {
  /**
   * GET /api/Notifacations/{userId}
   */
  async getUserNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const res = await apiClient.get<BackendNotificationDto[]>(`/api/Notifacations/${userId}`);
      if (Array.isArray(res.data)) {
        return res.data.map((n, idx) => ({
          id: n.id || `notif-${idx}`,
          title: n.title || 'Notification',
          message: n.message || '',
          time: n.createdAt || n.creationDate || 'Recent',
          type: (n.type as any) || 'order',
          isRead: n.isRead ?? false
        }));
      }
    } catch {
      // Fallback empty
    }
    return [];
  },

  /**
   * GET /api/Notifacations/Get-All-Notifications
   */
  async getAllNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await apiClient.get<BackendNotificationDto[]>('/api/Notifacations/Get-All-Notifications');
      if (Array.isArray(res.data)) {
        return res.data.map((n, idx) => ({
          id: n.id || `notif-${idx}`,
          title: n.title || 'Notification',
          message: n.message || '',
          time: n.createdAt || 'Recent',
          type: (n.type as any) || 'order',
          isRead: n.isRead ?? false
        }));
      }
    } catch {
      // Fallback empty
    }
    return [];
  },

  /**
   * POST /api/Users/save-fcm-token
   */
  async saveFcmToken(userId: string, token: string) {
    return apiClient.post('/api/Users/save-fcm-token', { userId, token });
  }
};

