import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../contexts/NotificationContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import AppIcon from '../components/AppIcon';
import type { AppNotification } from '../types';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const TYPE_LABEL: Record<string, string> = {
  LOW_STOCK: 'Kritik stok',
  OUT_OF_STOCK: 'Stok yok',
  INFO: 'Bilgi',
  SALE: 'Satış',
  ORDER: 'Sipariş',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const typeIcon: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    LOW_STOCK: { name: 'warning-outline', color: colors.orange },
    OUT_OF_STOCK: { name: 'alert-circle-outline', color: colors.red },
    INFO: { name: 'information-circle-outline', color: colors.blue },
    SALE: { name: 'cash-outline', color: colors.green },
    ORDER: { name: 'bag-handle-outline', color: colors.purple },
  };

  const handleNotificationPress = async (notif: AppNotification) => {
    if (!notif.isRead) await markAsRead(notif.id);
    if (notif.productId) {
      navigation.navigate('MainTabs', { screen: 'Stock' });
    }
  };

  const handleDelete = (notif: AppNotification) => {
    Alert.alert('Bildirimi Sil', 'Bu bildirimi ekrandan kaldırmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!notif.isRead) await markAsRead(notif.id);
            await deleteNotification(notif.id);
          } catch {
            Alert.alert('Hata', 'Bildirim silinemedi.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconInfo = typeIcon[item.type] ?? typeIcon.INFO;
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
          <View style={styles.metaRow}>
            <StatusBadge label={TYPE_LABEL[item.type] ?? 'Bildirim'} tone={item.isRead ? 'neutral' : 'warning'} />
            <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.isRead ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              hitSlop={touch.hitSlop}
              activeOpacity={0.8}
            >
              <AppIcon name="delete" size={18} />
              <Text style={styles.deleteText}>Sil</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Başlık + tümünü okundu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={touch.hitSlop}>
          <AppIcon name="back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {notifications.some((n) => !n.isRead) ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} hitSlop={touch.hitSlop}>
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
            <EmptyState
              icon="notifications-off-outline"
              title="Bildirim yok"
              description="Yeni satış, sipariş ve kritik stok bildirimleri burada görünecek."
            />
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    ...shadow.card,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  markAllBtn: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markAllText: { fontSize: 11, fontWeight: '700', color: colors.gold },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  itemUnread: { backgroundColor: colors.surfaceWarm },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginLeft: 6 },
  itemMessage: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 6 },
  itemDate: { fontSize: 11, color: colors.faint },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.redBg,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  deleteText: { fontSize: 11, color: colors.red, fontWeight: '800' },

  separator: { height: 1, backgroundColor: colors.borderSoft },

  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: colors.faint, fontWeight: '500' },
});
