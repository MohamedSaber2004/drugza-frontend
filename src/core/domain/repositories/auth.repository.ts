import type { User, UserProfile, LoginCredentials, RegisterPharmacyData } from '../entities';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<{ token: string; user: UserProfile }>;
  register(data: FormData | RegisterPharmacyData): Promise<{ success: boolean; token?: string; user?: UserProfile }>;
  verifyOtp(email: string, code: string): Promise<boolean>;
  forgotPassword(email: string): Promise<boolean>;
  resetPassword(email: string, newPassword: string, code?: string): Promise<boolean>;
  getCurrentUser(): Promise<UserProfile | null>;
  logout(): Promise<void>;
  saveFcmToken(userId: string, token: string): Promise<void>;
}
