import { apiClient } from './client';
import { cachedRequest } from '@/utils/cache';

export interface UserAddressDto {
  id: string;
  userId: string;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
  floorNum: number | null;
  apartmentNum: number | null;
}

export interface LoginRequestDto {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponseDto {
  id: string;
  bussinesName: string;
  email: string;
  phoneNumber: string;
  addresses: UserAddressDto[];
  token: string;
  hasDetails: boolean;
  message: string | null;
  role: string;
}

export interface VerifyOtpResponseDto {
  message?: string;
  isVerified?: boolean;
}

export interface ForgotPasswordResponseDto {
  message?: string;
}

export interface ResetPasswordResponseDto {
  message?: string;
}

export interface ResendOtpResponseDto {
  message?: string;
}

export const authService = {
  /**
   * 1. Login user
   * POST /api/Users/login
   */
  async login(credentials: LoginRequestDto) {
    return apiClient.post<LoginResponseDto>('/api/Users/login', {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password
    });
  },

  /**
   * 2. Register user
   * POST /api/Users/register
   */
  async register(formData: FormData) {
    return apiClient.post('/api/Users/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * 3. Verify OTP code
   * POST /api/Users/verify-otp?email=...&code=...
   */
  async verifyOtp(email: string, code: string) {
    return apiClient.post<VerifyOtpResponseDto>('/api/Users/verify-otp', null, {
      params: {
        email,
        code
      }
    });
  },

  /**
   * 4. Forgot Password request
   * POST /api/Users/forget-password?email=...
   */
  async forgotPassword(email: string) {
    return apiClient.post<ForgotPasswordResponseDto>('/api/Users/forget-password', null, {
      params: {
        email
      }
    });
  },

  /**
   * 5. Reset Password
   * POST /api/Users/reset-password?email=...&newPassword=...
   */
  async resetPassword(email: string, newPassword: string) {
    return apiClient.post<ResetPasswordResponseDto>('/api/Users/reset-password', null, {
      params: {
        email,
        newPassword
      }
    });
  },

  /**
   * 6. Resend OTP code
   * POST /api/Users/resend-otp?email=...
   */
  async resendOtp(email: string) {
    return apiClient.post<ResendOtpResponseDto>('/api/Users/resend-otp', null, {
      params: {
        email
      }
    });
  },

  /**
   * 7. Get Roles (Cached 30 minutes)
   * GET /api/Roles/get-roles
   */
  async getRoles(force = false) {
    return cachedRequest(
      'auth_roles_list',
      async () => {
        const res = await apiClient.get<Array<{ id: string; name: string }>>('/api/Roles/get-roles');
        return Array.isArray(res.data) ? res.data : [];
      },
      { ttlMs: 30 * 60 * 1000, force }
    );
  },

  /**
   * 8. Change Password
   * POST /api/Users/ChangePassword
   */
  async changePassword(oldPassword: string, newPassword: string) {
    return apiClient.post('/api/Users/ChangePassword', {
      oldPassword,
      newPassword
    });
  },

  /**
   * 9. Save FCM Token
   * POST /api/Users/save-fcm-token
   */
  async saveFcmToken(payload: SaveFcmTokenDto) {
    return apiClient.post('/api/Users/save-fcm-token', payload);
  },

  /**
   * 10. Get User Profile by ID
   * GET /api/Users/user/{userId}
   */
  async getUserProfile(userId: string) {
    return apiClient.get<BackendUserDto>(`/api/Users/user/${userId}`);
  },

  /**
   * 11. Update User Profile
   * PUT /api/Users/{id}
   */
  async updateUserProfile(userId: string, formData: FormData) {
    return apiClient.put(`/api/Users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export interface SaveFcmTokenDto {
  userId: string;
  token: string;
}

export interface BackendUserDto {
  id: string;
  bussinesName?: string | null;
  fullName?: string | null;
  userName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean | null;
  isEmailConfirmed?: boolean | null;
  isInventory?: boolean | null;
  isPharmacy?: boolean | null;
  countryId?: number | null;
  country?: { id: number; name: string } | null;
  cityId?: number | null;
  city?: { id: number; name: string } | null;
  areaId?: number | null;
  area?: { id: number; name: string } | null;
  salary?: number | null;
  minOrder?: number | null;
  orderNum?: number | null;
  isPopular?: boolean | null;
  profileImage?: string | null;
  createdAt?: string | null;
  addresses?: Array<{
    id: string;
    userId?: string;
    addressLine?: string | null;
    floorNum?: number | null;
    apartmentNum?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  }> | null;
  userRoles?: Array<{
    roleId?: string;
    role?: { id: string; name: string };
  }> | null;
}

