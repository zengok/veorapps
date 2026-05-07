import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface Props {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function StockProductCard({ product, onEdit, onDelete }: Props) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <View
      style={[
        styles.card,
        isOutOfStock && styles.cardOutOfStock,
        isLowStock && styles.cardLowStock,
      ]}
    >
      {/* Görsel */}
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="flower-outline" size={26} color="#c9a961" />
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>STOK YOK</Text>
          </View>
        )}
      </View>

      {/* Bilgi */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.category}>
          {product.category === 'WOMEN' ? 'Kadın' : 'Erkek'}
        </Text>
        <Text style={styles.price}>{formatCurrency(Number(product.price))}</Text>
        <View style={styles.stockRow}>
          <Ionicons
            name="cube-outline"
            size={12}
            color={isOutOfStock ? '#d32f2f' : isLowStock ? '#f57c00' : '#2e7d32'}
          />
          <Text
            style={[
              styles.stock,
              isOutOfStock && styles.stockZero,
              isLowStock && styles.stockLow,
            ]}
          >
            {isOutOfStock ? 'Stok yok' : `${product.stock} adet`}
            {isLowStock ? ' (Kritik!)' : ''}
          </Text>
        </View>
      </View>

      {/* Aksiyonlar */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(product)}
          activeOpacity={0.75}
        >
          <Ionicons name="create-outline" size={18} color="#5c6bc0" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(product)}
          activeOpacity={0.75}
        >
          <Ionicons name="trash-outline" size={18} color="#d32f2f" />
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
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    alignItems: 'center',
  },
  cardOutOfStock: {
    borderColor: '#d32f2f',
    backgroundColor: '#fff8f8',
  },
  cardLowStock: {
    borderColor: '#f57c00',
    backgroundColor: '#fffbf5',
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: 72, height: 72 },
  imagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#fdf6e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  info: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  category: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c9a961',
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stock: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  stockZero: { color: '#d32f2f' },
  stockLow: { color: '#f57c00' },
  actions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef0fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fdeaea',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
