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

interface Props {
  product: Product;
  onPress: () => void;
  isSelected: boolean;
}

export default function ProductCard({ product, onPress, isSelected }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isOutOfStock = product.stock === 0;

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
              <Ionicons name="flower-outline" size={30} color="#c9a961" />
            </View>
          )}
          {/* Stok rozeti */}
          {isOutOfStock && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>STOKTA YOK</Text>
            </View>
          )}
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
          <Text style={[styles.stock, isOutOfStock && styles.stockZero]}>
            {isOutOfStock ? 'Stok yok' : `${product.stock} adet`}
          </Text>
        </View>

        {/* Seçim göstergesi */}
        {isSelected && (
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark-circle" size={22} color="#c9a961" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
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
  },
  cardSelected: {
    borderColor: '#c9a961',
    elevation: 5,
    shadowOpacity: 0.15,
  },
  cardDim: {
    opacity: 0.65,
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
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
    backgroundColor: '#fdf6e3',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  stockBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  nameDim: { color: '#999' },
  category: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9a961',
    marginBottom: 2,
  },
  stock: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  stockZero: { color: '#d32f2f' },
  checkWrap: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});
