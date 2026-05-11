import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Order } from '../types';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon from './AppIcon';

interface Props {
  order: Order;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderItem({ order, onComplete, onCancel }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const productName = order.product?.name ?? 'Bilinmeyen Ürün';
  const productPrice = order.product?.price;

  const handleComplete = () => {
    Alert.alert(
      'Sipariş Hazır',
      `"${productName}" siparişini hazır olarak işaretlemek istiyor musunuz?\nSipariş listeden kaldırılacak; stok ve satış etkilenmeyecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hazır',
          onPress: () => onComplete(order.id),
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Siparişi İptal Et',
      `"${productName}" siparişini iptal etmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: () => onCancel(order.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Sol: görsel */}
      <View style={styles.imageWrap}>
        <View style={styles.imagePlaceholder}>
          <AppIcon name="orders" size={38} />
        </View>
      </View>

      {/* Orta: bilgi */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{productName}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge tone="info" icon="bag-handle-outline" label="Bekliyor" />
          <StatusBadge tone="neutral" label={`${order.quantity} adet`} />
        </View>
        <Text style={styles.category}>{order.product?.category === 'WOMEN' ? 'Kadın' : 'Erkek'} parfüm</Text>
        {productPrice != null && (
          <Text style={styles.price}>
            {formatCurrency(Number(productPrice) * order.quantity)}
          </Text>
        )}
        {order.customerNote ? (
          <View style={styles.noteRow}>
            <Ionicons name="chatbubble-outline" size={11} color={colors.muted} />
            <Text style={styles.note} numberOfLines={1}>{order.customerNote}</Text>
          </View>
        ) : null}
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Sağ: aksiyonlar */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8} hitSlop={touch.hitSlop}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.completeBtnText}>Hazır</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8} hitSlop={touch.hitSlop}>
          <Ionicons name="close" size={14} color={colors.red} />
          <Text style={styles.cancelBtnText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 10,
    marginHorizontal: 16,
    padding: spacing.md,
    ...shadow.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  note: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
    flex: 1,
  },
  date: {
    fontSize: 10,
    color: colors.faint,
    marginTop: 2,
  },
  actions: {
    justifyContent: 'center',
    gap: 6,
    marginLeft: 8,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.redBg,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.red,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.red,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
});
