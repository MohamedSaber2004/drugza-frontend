export type UserRole = 'Pharmacy' | 'Admin' | 'Supplier' | 'Customer';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  businessName?: string;
  role: UserRole;
  verified: boolean;
  avatarUrl?: string;
  commercialRegistrationNumber?: string;
  taxNumber?: string;
  pharmacyLicenseNumber?: string;
}

export interface User {
  id: string;
  token: string;
  profile: UserProfile;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPharmacyData {
  bussinesName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: string;
  commercialRegistration?: File | null;
  taxCard?: File | null;
  pharmacyLicense?: File | null;
}
