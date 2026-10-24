import { ref, computed } from 'vue';
import type { UserProfile, Address, NotificationItem } from '@/types';
import { authService, type LoginResponseDto, type BackendUserDto } from '@/services/auth.service';
import { getImageUrl } from '@/services/client';
import { useToast } from './useToast';
import { useCart } from './useCart';

export function mapBackendUserToProfile(d: BackendUserDto, existing?: UserProfile | null): UserProfile {
  const roleName =
    d.userRoles?.[0]?.role?.name ||
    (d.isPharmacy ? 'Pharmacy' : d.isInventory ? 'Distributor' : existing?.role || 'Pharmacy');

  const primaryAddr =
    d.addresses && d.addresses.length > 0 && d.addresses[0]?.addressLine
      ? d.addresses[0].addressLine
      : existing?.addressLines || '';

  return {
    id: d.id || existing?.id || '',
    businessName: d.bussinesName?.trim() || existing?.businessName || '',
    fullName: d.fullName?.trim() || d.userName?.trim() || existing?.fullName || '',
    userName: d.userName?.trim() || existing?.userName || '',
    email: d.email?.trim() || existing?.email || '',
    phoneNumber: d.phoneNumber?.trim() || existing?.phoneNumber || '',
    role: roleName,
    countryId: d.countryId ?? d.country?.id ?? existing?.countryId,
    countryName: d.country?.name || existing?.countryName || '',
    cityId: d.cityId ?? d.city?.id ?? existing?.cityId,
    cityName: d.city?.name || existing?.cityName || '',
    areaId: d.areaId ?? d.area?.id ?? existing?.areaId,
    areaName: d.area?.name || existing?.areaName || '',
    addressLines: primaryAddr,
    profileImage: d.profileImage ? getImageUrl(d.profileImage, 'provider') : existing?.profileImage,
    verified: d.isActive ?? true,
    isActive: d.isActive ?? true,
    isEmailConfirmed: d.isEmailConfirmed ?? false,
    createdAt: d.createdAt || existing?.createdAt,
    minOrder: d.minOrder ?? existing?.minOrder,
    salary: d.salary ?? existing?.salary
  };
}

const TOKEN_KEY = 'drugza_token';
const USER_KEY = 'drugza_user';
const ADDRESSES_KEY = 'drugza_addresses';
const NOTIFICATIONS_KEY = 'drugza_notifications';

import { addressService } from '@/services/address.service';
import { notificationsService } from '@/services/notifications.service';
import { useFavorites } from './useFavorites';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const token = ref<string | null>(getStoredToken());
const user = ref<UserProfile | null>(getStoredUser());
const rawCachedAddresses: Address[] = localStorage.getItem(ADDRESSES_KEY)
  ? JSON.parse(localStorage.getItem(ADDRESSES_KEY)!)
  : [];
const addresses = ref<Address[]>(
  rawCachedAddresses.map(a => ({
    ...a,
    recipientName: a.recipientName === 'Community Pharmacist' ? '' : a.recipientName,
    phoneNumber: a.phoneNumber === '+20 100 000 0000' ? '' : a.phoneNumber,
    deliveryInstructions: a.deliveryInstructions === 'Official pharmacy receiving desk - 24/7 cold-chain inspection' ? '' : a.deliveryInstructions,
    landmark: (a.landmark && /^apt\s*\d+/i.test(a.landmark)) ? '' : a.landmark,
    apartment: a.apartment || (a.landmark && /^apt\s*(\d+)/i.exec(a.landmark)?.[1] ? /^apt\s*(\d+)/i.exec(a.landmark)![1] : '')
  }))
);
const notifications = ref<NotificationItem[]>(
  localStorage.getItem(NOTIFICATIONS_KEY) ? JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)!) : []
);

const isLoading = ref(false);
const authError = ref<string | null>(null);

function parseJwt(jwtToken: string): Record<string, any> | null {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data.message) return data.message;
    if (data.title) return data.title;
    if (data.error) return data.error;
    if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey][0]) {
        return data.errors[firstKey][0];
      }
    }
  }
  return err.message || fallback;
}

const FCM_TOKEN_KEY = 'drugza_fcm_token';

export function getOrGenerateFcmToken(): string {
  let t = localStorage.getItem(FCM_TOKEN_KEY);
  if (!t) {
    t = 'fcm_web_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem(FCM_TOKEN_KEY, t);
  }
  return t;
}

