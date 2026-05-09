export type Category = 'WOMEN' | 'MEN';
export type OrderStatus = 'PENDING' | 'COMPLETED';
export type NotificationType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INFO' | 'SALE' | 'ORDER';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name' | 'category'>;
  user?: Pick<User, 'id' | 'name'>;
}

export interface Order {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  status: OrderStatus;
  customerNote: string | null;
  createdAt: string;
  completedAt: string | null;
  product?: Pick<Product, 'id' | 'name' | 'category' | 'price'>;
  user?: Pick<User, 'id' | 'name'>;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  productId: string | null;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name'> | null;
}

export interface DashboardData {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  dailyRevenue: number;
  totalStockValue: number;
  totalProducts: number;
  lowStockCount: number;
  unreadNotifications: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SalesListResponse {
  sales: Sale[];
  total: number;
}
