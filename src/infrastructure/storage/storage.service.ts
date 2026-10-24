import type { UserProfile } from '@/core/domain/entities';

export interface IStorageService {
  getToken(): string | null;
  setToken(token: string, remember?: boolean): void;
  removeToken(): void;
  getUser(): UserProfile | null;
  setUser(user: UserProfile, remember?: boolean): void;
  removeUser(): void;
  getItem<T = string>(key: string): T | null;
  setItem<T = unknown>(key: string, value: T, persistent?: boolean): void;
  removeItem(key: string): void;
  clearSession(): void;
}

export class LocalStorageService implements IStorageService {
  private readonly TOKEN_KEY = 'drugza_token';
  private readonly USER_KEY = 'drugza_user';

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string, remember = true): void {
    try {
      if (remember) {
        localStorage.setItem(this.TOKEN_KEY, token);
        sessionStorage.removeItem(this.TOKEN_KEY);
      } else {
        sessionStorage.setItem(this.TOKEN_KEY, token);
        localStorage.removeItem(this.TOKEN_KEY);
      }
    } catch (e) {
      console.warn('[LocalStorageService] Failed to set token', e);
    }
  }

  removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_KEY);
    } catch (e) {
      console.warn('[LocalStorageService] Failed to remove token', e);
    }
  }

  getUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setUser(user: UserProfile, remember = true): void {
    try {
      const str = JSON.stringify(user);
      if (remember) {
        localStorage.setItem(this.USER_KEY, str);
        sessionStorage.removeItem(this.USER_KEY);
      } else {
        sessionStorage.setItem(this.USER_KEY, str);
        localStorage.removeItem(this.USER_KEY);
      }
    } catch (e) {
      console.warn('[LocalStorageService] Failed to set user', e);
    }
  }

  removeUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    } catch (e) {
      console.warn('[LocalStorageService] Failed to remove user', e);
    }
  }

  getItem<T = string>(key: string): T | null {
    try {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!val) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    } catch {
      return null;
    }
  }

  setItem<T = unknown>(key: string, value: T, persistent = true): void {
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      if (persistent) {
        localStorage.setItem(key, str);
      } else {
        sessionStorage.setItem(key, str);
      }
    } catch (e) {
      console.warn(`[LocalStorageService] Failed to set item ${key}`, e);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[LocalStorageService] Failed to remove item ${key}`, e);
    }
  }

  clearSession(): void {
    this.removeToken();
    this.removeUser();
  }
}
