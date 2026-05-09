import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from './prisma';

const expo = new Expo();

/**
 * Sistemdeki tüm kullanıcıların Expo push token'larını alır
 * ve hepsine bildirim gönderir.
 */
export async function sendPushToAll(title: string, body: string, data?: Record<string, unknown>) {
  try {
    const users = await prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { pushToken: true },
    });

    const tokens = users
      .map((u) => u.pushToken!)
      .filter((t) => Expo.isExpoPushToken(t));

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
      priority: 'high',
    }));

    // Expo'nun chunk sınırını aşmamak için böl
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        console.error('[Push] Chunk gönderme hatası:', err);
      }
    }
  } catch (err) {
    console.error('[Push] sendPushToAll hatası:', err);
  }
}
