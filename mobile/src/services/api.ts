import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ApiResponse,
  User,
  Product,
  Sale,
  SalesListResponse,
  Order,
  DashboardData,
  AppNotification,
  Category,
  OrderStatus,
} from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({ baseURL: BASE_URL, timeout: 10_000 });

// ── 401 callback (AuthContext tarafından kaydedilir) ────────────────────────
type UnauthorizedHandler = () => void;
let _onUnauthorized: UnauthorizedHandler | null = null;
export const setOnUnauthorized = (cb: UnauthorizedHandler) => {
  _onUnauthorized = cb;
};

// ── Request interceptor: token ekle ─────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@veor_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: 401 → logout ──────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['@veor_token', '@veor_user']);
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      { email, password }
    );
    return data;
  },
  me: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data;
  },
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: async (category?: Category | 'ALL') => {
    const { data } = await api.get<ApiResponse<Product[]>>('/products', {
      params: category ? { category } : undefined,
    });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data;
  },
  create: async (formData: FormData) => {
    const { data } = await api.post<ApiResponse<Product>>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async (id: string, formData: FormData) => {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/products/${id}`);
    return data;
  },
};

// ── Sales ─────────────────────────────────────────────────────────────────────
export const salesApi = {
  create: async (productId: string, quantity: number) => {
    const { data } = await api.post<ApiResponse<Sale>>('/sales', { productId, quantity });
    return data;
  },
  getAll: async (params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const { data } = await api.get<ApiResponse<SalesListResponse>>('/sales', { params });
    return data;
  },
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: async (productId: string, quantity: number, customerNote?: string) => {
    const { data } = await api.post<ApiResponse<Order>>('/orders', {
      productId,
      quantity,
      customerNote,
    });
    return data;
  },
  getAll: async (status?: OrderStatus) => {
    const { data } = await api.get<ApiResponse<Order[]>>('/orders', {
      params: status ? { status } : undefined,
    });
    return data;
  },
  complete: async (id: string) => {
    const { data } = await api.patch<ApiResponse<{ order: Order; sale: Sale }>>(
      `/orders/${id}/complete`
    );
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/orders/${id}`);
    return data;
  },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: async () => {
    const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return data;
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<AppNotification[]>>('/notifications');
    return data;
  },
  markAsRead: async (id: string) => {
    const { data } = await api.patch<ApiResponse<AppNotification>>(
      `/notifications/${id}/read`
    );
    return data;
  },
  markAllAsRead: async () => {
    const { data } = await api.patch<ApiResponse<null>>('/notifications/read-all');
    return data;
  },
};
