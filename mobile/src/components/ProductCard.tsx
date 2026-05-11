import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import { radius, shadow, spacing, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon from './AppIcon';

interface Props {
  product: Product;
  onPress: () => void;
  isSelected: boolean;
}

export default function ProductCard({ product, onPress, isSelected }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const scale = useRef(new Animated.Value(1)).current;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.04 : 1,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [isSelected, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          isOutOfStock && styles.cardDim,
        ]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Ürün görseli */}
        <View style={styles.imageWrap}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <AppIcon name="perfume" size={42} />
            </View>
          )}
          {isOutOfStock ? <View style={styles.imageVeil} /> : null}
        </View>

        {/* Ürün bilgisi */}
        <View style={styles.info}>
          <Text style={[styles.name, isOutOfStock && styles.nameDim]} numberOfLines={2}>
            {product.name}
          </Text>
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

        {/* Seçim göstergesi */}
        {isSelected && (
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark-circle" size={22} color={colors.gold} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
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
  },
  cardSelected: {
    borderColor: colors.gold,
    ...shadow.lifted,
  },
  cardDim: {
    opacity: 0.65,
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  imageVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  info: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  nameDim: { color: colors.muted },
  category: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
    marginBottom: 2,
  },
  checkWrap: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});
