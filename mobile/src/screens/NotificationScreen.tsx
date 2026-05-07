import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../contexts/NotificationContext';
import type { AppNotification } from '../types';

const TYPE_ICON: Record<AppNotification['type'], { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  LOW_STOCK: { name: 'warning-outline', color: '#f57c00' },
  OUT_OF_STOCK: { name: 'alert-circle-outline', color: '#d32f2f' },
  INFO: { name: 'information-circle-outline', color: '#1565c0' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationPress = async (notif: AppNotification) => {
    if (!notif.isRead) await markAsRead(notif.id);
    if (notif.productId) {
      navigation.navigate('MainTabs', { screen: 'Stock' });
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconInfo = TYPE_ICON[item.type] ?? TYPE_ICON.INFO;
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconInfo.color + '18' }]}>
          <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Başlık + tümünü okundu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={22} color="#c9a961" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {notifications.some((n) => !n.isRead) ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Tümünü Okundu</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="notifications-off-outline" size={52} color="#ddd" />
            <Text style={styles.emptyText}>Bildirim yok</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  markAllBtn: {
    backgroundColor: '#fff8e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e8d5a3',
  },
  markAllText: { fontSize: 11, fontWeight: '700', color: '#c9a961' },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemUnread: { backgroundColor: '#fffbf0' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c9a961', marginLeft: 6 },
  itemMessage: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 4 },
  itemDate: { fontSize: 11, color: '#bbb' },

  separator: { height: 1, backgroundColor: '#f5f5f5' },

  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: '#bbb', fontWeight: '500' },
});
