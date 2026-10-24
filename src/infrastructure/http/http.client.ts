import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { IStorageService } from '../storage/storage.service';
import { loadingService } from '@/composables/useLoading';

export const API_BASE_URL = 'https://drugzaapi.runasp.net';

export interface HttpRequestConfig extends AxiosRequestConfig {
  silentLoading?: boolean;
}

export interface IHttpClient {
  get<T = any>(url: string, config?: HttpRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: HttpRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>;
  rawInstance: AxiosInstance;
}

export class AxiosHttpClient implements IHttpClient {
  public rawInstance: AxiosInstance;

  constructor(private storageService: IStorageService) {
    this.rawInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 20000,
      headers: {
        'Accept': 'application/json',
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.rawInstance.interceptors.request.use((config) => {
      const token = this.storageService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const isSilent = config.headers?.['X-Silent-Loading'] === 'true' ||
                       config.headers?.['X-Silent-Loading'] === true ||
                       (config as HttpRequestConfig).silentLoading === true;

      if (!isSilent) {
        loadingService.startApiRequest();
      }

      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Response Interceptor
    this.rawInstance.interceptors.response.use(
      (response) => {
        const isSilent = response.config?.headers?.['X-Silent-Loading'] === 'true' ||
                         response.config?.headers?.['X-Silent-Loading'] === true ||
                         (response.config as HttpRequestConfig)?.silentLoading === true;
        if (!isSilent) {
          loadingService.finishApiRequest();
        }

        // Auto parse stringified JSON payloads if returned as text
        if (typeof response.data === 'string' && (response.data.startsWith('{') || response.data.startsWith('['))) {
          try {
            response.data = JSON.parse(response.data);
          } catch {
            // keep raw data
          }
        }

        return response;
      },
      (error) => {
        const isSilent = error.config?.headers?.['X-Silent-Loading'] === 'true' ||
                         error.config?.headers?.['X-Silent-Loading'] === true ||
                         (error.config as HttpRequestConfig)?.silentLoading === true;
        if (!isSilent) {
          loadingService.finishApiRequest();
        }

        const hadAuthorization = Boolean(error.config?.headers?.Authorization);
        if (error.response?.status === 401 && hadAuthorization) {
          this.storageService.clearSession();
          window.dispatchEvent(new Event('drugza:cart-reset'));

          const protectedPaths = ['/checkout', '/orders', '/profile', '/addresses', '/favorites'];
          const isProtected = protectedPaths.some(p => window.location.pathname.startsWith(p));
          if (isProtected) {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.rawInstance.get(url, config);
    return res.data;
  }

  async post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.rawInstance.post(url, data, config);
    return res.data;
  }

  async put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.rawInstance.put(url, data, config);
    return res.data;
  }

  async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.rawInstance.delete(url, config);
    return res.data;
  }

  async patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.rawInstance.patch(url, data, config);
    return res.data;
  }
}
