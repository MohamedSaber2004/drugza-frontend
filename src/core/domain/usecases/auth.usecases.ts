import type { IAuthRepository } from '../repositories';
import type { LoginCredentials, RegisterPharmacyData, UserProfile } from '../entities';

export class LoginUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<{ token: string; user: UserProfile }> {
    if (!credentials.usernameOrEmail || !credentials.password) {
      throw new Error('Email/Username and password are required');
    }
    return this.authRepo.login(credentials);
  }
}

export class RegisterUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(data: FormData | RegisterPharmacyData): Promise<{ success: boolean; token?: string; user?: UserProfile }> {
    return this.authRepo.register(data);
  }
}

export class VerifyOtpUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(email: string, code: string): Promise<boolean> {
    return this.authRepo.verifyOtp(email, code);
  }
}

export class ForgotPasswordUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(email: string): Promise<boolean> {
    return this.authRepo.forgotPassword(email);
  }
}

export class ResetPasswordUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(email: string, newPass: string, code?: string): Promise<boolean> {
    return this.authRepo.resetPassword(email, newPass, code);
  }
}

export class LogoutUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.authRepo.logout();
  }
}

export class GetCurrentUserUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(): Promise<UserProfile | null> {
    return this.authRepo.getCurrentUser();
  }
}
