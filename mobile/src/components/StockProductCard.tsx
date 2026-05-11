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
import StatusBadge from './StatusBadge';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon from './AppIcon';

interface Props {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function StockProductCard({ product, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
            <Ionicons name="flower-outline" size={26} color={colors.gold} />
          </View>
        )}
        {isOutOfStock ? <View style={styles.imageVeil} /> : null}
      </View>

      {/* Bilgi */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.category}>
          {product.category === 'WOMEN' ? 'Kadın' : 'Erkek'}
        </Text>
        <Text style={styles.price}>{formatCurrency(Number(product.price))}</Text>
        <StatusBadge
          tone={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
          icon={isOutOfStock ? 'alert-circle-outline' : 'cube-outline'}
          label={isOutOfStock ? 'Stok yok' : isLowStock ? `${product.stock} adet kritik` : `${product.stock} adet`}
        />
      </View>

      {/* Aksiyonlar */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEdit(product)}
          activeOpacity={0.75}
          hitSlop={touch.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`${product.name} ürününü düzenle`}
        >
          <AppIcon name="edit" size={22} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(product)}
          activeOpacity={0.75}
          hitSlop={touch.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`${product.name} ürününü sil`}
        >
          <AppIcon name="delete" size={22} />
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
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    ...shadow.card,
    alignItems: 'center',
  },
  cardOutOfStock: {
    borderColor: colors.red,
    backgroundColor: colors.redBg,
  },
  cardLowStock: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeBg,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: 72, height: 72 },
  imagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  info: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  category: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gold,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.blueBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.redBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
