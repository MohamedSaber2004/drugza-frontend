import type { IAuthRepository } from '@/core/domain/repositories';
import type { UserProfile, LoginCredentials, RegisterPharmacyData } from '@/core/domain/entities';
import type { IHttpClient } from '../http';
import type { IStorageService } from '../storage/storage.service';
import type { LoginResponseDto, VerifyOtpResponseDto, ForgotPasswordResponseDto } from '../dto';
import { EntityMapper } from '../mappers';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    private http: IHttpClient,
    private storage: IStorageService
  ) {}

  async login(credentials: LoginCredentials): Promise<{ token: string; user: UserProfile }> {
    const res = await this.http.post<LoginResponseDto>('/api/Users/login', {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password
    });

    const user = EntityMapper.toUserProfile(res);
    this.storage.setToken(res.token, credentials.rememberMe ?? true);
    this.storage.setUser(user, credentials.rememberMe ?? true);

    return { token: res.token, user };
  }

  async register(data: FormData | RegisterPharmacyData): Promise<{ success: boolean; token?: string; user?: UserProfile }> {
    let payload: FormData;
    if (data instanceof FormData) {
      payload = data;
    } else {
      payload = new FormData();
      payload.append('BussinesName', data.bussinesName);
      payload.append('FullName', data.fullName);
      payload.append('Email', data.email);
      payload.append('PhoneNumber', data.phoneNumber);
      payload.append('Password', data.password);
      if (data.role) payload.append('Role', data.role);
      if (data.commercialRegistration) payload.append('CommercialRegistration', data.commercialRegistration);
      if (data.taxCard) payload.append('TaxCard', data.taxCard);
      if (data.pharmacyLicense) payload.append('PharmacyLicense', data.pharmacyLicense);
    }

    const res = await this.http.post('/api/Users/register', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res?.token) {
      const user = EntityMapper.toUserProfile(res);
      this.storage.setToken(res.token, true);
      this.storage.setUser(user, true);
      return { success: true, token: res.token, user };
    }

    return { success: true };
  }

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const res = await this.http.post<VerifyOtpResponseDto>('/api/Users/verify-otp', null, {
      params: { email, code }
    });
    return res?.success !== false;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const res = await this.http.post<ForgotPasswordResponseDto>('/api/Users/forget-password', null, {
      params: { email }
    });
    return res?.success !== false;
  }

  async resetPassword(email: string, newPassword: string, code?: string): Promise<boolean> {
    const res = await this.http.post('/api/Users/reset-password', null, {
      params: { email, newPassword, code: code || '' }
    });
    return res !== false;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.storage.getUser();
  }

  async logout(): Promise<void> {
    this.storage.clearSession();
    window.dispatchEvent(new Event('drugza:cart-reset'));
  }

  async saveFcmToken(userId: string, token: string): Promise<void> {
    try {
      await this.http.post('/api/Users/save-fcm-token', null, {
        params: { userId, token },
        silentLoading: true
      });
    } catch (e) {
      console.warn('[AuthRepositoryImpl] FCM token sync skipped or failed', e);
    }
  }
}
