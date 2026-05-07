import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationsApi } from '../services/api';
import { useAuth } from './AuthContext';
import type { AppNotification } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const setupAndroidChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('veor-alerts', {
      name: 'Stok Uyarıları',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
    });
  }
};

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

const POLL_INTERVAL = 30_000;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationsApi.getAll();
      if (!res.success || !res.data) return;

      const incoming = res.data;

      // Yeni LOW_STOCK / OUT_OF_STOCK → uygulama içi lokal bildirim
      const newAlerts = incoming.filter(
        (n) =>
          !seenIdsRef.current.has(n.id) &&
          (n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK')
      );
      for (const alert of newAlerts) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: alert.title,
            body: alert.message,
            data: { notificationId: alert.id },
          },
          trigger: null,
        });
      }

      seenIdsRef.current = new Set(incoming.map((n) => n.id));
      setNotifications(incoming);
    } catch {
      // Polling sırasında ağ hatası → sessizce geç
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      seenIdsRef.current = new Set();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setupAndroidChannel();
    Notifications.requestPermissionsAsync();
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