async function syncFcmToken(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const fcmToken = getOrGenerateFcmToken();
    await authService.saveFcmToken({
      userId,
      token: fcmToken
    });
    console.log(`[FCM] Token saved for user: ${userId}`);
    return true;
  } catch (err) {
    console.warn('[FCM] save-fcm-token failed:', err);
    return false;
  }
}

export function useAuth() {
  const toast = useToast();

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const unreadNotificationsCount = computed(() => notifications.value.filter(n => !n.isRead).length);

  function setSession(newToken: string, newProfile: UserProfile, remember: boolean = true) {
    token.value = newToken;
    user.value = newProfile;
    if (remember) {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newProfile));
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, newToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(newProfile));
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    // The cart lives on the server per account; drop the local copy so the next
    // account on this browser cannot inherit these rows.
    try {
      const { resetLocalCart } = useCart();
      resetLocalCart();
    } catch (e) {
      console.warn('[useAuth] Cart reset failed:', e);
    }
    toast.info('You have been logged out securely.', 'Logged Out');
  }

  /**
   * 1. Login Endpoint: POST /api/Users/login
   * Real API call with zero mock fallback via authService.
   * Calls POST /api/Users/save-fcm-token immediately after login.
   */
  async function login(emailOrPhone: string, pass: string, rememberMe: boolean = true): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;

    try {
      const res = await authService.login({
        usernameOrEmail: emailOrPhone,
        password: pass,
        rememberMe
      });

      const data: LoginResponseDto = res.data;

      if (data && data.token) {
        const rawToken = data.token;
        const jwtPayload = parseJwt(rawToken);

        const jwtName =
          jwtPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
          jwtPayload?.name ||
          jwtPayload?.unique_name;
        const jwtRole =
          jwtPayload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
          jwtPayload?.role;

        const jwtId =
          data.id ||
          jwtPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          jwtPayload?.nameid ||
          jwtPayload?.sub ||
          `usr-${Date.now()}`;

        const profile: UserProfile = {
          id: jwtId,
          businessName: data.bussinesName || 'Community Pharmacy',
          fullName: (data as any).fullName || jwtName || data.bussinesName || emailOrPhone.split('@')[0],
          userName: (data as any).userName || (typeof jwtName === 'string' && !jwtName.includes('@') ? jwtName : undefined),
          email: data.email || emailOrPhone,
          phoneNumber: data.phoneNumber || '',
          role: data.role || jwtRole || 'Pharmacy',
          verified: true
        };

        setSession(rawToken, profile, rememberMe);

        // Fetch fresh full user profile from backend API in background
        if (profile.id) {
          fetchUserProfile(profile.id).catch(e => console.warn('[useAuth] Post-login profile sync failed:', e));
          try {
            const { syncGuestCartToServer } = useCart();
            syncGuestCartToServer(profile.id).catch(e => console.warn('[useAuth] Cart sync failed:', e));
          } catch (e) {
            console.warn('[useAuth] Cart sync trigger error:', e);
          }
          try {
            const { fetchFavorites } = useFavorites();
            fetchFavorites(true).catch(e => console.warn('[useAuth] Favorites sync failed:', e));
          } catch (e) {
            console.warn('[useAuth] Favorites sync trigger error:', e);
          }
        }

        // Populate user addresses directly from server response into state
        if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
          const userAddresses: Address[] = data.addresses.map((addr, idx) => ({
            id: addr.id || `addr-${idx}`,
            title: idx === 0 ? 'Primary Pharmacy Branch' : `Pharmacy Branch #${idx + 1}`,
            recipientName: data.bussinesName || 'Licensed Pharmacist',
            phoneNumber: data.phoneNumber || '',
            cityName: 'Cairo',
            areaName: '',
            streetAddress: addr.addressLine || '',
            buildingNumber: '',
            floor: addr.floorNum ? String(addr.floorNum) : '',
            landmark: '',
            deliveryInstructions: '',
            isDefault: idx === 0
          }));
          addresses.value = userAddresses;
          localStorage.setItem(ADDRESSES_KEY, JSON.stringify(userAddresses));
        }

        // Call POST /api/Users/save-fcm-token in background after login
        if (profile.id) {
          syncFcmToken(profile.id).catch(e => console.warn('[useAuth] FCM token sync failed:', e));
        }

        toast.success(`Welcome back, ${profile.businessName}!`, 'Login Successful');
        isLoading.value = false;
        return true;
      }

      throw new Error(data?.message || 'Authentication succeeded but no token was provided.');
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'Invalid credentials. Please verify your email and password.');
      authError.value = errorMsg;
      toast.error(errorMsg, 'Authentication Failed');
      isLoading.value = false;
      return false;
    }
  }

  /**
   * 2. Register Endpoint: POST /api/Users/register
   * Real multipart/form-data call. Direct registration with zero OTP requirement.
   * Immediately establishes session / logs in and calls save-fcm-token.
   */
  async function register(formData: FormData): Promise<{ success: boolean; email: string }> {
    isLoading.value = true;
    authError.value = null;
    const email = (formData.get('Email') as string) || '';
    const password = (formData.get('Password') as string) || '';

    try {
      const res = await authService.register(formData);
      const resData = res.data;

      let registeredUserId = resData?.id || resData?.userId || '';
      let registeredToken = resData?.token || '';

      // 1. If register endpoint returned token and user info directly
      if (registeredToken) {
        const profile: UserProfile = {
          id: registeredUserId || `usr-${Date.now()}`,
          businessName: resData?.bussinesName || (formData.get('BussinesName') as string) || 'Pharmacy',
          fullName: resData?.fullName || (formData.get('FullName') as string) || email.split('@')[0],
          email: resData?.email || email,
          phoneNumber: resData?.phoneNumber || (formData.get('PhoneNumber') as string) || '',
          role: resData?.role || 'Pharmacy',
          verified: true
        };
        setSession(registeredToken, profile);
        await syncFcmToken(profile.id);
      } else if (email && password) {
        // 2. Direct registration with immediate login (no OTP needed)
        try {
          const loginRes = await authService.login({
            usernameOrEmail: email,
            password: password
          });
          const loginData: LoginResponseDto = loginRes.data;
          if (loginData && loginData.token) {
            registeredToken = loginData.token;
            registeredUserId = loginData.id;
            const profile: UserProfile = {
              id: loginData.id || `usr-${Date.now()}`,
              businessName: loginData.bussinesName || (formData.get('BussinesName') as string) || 'Pharmacy',
              fullName: (formData.get('FullName') as string) || email.split('@')[0],
              email: loginData.email || email,
              phoneNumber: loginData.phoneNumber || '',
              role: loginData.role || 'Pharmacy',
              verified: true
            };
            setSession(loginData.token, profile);
            await syncFcmToken(profile.id);
          }
        } catch (loginErr) {
          console.warn('Auto-login after register attempt:', loginErr);
        }
      }

      if (registeredUserId && !registeredToken) {
        await syncFcmToken(registeredUserId);
      }

      if (registeredToken && registeredUserId) {
        try {
          const { syncGuestCartToServer } = useCart();
          syncGuestCartToServer(registeredUserId).catch(e => console.warn('[useAuth] Cart sync failed:', e));
        } catch (e) {
          console.warn('[useAuth] Cart sync trigger error:', e);
        }
      }

      isLoading.value = false;
      const successMsg =
        typeof res.data === 'string' && res.data
          ? res.data
          : 'Registration completed successfully!';
      toast.success(successMsg, 'Registration Successful');
      return { success: true, email };
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'Registration failed. Please verify your details.');
      authError.value = errorMsg;
      toast.error(errorMsg, 'Registration Failed');
      isLoading.value = false;
      return { success: false, email };
    }
  }

  /**
   * 3. Verify OTP Endpoint: POST /api/Users/verify-otp?email=...&code=...
   * Real API call with zero mock fallback via authService.
   */
  async function verifyOtp(email: string, code: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;

    try {
      const res = await authService.verifyOtp(email, code);
      isLoading.value = false;
      const msg =
        typeof res.data === 'string' && res.data
          ? res.data
          : (res.data?.message || 'Your account has been verified successfully!');
      toast.success(msg, 'Account Verified');
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'The code entered is invalid or expired. Please request a new code.');
      authError.value = errorMsg;
      toast.error(errorMsg, 'Verification Failed');
      isLoading.value = false;
      return false;
    }
  }

  /**
   * 4. Forgot Password Endpoint: POST /api/Users/forget-password?email=...
   * Real API call with zero mock fallback via authService.
   */
  async function forgotPassword(email: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;

    try {
      const res = await authService.forgotPassword(email);
      isLoading.value = false;
      const msg =
        typeof res.data === 'string' && res.data
          ? res.data
          : (res.data?.message || `Password reset instructions sent to ${email}`);
      toast.success(msg, 'Reset Instructions Sent');
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'Failed to send password reset instructions.');
      authError.value = errorMsg;
      toast.error(errorMsg, 'Reset Request Failed');
      isLoading.value = false;
      return false;
    }
  }

  /**
   * 5. Reset Password Endpoint: POST /api/Users/reset-password?email=...&newPassword=...
   * Real API call with zero mock fallback via authService.
   */
  async function resetPassword(email: string, newPass: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;

    try {
      const res = await authService.resetPassword(email, newPass);
      isLoading.value = false;
      const msg =
        typeof res.data === 'string' && res.data
          ? res.data
          : (res.data?.message || 'Your password has been reset successfully. You can now login.');
      toast.success(msg, 'Password Reset');
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'Failed to reset password. Please try again.');
      authError.value = errorMsg;
      toast.error(errorMsg, 'Reset Failed');
      isLoading.value = false;
      return false;
    }
  }

  /**
   * 6. Resend OTP Endpoint: POST /api/Users/resend-otp?email=...
   * Real API call with zero mock fallback via authService.
   */
  async function resendOtp(email: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;

    try {
      const res = await authService.resendOtp(email);
      isLoading.value = false;
      const msg =
        typeof res.data === 'string' && res.data
          ? res.data
          : (res.data?.message || `A new verification code has been dispatched to ${email}`);
      toast.success(msg, 'Code Resent');
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, 'Failed to resend verification code.');
      authError.value = errorMsg;
      toast.error(errorMsg, 'Resend Failed');
      isLoading.value = false;
      return false;
    }
  }

  async function fetchUserProfile(userId?: string): Promise<UserProfile | null> {
    const id = userId || user.value?.id;
    if (!id || !token.value) return null;
    try {
      const res = await authService.getUserProfile(id);
      if (res.data) {
        const updated = mapBackendUserToProfile(res.data, user.value);
        user.value = updated;
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
      }
    } catch (err) {
      console.warn('[useAuth] fetchUserProfile error:', err);
    }
    return user.value;
  }

  async function updateProfile(updated: Partial<UserProfile>, file?: File | null): Promise<boolean> {
    if (!user.value) return false;
    user.value = {
      ...user.value,
      ...updated
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));

    if (user.value.id && !user.value.id.startsWith('usr-')) {
      try {
        const fd = new FormData();
        if (updated.businessName !== undefined) fd.append('BussinesName', updated.businessName.trim());
        if (updated.fullName !== undefined) fd.append('FullName', updated.fullName.trim());
        if (updated.phoneNumber !== undefined) fd.append('PhoneNumber', updated.phoneNumber.trim());
        if (file) fd.append('UploudProfileImage', file);

        await authService.updateUserProfile(user.value.id, fd);
        await fetchUserProfile(user.value.id);
        toast.success('Pharmacy profile updated successfully!', 'Profile Saved');
        return true;
      } catch (err: any) {
        console.warn('[useAuth] updateUserProfile server sync error:', err);
        toast.success('Pharmacy profile updated locally.', 'Profile Saved');
        return true;
      }
    } else {
      toast.success('Pharmacy profile updated successfully!', 'Profile Saved');
      return true;
    }
  }

  function saveAddresses() {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses.value));
  }

  async function fetchAddresses() {
    try {
      const serverAddresses = await addressService.getUserAddresses();
      if (Array.isArray(serverAddresses)) {
        addresses.value = serverAddresses;
        saveAddresses();
      }
    } catch {
      //
    }
  }

  async function fetchNotifications() {
    if (!user.value?.id) return;
    try {
      const serverNotifs = await notificationsService.getUserNotifications(user.value.id);
      if (Array.isArray(serverNotifs)) {
        notifications.value = serverNotifs;
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(serverNotifs));
      }
    } catch {
      //
    }
  }

  async function addAddress(newAddr: Omit<Address, 'id'>): Promise<Address | null> {
    const areaId = newAddr.areaId || 1;
    const floorNum = newAddr.floor ? parseInt(newAddr.floor) || 1 : 1;
    const aptNum = newAddr.apartment ? parseInt(newAddr.apartment) || 1 : (newAddr.landmark ? parseInt(newAddr.landmark.replace(/\D/g, '')) || 1 : 1);
    const addressLine = newAddr.streetAddress || '';

    let newlyCreated: Address | null = null;

    try {
      // Real API call: POST /api/Address/insert-address
      await addressService.createAddress({
        addressLine,
        areaId,
        floorNum,
        apartmentNum: aptNum,
        latitude: newAddr.latitude != null ? newAddr.latitude : undefined,
        longitude: newAddr.longitude != null ? newAddr.longitude : undefined
      });

      // Synchronize with backend to retrieve server UUID
      const serverAddresses = await addressService.getUserAddresses();
      if (Array.isArray(serverAddresses) && serverAddresses.length > 0) {
        const matched = serverAddresses.find(s => s.streetAddress === addressLine) || serverAddresses[serverAddresses.length - 1];
        if (matched) {
          matched.title = newAddr.title || matched.title;
          matched.recipientName = newAddr.recipientName || '';
          matched.phoneNumber = newAddr.phoneNumber || '';
          matched.buildingNumber = newAddr.buildingNumber || '';
          matched.floor = newAddr.floor || '';
          matched.apartment = newAddr.apartment || (aptNum ? String(aptNum) : '');
          matched.landmark = newAddr.landmark || '';
          matched.deliveryInstructions = newAddr.deliveryInstructions || '';
          if (newAddr.latitude != null) matched.latitude = newAddr.latitude;
          if (newAddr.longitude != null) matched.longitude = newAddr.longitude;
          if (newAddr.isDefault) {
            serverAddresses.forEach(a => (a.isDefault = a.id === matched.id));
          }
          newlyCreated = matched;
        }
        addresses.value = serverAddresses;
        saveAddresses();
        toast.success(`Added delivery location "${newAddr.title}"`);
        return newlyCreated;
      }
      throw new Error('Address list is empty after creation.');
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to save delivery address');
      toast.error(msg);
      throw err;
    }
  }

  async function updateAddress(id: string, updatedAddr: Partial<Address>): Promise<boolean> {
    const areaId = updatedAddr.areaId || 1;
    const floorNum = updatedAddr.floor ? parseInt(updatedAddr.floor) || 1 : 1;
    const aptNum = updatedAddr.apartment ? parseInt(updatedAddr.apartment) || 1 : (updatedAddr.landmark ? parseInt(updatedAddr.landmark.replace(/\D/g, '')) || 1 : 1);
    const addressLine = updatedAddr.streetAddress || '';

    try {
      // Real API call: PUT /api/Address/update-address/{id}
      await addressService.updateAddress(id, {
        addressLine,
        areaId,
        floorNum,
        apartmentNum: aptNum,
        latitude: updatedAddr.latitude != null ? updatedAddr.latitude : undefined,
        longitude: updatedAddr.longitude != null ? updatedAddr.longitude : undefined
      });

      // Update in local state
      const idx = addresses.value.findIndex(a => a.id === id);
      if (idx !== -1) {
        addresses.value[idx] = {
          ...addresses.value[idx],
          ...updatedAddr,
          streetAddress: addressLine,
          areaId
        };
        if (updatedAddr.isDefault) {
          addresses.value.forEach(a => {
            a.isDefault = a.id === id;
          });
        }
        saveAddresses();
      }

      // Re-fetch to keep state pristine
      await fetchAddresses();
      toast.success('Delivery location updated successfully.');
      return true;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update delivery address');
      toast.error(msg);
      return false;
    }
  }

  async function removeAddress(id: string) {
    const wasDefault = addresses.value.find(a => a.id === id)?.isDefault;
    addresses.value = addresses.value.filter(a => a.id !== id);
    if (wasDefault && addresses.value.length > 0) {
      addresses.value[0].isDefault = true;
    }
    saveAddresses();
    toast.info('Delivery location removed.');

    try {
      // Real API call: DELETE /api/Address/delete-address/{id}
      await addressService.deleteAddress(id);
      await fetchAddresses();
    } catch (err: any) {
      console.warn('[useAuth] deleteAddress backend error:', err);
    }
  }

  function setDefaultAddress(id: string) {
    addresses.value.forEach(a => {
      a.isDefault = a.id === id;
    });
    saveAddresses();
    toast.success('Default delivery address updated.');
  }

  function markNotificationRead(id: string) {
    const item = notifications.value.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.value));
    }
  }

  function markAllNotificationsRead() {
    notifications.value.forEach(n => (n.isRead = true));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.value));
    toast.info('All notifications marked as read.');
  }

  return {
    token,
    user,
    isAuthenticated,
    isLoading,
    authError,
    addresses,
    notifications,
    unreadNotificationsCount,
    login,
    register,
    verifyOtp,
    forgotPassword,
    resetPassword,
    resendOtp,
    logout,
    updateProfile,
    fetchUserProfile,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    fetchAddresses,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    syncFcmToken,
    getOrGenerateFcmToken
  };
}

