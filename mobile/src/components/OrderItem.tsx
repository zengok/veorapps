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
  const productName = order.product?.name ?? 'Bilinmeyen Ürün';
  const productPrice = order.product?.price;

  const handleComplete = () => {
    Alert.alert(
      'Siparişi Tamamla',
      `"${productName}" siparişini tamamlandı olarak işaretlemek istiyor musunuz?\nSatış kaydı otomatik oluşturulacak.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hazırlandı ✓',
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
          <Ionicons name="flower-outline" size={28} color="#c9a961" />
        </View>
      </View>

      {/* Orta: bilgi */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{productName}</Text>
        <Text style={styles.category}>
          {order.product?.category === 'WOMEN' ? 'Kadın' : 'Erkek'} • {order.quantity} adet
        </Text>
        {productPrice != null && (
          <Text style={styles.price}>
            {formatCurrency(Number(productPrice) * order.quantity)}
          </Text>
        )}
        {order.customerNote ? (
          <View style={styles.noteRow}>
            <Ionicons name="chatbubble-outline" size={11} color="#aaa" />
            <Text style={styles.note} numberOfLines={1}>{order.customerNote}</Text>
          </View>
        ) : null}
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Sağ: aksiyonlar */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.completeBtnText}>Hazır</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
          <Ionicons name="close" size={14} color="#d32f2f" />
          <Text style={styles.cancelBtnText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#c9a961',
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#fdf6e3',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c9a961',
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
    color: '#aaa',
    fontStyle: 'italic',
    flex: 1,
  },
  date: {
    fontSize: 10,
    color: '#ccc',
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
    backgroundColor: '#2e7d32',
    borderRadius: 8,
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
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ffd0d0',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d32f2f',
  },
});
