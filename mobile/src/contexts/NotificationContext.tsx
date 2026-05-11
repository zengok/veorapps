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
import Constants from 'expo-constants';
import { notificationsApi, pushTokenApi } from '../services/api';
import { useAuth } from './AuthContext';
import type { AppNotification } from '../types';

// Bildirim geldiğinde ekranda göster, ses çal
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const setupAndroidChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('veor-alerts', {
      name: 'Veor Bildirimler',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
};

async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Bildirim izni reddedildi');
      return null;
    }

    const projectId =
      process.env.EXPO_PUBLIC_PROJECT_ID ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Push] EAS projectId bulunamadı');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (err) {
    console.error('[Push] Token alınamadı:', err);
    return null;
  }
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

const POLL_INTERVAL = 20_000; // 20 saniyede bir polling

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

      // Yeni LOW_STOCK / OUT_OF_STOCK uyarıları → ek lokal bildirim (polling backup)
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
            sound: 'default',
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

    let cancelled = false;

    const init = async () => {
      await setupAndroidChannel();

      // Push token al ve backend'e kaydet
      const token = await registerForPushNotifications();
      if (token && !cancelled) {
        try {
          await pushTokenApi.register(token);
          console.log('[Push] Token kaydedildi:', token);
        } catch (err) {
          console.warn('[Push] Token kaydedilemedi:', err);
        }
      }

      if (!cancelled) {
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
      }
    };

    init();

    return () => {
      cancelled = true;
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

  const deleteNotification = async (id: string) => {
    await notificationsApi.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    seenIdsRef.current.delete(id);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
